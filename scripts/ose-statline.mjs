/**
 * OSE / B-X stat-block grammar.
 *
 * A sibling of executor.mjs's `parseStatline`, which reads the ACKS AX quick-
 * stat line, and it keeps that function's contract deliberately: labels are
 * read by KEYWORD ANYWHERE rather than in sequence, an unrecognised run is
 * preserved verbatim rather than guessed at, a missing key is simply absent,
 * and nothing here ever throws on content. A stat block is the reader's own
 * page; the grammar's job is to report what is printed, not to repair it.
 *
 * This module knows nothing about ACKS. It emits OSE's own fields in OSE's own
 * idiom — descending armour class, to-hit-AC-0, the five-letter save row — and
 * ose-convert.mjs turns those into ACKS values. Keeping the two apart is what
 * confines the printed conversion constants to a single file.
 *
 * Which spellings count as a label is the PROFILE's business, never the
 * grammar's. `ose.canonical` below covers the labels OSE itself prints; a book
 * that prints something else (one third-party title heads its hit dice "HIT
 * DICE") gets a profile row of its own, confirmed by the Judge, so that one
 * book's wording can never silently change how a different book parses.
 */

/** The labels OSE prints. Matching is case-insensitive, so `Att`/`ATT` is one
 * spelling; a genuinely different WORD belongs in a per-source profile. */
export const OSE_CANONICAL = Object.freeze({
  base: "ose.canonical",
  labels: Object.freeze({
    ac: ["AC"],
    hd: ["HD"],
    hp: ["hp"],
    att: ["Att"],
    thac0: ["THAC0"],
    mv: ["MV"],
    sv: ["SV"],
    ml: ["ML"],
    al: ["AL"],
    xp: ["XP"],
    na: ["NA"],
    tt: ["TT"],
  }),
  saveForm: "five",
  mvOrder: "explorationFirst",
});

/** Merge a per-source override onto the canonical profile (labels merge by key). */
export function resolveProfile(override) {
  if (!override) return OSE_CANONICAL;
  return {
    ...OSE_CANONICAL,
    ...override,
    labels: { ...OSE_CANONICAL.labels, ...(override.labels ?? {}) },
  };
}

// Typographic variants that carry no meaning: the multiplication sign, the
// several dashes, curly quotes, and the foot mark. Folding them is not a
// content decision — the same block prints "1 x bite" and "1 × bite".
const NORM = [
  [/[×✕✖]/g, "x"],
  [/[‐‑‒–—−]/g, "-"],
  [/[‘’′]/g, "'"],
  [/[“”″]/g, '"'],
  [/½/g, "1/2"],
  [/¼/g, "1/4"],
  [/¾/g, "3/4"],
];

const normalize = (s) => {
  let t = String(s ?? "");
  for (const [re, to] of NORM) t = t.replace(re, to);
  return t.replace(/\s+/g, " ").trim();
};

/** Fold a token for comparison: case and punctuation carry no meaning, and a
 * line-break hyphen the extractor left behind ("Mag-ic-user") folds away with
 * the legitimate one ("Magic-user"). */
const fold = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const int = (s) => {
  const m = /(-?\d[\d,]*)/.exec(String(s ?? ""));
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
};

/** "1/2" -> 0.5, "2 1/2" -> 2.5, "3" -> 3. Hit dice print as fractions below 1. */
function count(tok) {
  const t = String(tok ?? "").trim();
  const mixed = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (mixed) return +mixed[1] + +mixed[2] / +mixed[3];
  const frac = /^(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (frac) return +frac[1] / +frac[2];
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/* -------------------------------------------- */
/*  Field readers                               */
/* -------------------------------------------- */

/**
 * `9 [10]`, `-3 [22]`, `7 [12]`, or a bare `9`.
 *
 * OSE prints both progressions, which is what lets the converter check its own
 * arithmetic. `bare` marks a block that printed only one number: the grammar
 * does not decide which progression that is, because the answer depends on the
 * lineage and this module has no opinion about lineages.
 */
function readAc(v) {
  const m = /(-?\d+)\s*(?:\[\s*([+-]?\d+)\s*\])?/.exec(v);
  if (!m) return null;
  const out = { descending: parseInt(m[1], 10) };
  if (m[2] != null) out.ascending = parseInt(m[2], 10);
  else out.bare = true;
  return out;
}

/** `1**`, `4*`, `1+1*`, `1-1`, `1/2`, `40*`. Asterisks mark XP-bearing specials. */
function readHd(v) {
  const m = /^\s*(\d+(?:\s*\/\s*\d+)?)\s*([+-]\s*\d+)?\s*(\*+)?/.exec(v);
  if (!m) return null;
  const out = { count: count(m[1].replace(/\s+/g, "")) };
  if (m[2]) out.bonus = parseInt(m[2].replace(/\s+/g, ""), 10);
  if (m[3]) out.asterisks = m[3].length;
  return out;
}

/** `(4hp)`, `(9 hp)`, `(13hp)` — printed inside the hit-dice clause. */
function readHp(v) {
  const m = /\(\s*(\d+)\s*hp\s*\)/i.exec(v);
  return m ? parseInt(m[1], 10) : null;
}

/** `19 [0]`, `16 [+3]`, `18 [1]`, or a bare `19`. */
function readThac0(v) {
  const m = /(\d+)\s*(?:\[\s*([+-]?\d+)\s*\])?/.exec(v);
  if (!m) return null;
  const out = { toHitAc0: parseInt(m[1], 10) };
  if (m[2] != null) out.ascendingBonus = parseInt(m[2], 10);
  else out.bare = true;
  return out;
}

/**
 * `120 (40)`, `120' (40')`, `120' (40') / 180' (60') flying`.
 *
 * OSE prints exploration first with the combat rate parenthesised — the
 * opposite order from the ACKS Monstrous Manual. The grammar records the two
 * under their OSE names so the converter cannot mistake one for the other.
 */
function readMv(v) {
  const out = [];
  const re = /(\d+)\s*'?\s*(?:\(\s*(\d+)\s*'?\s*\))?\s*([A-Za-z]+)?/g;
  let m;
  while ((m = re.exec(v)) !== null) {
    if (!m[1]) continue;
    const mode = m[3] ? m[3].toLowerCase() : null;
    out.push({
      mode: mode && mode !== "hp" ? mode : "land",
      exploration: parseInt(m[1], 10),
      ...(m[2] != null ? { combat: parseInt(m[2], 10) } : {}),
    });
  }
  return out.length ? out : null;
}

/**
 * `D13 W14 P13 B16 S15 (Magic-user 1)`, `D12 W13 P14 B15 S16`, `14`, `14 (3)`.
 *
 * The five-letter row and the single number are DIFFERENT printings, not one
 * with pieces missing: a book that prints one number has said one thing, and
 * fanning it out to five would be the grammar inventing four values. The
 * single form is reported as `single` and the converter decides what, if
 * anything, it may fill.
 */
function readSv(v) {
  const out = {};
  const five = {};
  for (const m of v.matchAll(/\b([DWPBS])\s*(\d+)/g)) five[m[1]] = parseInt(m[2], 10);
  if (Object.keys(five).length) out.row = five;

  // The parenthetical names the class and level the creature saves as.
  const paren = /\(([^)]*)\)/.exec(v);
  if (paren) {
    const inner = paren[1].trim();
    const named = /^(.*?)\s*(\d+)\s*$/.exec(inner);
    if (named && named[1]) out.saveAs = { token: named[1].trim(), level: parseInt(named[2], 10) };
    else if (/^\d+$/.test(inner)) out.saveAs = { level: parseInt(inner, 10) };
    else if (inner) out.saveAs = { token: inner };
  }

  if (!out.row) {
    // A lone number, with any class parenthetical already taken above.
    const bare = int(v.replace(/\([^)]*\)/g, ""));
    if (bare != null) out.single = bare;
  }
  return Object.keys(out).length ? out : null;
}

/** `0 (1)`, `1d6 (2d6)`, `1 (1d4)` — wandering, then the lair number. */
function readNa(v) {
  const m = /^\s*([^()]+?)\s*(?:\(\s*([^)]*?)\s*\))?\s*$/.exec(v);
  if (!m) return null;
  const out = {};
  if (m[1]) out.wandering = m[1].trim();
  if (m[2]) out.lair = m[2].trim();
  return Object.keys(out).length ? out : null;
}

/**
 * Split on a separator only where it is NOT inside brackets. An attack clause
 * puts alternatives inside its damage parenthetical as often as between them
 * ("1 x weapon (1d4 or by weapon)"), so a flat split cuts a mode in half.
 */
function splitTopLevel(s, re) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      re.lastIndex = i;
      const m = re.exec(s);
      if (m && m.index === i) {
        parts.push(s.slice(start, i));
        i = start = i + m[0].length;
        i--;
      }
    }
  }
  parts.push(s.slice(start));
  return parts;
}

/** Split an attack clause into its alternatives, keeping each verbatim. */
function readAtt(v) {
  const modes = splitTopLevel(v, /\s+or\s+/giy)
    .map((s) => s.replace(/^[,;]\s*/, "").trim())
    .filter(Boolean)
    .map((s) => {
      const m = /^(\d+)\s*x\s*(.+)$/i.exec(s);
      const body = m ? m[2].trim() : s;
      const dmg = /\(([^)]*\d+d\d+[^)]*)\)/i.exec(body);
      return {
        ...(m ? { count: parseInt(m[1], 10) } : {}),
        name: body.replace(/\s*\([^)]*\)\s*$/, "").trim(),
        ...(dmg ? { damage: dmg[1].trim() } : {}),
        text: s,
      };
    });
  return modes.length ? { text: v, modes } : null;
}

/**
 * A field whose reader does NOT keep the clause it was given verbatim.
 *
 * In this idiom a comma separates fields, so a comma inside one field's segment
 * means text that belongs to no label the profile knows — a label spelled some
 * other way, most often. Every reader here takes what it recognises off the
 * front and would otherwise drop the rest without trace: a block reading
 * "AC 7 [12], HIT DICE 1 (4hp)" under a profile that has never heard of
 * "HIT DICE" would report an armour class and simply lose the hit dice, with no
 * gap and nothing in `extra` to show for it.
 *
 * `att` is excluded because its reader stores the whole clause in `.text`, so
 * nothing is lost there — and a comma legitimately separates attack modes.
 */
const RESIDUE_FIELDS = new Set(["ac", "hd", "hp", "thac0", "mv", "sv", "ml", "al", "xp", "na", "tt"]);

const READERS = {
  ac: readAc,
  hd: readHd,
  hp: (v) => int(v),
  att: readAtt,
  thac0: readThac0,
  mv: readMv,
  sv: readSv,
  ml: (v) => int(v),
  al: (v) => v.replace(/[.,;]+$/, "").trim() || null,
  xp: (v) => int(v),
  na: readNa,
  tt: (v) => v.replace(/[.,;]+$/, "").trim() || null,
};

/* -------------------------------------------- */
/*  The grammar                                 */
/* -------------------------------------------- */

/** Build one alternation over every label spelling, longest first so a
 * multi-word label is never shadowed by a shorter one that starts it. */
function labelPattern(labels) {
  const rows = [];
  for (const [key, spellings] of Object.entries(labels)) {
    for (const s of spellings) rows.push({ key, s });
  }
  rows.sort((a, b) => b.s.length - a.s.length);
  const alt = rows.map((r) => r.s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")).join("|");
  // The value may follow with no space ("ML5"), so the closing boundary
  // rejects a letter rather than requiring a word break, which a digit is not.
  return { re: new RegExp(`\\b(${alt})(?![A-Za-z])`, "gi"), rows };
}

/**
 * Read one OSE stat block.
 *
 * Segments are cut at label boundaries rather than at commas, because the
 * values themselves contain commas and a book may print the fields in any
 * order or leave any of them out. Text before the first label, and any segment
 * whose reader declines it, is kept verbatim in `extra` — visible to the Judge
 * in review, never guessed at and never dropped.
 *
 * @param text     the block as extracted, already joined by the locator
 * @param profile  a resolved profile (see `resolveProfile`)
 * @returns `{fields, extra, dialect, labelsSeen, text}` — never throws
 */
export function parseOseStatline(text, profile = OSE_CANONICAL) {
  const prof = profile ?? OSE_CANONICAL;
  const src = normalize(text);
  const out = { text: src, dialect: prof.base ?? "ose.canonical", fields: {}, extra: [], labelsSeen: [] };
  if (!src) return out;

  const { re, rows } = labelPattern(prof.labels ?? OSE_CANONICAL.labels);
  const byFolded = new Map(rows.map((r) => [fold(r.s), r.key]));

  const hits = [];
  for (const m of src.matchAll(re)) {
    const key = byFolded.get(fold(m[1]));
    if (key) hits.push({ key, at: m.index, end: m.index + m[0].length });
  }

  if (!hits.length) {
    out.extra.push(src);
    return out;
  }
  if (hits[0].at > 0) {
    const lead = src.slice(0, hits[0].at).replace(/[,;]\s*$/, "").trim();
    if (lead) out.extra.push(lead);
  }

  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    let raw = src.slice(h.end, hits[i + 1]?.at ?? src.length).replace(/^[:\s]+/, "").replace(/[,;]\s*$/, "").trim();
    out.labelsSeen.push(h.key);
    if (RESIDUE_FIELDS.has(h.key)) {
      const comma = raw.indexOf(",");
      if (comma >= 0) {
        const residue = raw.slice(comma + 1).trim();
        if (residue) out.extra.push(residue);
        raw = raw.slice(0, comma).trim();
      }
    }
    // A label printed twice is a real signal (two movement rows, say), so the
    // first reading is kept and the repeat is surfaced rather than overwriting.
    if (out.fields[h.key] !== undefined) {
      out.extra.push(`${h.key}: ${raw}`);
      continue;
    }
    let value = null;
    try {
      value = READERS[h.key] ? READERS[h.key](raw) : raw;
    } catch {
      value = null; // a reader must never take the block down with it
    }
    if (value === null || value === undefined || (Array.isArray(value) && !value.length)) {
      if (raw) out.extra.push(`${h.key}: ${raw}`);
      continue;
    }
    out.fields[h.key] = value;
    // Hit points print inside the hit-dice clause rather than under a label.
    if (h.key === "hd" && out.fields.hp === undefined) {
      const hp = readHp(raw);
      if (hp != null) out.fields.hp = hp;
    }
  }
  return out;
}
