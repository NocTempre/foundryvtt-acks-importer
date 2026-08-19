/**
 * Finding OSE stat blocks on a page.
 *
 * A stat block cannot be read out of a page's text in reading order, because
 * on a two-column page it is not contiguous there: an adventure sets a block
 * beside the prose of the facing column, and a bestiary page sets two
 * creatures' blocks side by side, so consecutive extracted items belong to
 * different monsters. Anything that joins the page first and pattern-matches
 * afterwards reads one creature's armour class against another's hit dice.
 *
 * So the geometry comes first: split the page into columns, gather each
 * column's runs into contiguous clusters, and offer the clusters whose text
 * carries enough stat-block labels to be one. This module PROPOSES REGIONS and
 * asserts nothing about what they mean — the labels it counts come from the
 * profile it is handed, the reading is left to ose-statline.mjs, and which
 * candidates are real is confirmed by the Judge before anything is imported.
 */
import { detectColumns, colOf } from "./extract.mjs";
import { OSE_CANONICAL, joinLines } from "./ose-statline.mjs";

/** Runs further apart than this vertically are different blocks, not one. */
const LINE_GAP = 14;
/** Items at least this tall are display headings, not stat-block body text. */
const HEADING_MIN_H = 12;
/** A candidate needs the armour-class label plus this many other labels. */
const MIN_OTHER_LABELS = 2;

/**
 * Join one cluster's runs into a line-aware string.
 *
 * Restoring the spaces a PDF does not emit is geometry's job and belongs here.
 * How the resulting LINES join — closing up a word the typesetter broke across
 * one — is the grammar's rule, shared with text a Judge pastes in, so it lives
 * there and is applied by `joinLines`.
 */
export function joinBlockRuns(runs) {
  return joinLines(linesOf(runs).map(lineText).filter(Boolean))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * One line's text, with the spaces the PDF does not emit.
 *
 * Runs arrive as bare glyph strings — "AC" and "9" are separate runs with a
 * gap between them and no space character anywhere — so the text has to be
 * reconstructed from x positions before anything can be matched against it.
 * A raw concatenation reads "AC9", and every label test that relies on a word
 * boundary then fails on the whole line.
 */
function lineText(line) {
  let s = "";
  let prev = null;
  for (const it of line.items) {
    if (prev && it.x - (prev.x + (prev.w ?? 0)) > 1 && !/\s$/.test(s) && !/^\s/.test(it.str)) s += " ";
    s += it.str;
    prev = it;
  }
  return s.trim();
}

/**
 * Group a cluster's runs into lines, in reading order.
 */
function linesOf(runs) {
  const lines = [];
  for (const r of [...runs].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const line = lines.find((l) => Math.abs(l.y - r.y) <= 3);
    if (line) line.items.push(r);
    else lines.push({ y: r.y, items: [r] });
  }
  return lines.sort((a, b) => a.y - b.y).map((l) => ({ ...l, items: l.items.sort((a, b) => a.x - b.x) }));
}

/**
 * Does this line carry stat-block content, as opposed to the prose around it?
 *
 * A stat block sits inside body text with no rule or whitespace to separate
 * it, so vertical contiguity alone will swallow the paragraph above and the
 * random-encounter table below. The test is deliberately about SHAPE — a
 * label, a damage die, a bracketed figure, a save letter glued to a number —
 * because those are what a stat line is made of and what prose is not.
 */
function isStatLine(text, labelRe) {
  labelRe.lastIndex = 0;
  const markers =
    (text.match(labelRe)?.length ?? 0) +
    (text.match(/\b\d+d\d+\b/g)?.length ?? 0) +
    (text.match(/\[\s*[+-]?\d+\s*\]/g)?.length ?? 0) +
    (text.match(/\b[DWPBSRH]\d+\b/g)?.length ?? 0);
  if (!markers) return false;

  // A sentence that MENTIONS statistics is not a stat line. Room text quotes
  // them constantly — "1d4 giant toads (AC 7 (12), HD 2+2 …) have hopped in",
  // "(Use normal goblin stats: …)" — and admitting those lines drags whole
  // paragraphs into a candidate, which then reads as a creature with prose
  // stuck to it. A real stat line is dense: it is nearly all statistics. Prose
  // is long and carries a handful.
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 12 && markers < 3) return false;
  return true;
}

/** Bounding box of a set of runs, padded so the box re-selects them exactly. */
const boxOf = (runs) => ({
  x0: Math.min(...runs.map((r) => r.x)) - 2,
  x1: Math.max(...runs.map((r) => r.x + (r.w ?? 0))) + 2,
  y0: Math.min(...runs.map((r) => r.y)) - 3,
  y1: Math.max(...runs.map((r) => r.y)) + 3,
});

/** Every label spelling the profile knows, as one case-insensitive alternation. */
function labelProbe(profile) {
  const labels = profile?.labels ?? OSE_CANONICAL.labels;
  const spellings = [];
  for (const [key, list] of Object.entries(labels)) for (const s of list) spellings.push({ key, s });
  spellings.sort((a, b) => b.s.length - a.s.length);
  const alt = spellings.map((r) => r.s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")).join("|");
  // A label is followed by its value, and the typesetting may leave no space
  // at all ("ML5"), so the closing boundary rejects letters rather than
  // requiring a word break — which a digit does not provide.
  return { re: new RegExp(`\\b(?:${alt})(?![A-Za-z])`, "gi"), keyOf: new Map(spellings.map((r) => [r.s.toLowerCase().replace(/\s+/g, " "), r.key])) };
}

/**
 * A block that prints an ascending armour class with no descending counterpart
 * — and ability MODIFIERS rather than scores — is a different game's stat
 * block, not an OSE one with pieces missing. Reading its armour class as
 * descending would invert it silently, so such a candidate is refused here
 * rather than converted. The signals are shape, not values: a bare `AC` with
 * no bracket, next to signed one-letter ability entries.
 */
export function looksNonDescending(text) {
  const bareAc = /\bAC\s+\d+\s*(?!\[)/i.test(text) && !/\bAC\s+-?\d+\s*\[/i.test(text);
  const modifierScores = /(?:^|[\s,])(?:S|STR)\s*[+-]\d+\s*,\s*(?:D|DEX)\s*[+-]\d+/i.test(text);
  const rangeBands = /\bMV\s+(?:near|far|close|double\s+near)\b/i.test(text);
  return (bareAc && (modifierScores || rangeBands)) || (modifierScores && rangeBands);
}

/**
 * Candidate stat blocks on one page.
 *
 * @param pageData  `pageItems(doc, page)` output
 * @param profile   a resolved profile (see ose-statline's `resolveProfile`)
 * @returns candidates in reading order, each `{box, runs, text, labels, coverage, suspectLineage}`
 */
export function findStatBlocks(pageData, profile = OSE_CANONICAL) {
  const items = (pageData?.items ?? []).filter((it) => it.h < HEADING_MIN_H && String(it.str).trim());
  if (!items.length) return [];

  const cols = detectColumns(pageData.items ?? []);
  const byCol = new Map();
  for (const it of items) {
    const c = colOf(it.x, cols);
    if (!byCol.has(c)) byCol.set(c, []);
    byCol.get(c).push(it);
  }

  const { re, keyOf } = labelProbe(profile);
  const out = [];

  for (const [col, colItems] of [...byCol.entries()].sort((a, b) => a[0] - b[0])) {
    // A candidate is a contiguous run of STAT-BEARING lines. Vertical distance
    // alone is not enough: a block set inside body text has no gap above or
    // below it, so a purely spatial cluster swallows the paragraph before it
    // and the encounter table after it, and the grammar then reads one
    // creature's morale off another's table row.
    let cluster = [];
    let lastY = null;
    const flush = () => {
      if (cluster.length) out.push({ col, runs: cluster });
      cluster = [];
      lastY = null;
    };
    for (const line of linesOf(colItems)) {
      const text = lineText(line);
      if (!isStatLine(text, re) || (lastY !== null && line.y - lastY > LINE_GAP)) {
        flush();
        if (!isStatLine(text, re)) continue;
      }
      cluster.push(...line.items);
      lastY = line.y;
    }
    flush();
  }

  const candidates = [];
  for (const c of out) {
    const text = joinBlockRuns(c.runs);
    if (!text) continue;
    const seen = new Set();
    const times = new Map();
    for (const m of text.matchAll(re)) {
      const key = keyOf.get(m[0].toLowerCase().replace(/\s+/g, " "));
      if (!key) continue;
      seen.add(key);
      times.set(key, (times.get(key) ?? 0) + 1);
    }
    // The armour class is the one label every OSE block prints, and it is what
    // separates a stat block from a paragraph that happens to mention hit dice.
    if (!seen.has("ac") || seen.size < MIN_OTHER_LABELS + 1) continue;
    // A block prints its armour class once. Twice means two creatures were
    // gathered into one candidate — which happens where a narrow stat block is
    // set INSIDE a prose column, a sub-column the page-wide histogram cannot
    // see. The grammar would still return a full-looking reading, silently
    // mixing one creature's numbers with another's, so the candidate is marked
    // and kept out of any unattended path rather than quietly offered.
    const merged = (times.get("ac") ?? 0) > 1;
    candidates.push({
      box: boxOf(c.runs),
      runs: c.runs,
      text,
      labels: [...seen],
      coverage: seen.size / Object.keys(profile?.labels ?? OSE_CANONICAL.labels).length,
      suspectLineage: looksNonDescending(text),
      mergedBlocks: merged,
      col: c.col,
    });
  }
  return candidates.sort((a, b) => a.col - b.col || a.box.y0 - b.box.y0);
}

/**
 * Labels a page uses that the profile does not know — the raw material for
 * calibration. A book that heads its hit dice differently shows up here as an
 * unclaimed word standing where a label would stand, and the Judge decides
 * what it means; nothing is inferred from it automatically.
 *
 * Reported as words that begin a comma-separated clause and are followed by a
 * number, which is the shape every stat-block label has.
 */
export function unknownLabels(pageData, profile = OSE_CANONICAL) {
  const known = new Set();
  for (const list of Object.values(profile?.labels ?? OSE_CANONICAL.labels)) {
    for (const s of list) known.add(s.toLowerCase().replace(/\s+/g, " "));
  }
  const found = new Map();
  // Search with the profile AS GIVEN. Narrowing it to a single anchor label
  // seems like it would widen the net, but it does the opposite: a candidate
  // has to carry several distinct labels to count as a block at all, so a
  // one-label profile matches nothing anywhere and the calibration prompt
  // never fires — including on the books that most need it.
  for (const c of findStatBlocks(pageData, profile)) {
    for (const m of c.text.matchAll(/(?:^|,\s*)([A-Za-z][A-Za-z0-9]*(?:\s+[A-Za-z][A-Za-z0-9]*)?)\s+(?=[-+]?\d|\d)/g)) {
      const word = m[1].trim();
      const folded = word.toLowerCase().replace(/\s+/g, " ");
      if (known.has(folded)) continue;
      found.set(word, (found.get(word) ?? 0) + 1);
    }
  }
  return [...found.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}
