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
import { openBook, pageItems, listHeadings, pageArtPlacements } from "../scripts/extract.mjs";
import { findStatBlocks, runinLabelAbove } from "../scripts/ose-blocks.mjs";
import { parseOseStatline, PROFILES, OSE_CANONICAL } from "../scripts/ose-statline.mjs";
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
  // A heading set entirely in capitals is typography too — an index-style
  // bestiary head reads "BURROWING BEETLE, GIANT" where the page shows a
  // small-caps line, and an actor should not shout its own name.
  const allCaps = /[A-Z]/.test(t) && !/[a-z]/.test(t);
  const mangled =
    allCaps || /[a-z][A-Z]/.test(t) || /(^|\s)[a-z]/.test(t.replace(/(^|\s)(of|the|and|a|an|to|in)\b/gi, "$1X"));
  if (!mangled) return t;
  return t
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\b(Of|The|And|A|An|To|In)\b/g, (w, _m, i) => (i === 0 ? w : w.toLowerCase()));
}

/**
 * Why this string is not a creature name, or null when it is plausibly one.
 *
 * The heading above a block is not always the creature's. Two shapes defeat it,
 * and both produce an actor whose name is the first thing a Judge reads and the
 * last thing they think to check:
 *
 * - a bestiary that sets descriptive prose large enough to pass for a heading,
 *   giving "And Bony Claws. Servants of Grim, Forgotten Gods, Doomed t";
 * - a keyed adventure, where the nearest heading is the ROOM ("13. Hallway")
 *   and the creature is named — if at all — inside the block itself.
 *
 * So a name is short, unpunctuated, does not open mid-sentence, and never
 * carries an area key. A block that fails goes to the chef rather than to the
 * world: no name is a gap a human closes, a wrong name is one nobody sees.
 */
function nameProblem(s) {
  const t = String(s ?? "").trim();
  if (!t) return "empty";
  if (/^\d+\s*[.)]/.test(t) || /^\d+\s+[-–—]/.test(t)) return "area key, not a creature name";
  if (t.length > 42 || t.split(/\s+/).length > 5) return "too long for a name";
  // Sentence punctuation inside means a sentence was captured, not a name.
  if (/[.;:!?]/.test(t.slice(0, -1))) return "sentence punctuation";
  // A name is not a sentence, so it does not end in a full stop, and it does
  // not join its parts with a conjunction ("Ravines, and Tangled Woods").
  if (/\.$/.test(t)) return "ends a sentence";
  if (/,\s*(and|or)\b/i.test(t)) return "reads as a list";
  // A name may open with an article; it never opens with a conjunction or a
  // preposition, which is exactly what a mid-sentence capture does.
  if (/^(and|or|but|with|for|from|in|on|at|to|of|they|it|its|their)\b/i.test(t)) return "opens mid-sentence";
  // Two or more commas is a list, not a name ("Mud Pools, and Lightless Caverns").
  if ((t.match(/,/g) ?? []).length > 1) return "reads as a list";
  return null;
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

// A book that declares a dialect is LOCATED with it too: the labels a profile
// adds are what make its blocks countable as blocks.
const PROFILE = PROFILES[BOOKS[BOOK]?.profile] ?? OSE_CANONICAL;

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
  const candidates = findStatBlocks(pd, PROFILE);

  // Illustrations on this page, worth associating with a creature. A placement
  // covering most of the page is a background or a full-bleed spread, and a
  // small one is a rule, a bullet or a border ornament — neither is a portrait.
  let placements = [];
  try {
    const pageArea = (pd.width ?? 612) * (pd.height ?? 792);
    placements = (await pageArtPlacements(doc, page)).filter(
      (a) => a.w >= 80 && a.h >= 80 && a.w * a.h < pageArea * 0.7,
    );
  } catch {
    placements = [];
  }

  // Each illustration belongs to ONE creature — the block nearest it — rather
  // than each creature taking the illustration nearest itself. The difference is
  // not cosmetic: a bestiary page carries four stat blocks and one picture, and
  // nearest-picture-per-creature hands that picture to all four. Matching the
  // other way round leaves three creatures with no art, which is right, because
  // the page gave them none.
  const artFor = new Map();
  for (const a of placements) {
    const mid = a.y + a.h / 2;
    let best = null;
    let bestD = Infinity;
    for (const c of candidates) {
      const d = Math.abs((c.box.y0 + c.box.y1) / 2 - mid);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    if (!best) continue;
    const held = artFor.get(best);
    if (!held || bestD < held.d) artFor.set(best, { a, d: bestD });
  }

  for (const c of candidates) {
    if (c.suspectLineage || c.mergedBlocks) {
      skipped.push({ page, why: c.suspectLineage ? "another game's block" : "two blocks read as one", text: c.text.slice(0, 60) });
      continue;
    }
    // The name: what the block called itself, else the nearest display heading
    // above it in the same column.
    const parsed = parseOseStatline(c.text, PROFILE);
    const above = heads
      .filter((h) => h.y < c.box.y0 && Math.abs((h.col ?? 0) - c.col) < 1)
      .sort((a, b) => b.y - a.y)[0];
    // Preference order, cheapest evidence first: what the block called itself,
    // then the run-in label a keyed adventure sets over it, then the display
    // heading a bestiary sets over it. The heading is last because it is the
    // one that can belong to something other than this creature.
    const runin = runinLabelAbove(pd, c);
    const name = fixSmallCaps((parsed.name || runin || above?.text || "").replace(/\s+/g, " ").trim()).slice(0, 58);
    if (!name) {
      skipped.push({ page, why: "no name found above or in the block", text: c.text.slice(0, 60) });
      continue;
    }
    const problem = nameProblem(name);
    if (problem) {
      skipped.push({ page, why: `${problem}: "${name.slice(0, 40)}"`, text: c.text.slice(0, 40) });
      continue;
    }
    const art = artFor.get(c)?.a;

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
      assists: {
        block: { page, box: c.box },
        // The nearest surviving illustration, by vertical distance to the
        // block. Its XObject NAME is the association that matters: a page with
        // two creatures has two images, and the largest-image rule would give
        // both of them the same one.
        ...(art ? { art: { page, name: art.name, box: { x0: art.x, x1: art.x + art.w, y0: art.y, y1: art.y + art.h } } } : {}),
      },
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
