/**
 * Book registry: every PDF the streamer can read, with edition fingerprints.
 * Fingerprints use page count + metadata title — NEVER file hashes (DTRPG
 * watermarks each customer's copy, so bytes differ per person).
 *
 * A book id is a promise that connecting that PDF unlocks something. Do not add
 * one that unlocks nothing — see docs/DECISIONS.md § Withdrawn surface.
 */

export const BOOKS = {
  rr: {
    label: "ACKS II Revised Rulebook",
    short: "RR",
    pages: 553,
    titleRe: /Revised Rulebook/i,
  },
  jj: {
    label: "ACKS II Judges Journal",
    short: "JJ",
    pages: 489,
    titleRe: /Judges Journal/i,
  },
  bta: {
    label: "By This Axe: The Cyclopedia of Dwarven Civilization",
    short: "BTA",
    pages: 273,
    titleRe: /By This Axe/i,
  },
  mm: {
    label: "ACKS II Monstrous Manual",
    short: "MM",
    pages: 441,
    titleRe: /Monstrous Manual/i,
  },
  tt: {
    label: "ACKS II Treasure Tome",
    short: "TT",
    pages: 346,
    titleRe: /Treasure Tome/i,
  },
  // ACKS I adventures (AX line). Metadata titles are EMPTY in these printings,
  // so the fingerprint gates on page count alone; titleRe stays for printings
  // that do carry one. printedOffset: printed folio = PDF page - offset, used
  // for citations (register pages/instructions always use PDF pages).
  ax2: {
    label: "AX2 Secrets of the Nethercity",
    short: "AX2",
    pages: 186,
    titleRe: /Secrets of the Nethercity/i,
    printedOffset: 2,
  },
  ax3: {
    label: "AX3 Capital of the Borderlands",
    short: "AX3",
    pages: 226,
    titleRe: /Capital of the Borderlands/i,
    printedOffset: 2,
  },
  // The conversion instrument. It unlocks the OSE import path: the constants
  // that turn a foreign stat block into ACKS II values are printed here, so
  // they are read from the reader's own copy rather than shipped. The metadata
  // title carries the publisher's own spelling ("Compatability"), so the regex
  // gates on the stem both spellings share.
  scg: {
    label: "ACKS II System Compatibility Guide",
    short: "SCG",
    pages: 12,
    titleRe: /System Compat/i,
    printedOffset: 4,
  },
};


/** Human-readable fingerprint check; returns null when OK, else a warning. */
export function fingerprintWarning(bookId, numPages, title) {
  const book = BOOKS[bookId];
  if (!book) return `unknown book id "${bookId}"`;
  const problems = [];
  if (numPages !== book.pages) problems.push(`page count ${numPages} (expected ${book.pages})`);
  if (title && !book.titleRe.test(title)) problems.push(`title "${title}"`);
  return problems.length ? `${book.label}: ${problems.join(", ")} — different edition/printing? Extraction may miss.` : null;
}

/**
 * Which book an opened PDF actually is, or null when the fingerprint names no
 * one book. This is the same evidence `fingerprintWarning` reads, asked the
 * other way round: not "does this file fit the slot it was put in" but "whose
 * file is this".
 *
 * A book is named only when the whole fingerprint fits it and fits nothing
 * else. The page counts in the registry are distinct, so an untitled printing
 * — which is every AX book — is still identified by count alone; a title, where
 * the printing carries one, must match too. A file that fits no book (a
 * printing this build has never seen) names nobody, which is what keeps edition
 * drift a warning rather than a refusal.
 */
export function identifyBook(numPages, title) {
  const hits = Object.entries(BOOKS).filter(
    ([, book]) => book.pages === numPages && (!title || book.titleRe.test(title)),
  );
  return hits.length === 1 ? hits[0][0] : null;
}
