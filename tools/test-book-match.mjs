/** Pairing picked files to books, and telling a book by its fingerprint. No PDFs, no Foundry. */
import assert from "node:assert";
import { pairPicks, matchFilesToBooks } from "../scripts/book-match.mjs";
import { BOOKS, identifyBook } from "../scripts/books.mjs";

let pass = 0;
const check = (label, cond) => { assert.ok(cond, label); pass++; };

const file = (name, size = 0) => ({ name, size });
const NONE = new Map();
const pairedNames = ({ matched }) => Object.fromEntries([...matched].map(([id, f]) => [id, f.name]));

/* The reported failure: four books selected, four stock DTRPG downloads picked.
 * A <select multiple> reports document order however it was clicked, and the OS
 * picker returns files alphabetically, so position paired every book with
 * somebody else's PDF — each one warning that it was a "different printing" of
 * the book it was not. */
const stock = [
  file("ACKS II Judges Journal.pdf"),
  file("ACKS II Monstrous Manual.pdf"),
  file("ACKS II Revised Rulebook.pdf"),
  file("By This Axe The Cyclopedia of Dwarven Civilization.pdf"),
];
const rotated = pairPicks(["rr", "jj", "bta", "mm"], stock, NONE);
assert.deepEqual(pairedNames(rotated), {
  rr: "ACKS II Revised Rulebook.pdf",
  jj: "ACKS II Judges Journal.pdf",
  bta: "By This Axe The Cyclopedia of Dwarven Civilization.pdf",
  mm: "ACKS II Monstrous Manual.pdf",
});
pass++;
check("every file placed, none left over", !rotated.unfilled.length && !rotated.surplus.length);

// Separators a real download uses, and the reverse pick order, change nothing.
const renamed = pairPicks(
  ["rr", "jj"],
  [file("acks_ii_judges_journal.pdf"), file("ACKS-II-Revised-Rulebook.pdf")],
  NONE,
);
check("underscores/hyphens still name the book", pairedNames(renamed).rr === "ACKS-II-Revised-Rulebook.pdf");
check("pick order is not pairing order", pairedNames(renamed).jj === "acks_ii_judges_journal.pdf");

// What this seat called the file last time outranks what the filename says.
const remembered = new Map([["jj", { name: "book2.pdf" }], ["rr", { size: 4242 }]]);
const byRecord = pairPicks(["rr", "jj"], [file("book2.pdf"), file("book1.pdf", 4242)], remembered);
check("remembered name claims its file", pairedNames(byRecord).jj === "book2.pdf");
check("remembered size claims its file", pairedNames(byRecord).rr === "book1.pdf");

// Nothing to go on: position is the last resort, not the first.
const blind = pairPicks(["rr", "jj"], [file("book-a.pdf"), file("book-b.pdf")], NONE);
check("unnameable files still fill the named books", blind.matched.size === 2);
check("positional fallback keeps selection order", pairedNames(blind).rr === "book-a.pdf");
check("positional fallback places every spare", pairedNames(blind).jj === "book-b.pdf");

// Fewer files than books, and more files than books, are both reported.
const short = pairPicks(["rr", "jj"], [file("ACKS II Judges Journal.pdf")], NONE);
check("a book with no file is unfilled", short.unfilled.length === 1 && short.unfilled[0] === "rr");
check("unfilled never means mispaired", pairedNames(short).jj === "ACKS II Judges Journal.pdf");
const over = pairPicks(["rr"], [file("ACKS II Revised Rulebook.pdf"), file("ACKS II Judges Journal.pdf")], NONE);
check("the extra file is surplus, not a second read of the named book", over.surplus.length === 1);
check("surplus is the file no named book claimed", over.surplus[0].name === "ACKS II Judges Journal.pdf");
check("unfilled and surplus are never both set", !(short.surplus.length && short.unfilled.length));

// Surplus goes on to the un-named books through the same matcher.
const spill = matchFilesToBooks([file("ACKS II Judges Journal.pdf")], ["jj", "mm"], NONE);
check("a surplus file finds its own book", spill.matched.get("jj")?.name === "ACKS II Judges Journal.pdf");
check("a book with no candidate file stays closed", !spill.matched.has("mm"));

/* Fingerprints. Page counts are distinct across the registry, so an untitled
 * printing is still identified; a title, where there is one, must agree. */
check("page count + title names the book", identifyBook(BOOKS.jj.pages, "ACKS II Judges Journal") === "jj");
check("an untitled printing is named by count alone", identifyBook(BOOKS.ax2.pages, "") === "ax2");
check("every registry page count is distinct", new Set(Object.values(BOOKS).map((b) => b.pages)).size === Object.keys(BOOKS).length);
// A short printing of a book this build has never seen names nobody, which is
// what keeps edition drift a warning rather than a refusal.
check("an unknown page count names nobody", identifyBook(9999, "ACKS II Revised Rulebook") === null);
check("a count collision with a foreign title names nobody", identifyBook(BOOKS.jj.pages, "ACKS II Revised Rulebook") === null);

console.log(`\ntest-book-match: all ${pass} checks passed`);
