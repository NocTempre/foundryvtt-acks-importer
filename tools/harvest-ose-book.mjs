/**
 * DEV-ONLY (chef-side): seed an authored OSE book's register from the locator.
 *
 * A cookbook entry for a creature is a BOX and a name. The locator already
 * finds most of them — 93% of the corpus at last sweep — so for an authored
 * book the boxes do not need typing out: this walks the book, takes every
 * candidate the locator is confident about, and writes the register rows.
 *
 * What it deliberately does NOT emit is the part that needs judgement:
 * - a candidate the locator flagged (another game's block, or two read as one)
 *   is REPORTED and skipped, because a box drawn around the wrong thing is
 *   worse than no box at all;
 * - prose and art boxes are left for the chef, since which paragraph belongs
 *   to which creature is a reading of the page, not a measurement of it.
 *
 * So the output is a floor, not a finished register: it turns "author 565
 * entries" into "review 565 boxes and hand-author the few dozen the locator
 * could not see". Re-running is safe — existing rows are kept by id and only
 * new ones are added, so a chef's hand edits survive.
 *
 * IP: emits geometry and a name, never values or prose. The name comes from
 * the book's own heading, which is a locator, and is capped like every other
 * register string.
 *
 * Usage:
 *   node tools/harvest-ose-book.mjs qd1            report only
 *   node tools/harvest-ose-book.mjs qd1 --write    write register/qd1/
 *   node tools/harvest-ose-book.mjs qd1 --pages 8-9
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openBook, pageItems, listHeadings } from "../scripts/extract.mjs";
import { findStatBlocks } from "../scripts/ose-blocks.mjs";
import { parseOseStatline } from "../scripts/ose-statline.mjs";
import { BOOKS } from "../scripts/books.mjs";
import { OSE_FILES } from "./reference-lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const BOOK = argv.find((a) => !a.startsWith("--"));
const WRITE = argv.includes("--write");
const RANGE = (() => {
  const i = argv.indexOf("--pages");
  if (i < 0 || !argv[i + 1]) return null;
  const [a, b] = argv[i + 1].split("-").map(Number);
  return { from: a, to: b ?? a };
})();

if (!BOOK || !OSE_FILES[BOOK]) {
  console.error(`usage: node tools/harvest-ose-book.mjs <${Object.keys(OSE_FILES).join("|")}> [--write] [--pages A-B]`);
  process.exit(1);
}
const file = OSE_FILES[BOOK];
if (!fs.existsSync(file)) {
  console.error(`harvest-ose-book: ${BOOK} is not on this machine — skipped.`);
  process.exit(0);
}

/**
 * Undo small-caps typography in a heading.
 *
 * A small-caps heading is set as full capitals for the first letter of each
 * word and reduced capitals for the rest, so extraction reads "appRentiCes"
 * where the page shows "Apprentices" — the case pattern is the typeface, not
 * the spelling. Detected by the giveaway a real title never has: a capital
 * following a lower-case letter inside a word, or a word starting lower-case.
 * Left alone otherwise, so "The Isle of the Plangent Mage" keeps its own case.
 */
function fixSmallCaps(s) {
  const t = String(s ?? "").trim();
  if (!t) return t;
  const mangled = /[a-z][A-Z]/.test(t) || /(^|\s)[a-z]/.test(t.replace(/(^|\s)(of|the|and|a|an|to|in)\b/gi, "$1X"));
  if (!mangled) return t;
  return t
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\b(Of|The|And|A|An|To|In)\b/g, (w, _m, i) => (i === 0 ? w : w.toLowerCase()));
}

/** Register id slug, matching the family's camel-cased convention. */
const slugOf = (s) =>
  String(s ?? "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join("")
    .slice(0, 40);

const { doc, numPages } = await openBook(fs.readFileSync(file));
const from = RANGE?.from ?? 1;
const to = Math.min(RANGE?.to ?? numPages, numPages);

const rows = [];
const skipped = [];
const seen = new Set();

for (let page = from; page <= to; page++) {
  let pd;
  try {
    pd = await pageItems(doc, page);
  } catch {
    continue;
  }
  const heads = listHeadings(pd).filter((h) => h.mode === "display");
  const candidates = findStatBlocks(pd);

  for (const c of candidates) {
    if (c.suspectLineage || c.mergedBlocks) {
      skipped.push({ page, why: c.suspectLineage ? "another game's block" : "two blocks read as one", text: c.text.slice(0, 60) });
      continue;
    }
    // The name: what the block called itself, else the nearest display heading
    // above it in the same column.
    const parsed = parseOseStatline(c.text);
    const above = heads
      .filter((h) => h.y < c.box.y0 && Math.abs((h.col ?? 0) - c.col) < 1)
      .sort((a, b) => b.y - a.y)[0];
    const name = fixSmallCaps((parsed.name || above?.text || "").replace(/\s+/g, " ").trim()).slice(0, 58);
    if (!name) {
      skipped.push({ page, why: "no name found above or in the block", text: c.text.slice(0, 60) });
      continue;
    }
    let id = `${BOOK}.${slugOf(name)}`;
    let n = 2;
    while (seen.has(id)) id = `${BOOK}.${slugOf(name)}${n++}`;
    seen.add(id);

    rows.push({
      id,
      kind: "kind.oseMonster",
      book: BOOK,
      name,
      // The anchor is what the PAGE says, not the tidied name: an expect must
      // match the extraction byte for byte.
      anchor: { display: (above?.text ?? name).slice(0, 58) },
      pages: [page],
      assists: { block: { page, box: c.box } },
    });
  }
}

console.error(`${BOOK}: ${rows.length} creature box(es) across pages ${from}-${to}`);
for (const s of skipped) console.error(`  skipped p.${s.page} — ${s.why}`);
if (skipped.length) console.error(`  (${skipped.length} need hand authoring; the locator would not vouch for them)`);

if (!WRITE) {
  for (const r of rows.slice(0, 12)) console.error(`  ${r.id}  p.${r.pages[0]}`);
  console.error(`\n(dry run — pass --write to emit register/${BOOK}/)`);
  process.exit(0);
}

const dir = path.join(HERE, "..", "register", BOOK);
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `p${from}-p${to}-creatures.json`);
// Keep whatever a chef has already hand-authored: merge by id, existing wins.
const existing = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : [];
const byId = new Map(existing.map((e) => [e.id, e]));
let added = 0;
for (const r of rows) {
  if (byId.has(r.id)) continue;
  byId.set(r.id, r);
  added++;
}
fs.writeFileSync(out, JSON.stringify([...byId.values()], null, 2) + "\n");
console.error(`wrote ${out} — ${added} new, ${existing.length} kept`);
