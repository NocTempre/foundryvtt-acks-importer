/**
 * A recipe's page coordinates only mean something in the book they were
 * measured against. Nothing at runtime can notice when they disagree: an entry
 * is read from `entry.book` alone, the instruction set has no cross-document
 * read, and the only correctness gate is the `expect` probe on the name — which
 * keeps passing while some other field quietly reads a different book. So the
 * agreement is asserted here, over the shipped data, with no PDFs and no Foundry.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COOKBOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "cookbook");

let pass = 0;
const check = (label, cond) => {
  assert.ok(cond, label);
  pass++;
};

/** Every entry in every cookbook, tagged with the book it will be read from. */
const entries = new Map();
for (const f of fs.readdirSync(COOKBOOK).filter((n) => n.endsWith(".json") && n !== "registers.json" && n !== "index.json")) {
  const c = JSON.parse(fs.readFileSync(path.join(COOKBOOK, f), "utf8"));
  // A book cookbook names its book once at the top; a content cookbook (powers,
  // equipment, …) spans books and names one per entry.
  const fileBook = typeof c.book === "string" ? c.book : c.book?.id;
  for (const [id, e] of Object.entries(c.entries ?? {})) entries.set(id, { ...e, id, file: f, book: e.book ?? fileBook });
}
check("the shipped cookbook has entries to check", entries.size > 1000);

/* An alias is its own ability whose rules text prints under another entry, so
 * its recipe carries a pointer to the target's passage. That pointer is
 * geometry: the alias must therefore be read from the book the passage prints
 * in, not from the book that merely lists the name. When these disagreed, 31
 * Judges Journal powers carried Revised Rulebook rectangles and every one of
 * them extracted whatever the JJ happened to print at those coordinates —
 * poison tables and proficiency-throw rules under the name of a class power. */
const aliases = [...entries.values()].filter((e) => e.aliasOf);
check("the cookbook still ships aliases", aliases.length > 0);

for (const e of aliases) {
  const t = entries.get(e.aliasOf);
  check(`${e.id}: alias target ${e.aliasOf} exists`, !!t);
  check(`${e.id}: is read from the book its text prints in (${t?.book}), not ${e.book}`, t?.book === e.book);
}

/* The citation is what the sheet shows a reader, and the book is what the
 * module opens to fill it. A disagreement between them is the same defect
 * wearing its user-visible face: the stub says "RR p.95" while only the JJ can
 * unlock the entry, so the seat that owns the cited book gets no text and the
 * seat that owns the other one gets the wrong text. */
const CITE_BOOK = /^([A-Za-z0-9]+)\s+p\./;
for (const e of entries.values()) {
  if (!e.cite || !e.book) continue;
  const m = CITE_BOOK.exec(e.cite);
  if (!m) continue;
  check(`${e.id}: cite "${e.cite}" names the book it is read from (${e.book})`, m[1].toLowerCase() === e.book.toLowerCase());
}

console.log(`\ntest-cookbook-coherence: all ${pass} checks passed`);
