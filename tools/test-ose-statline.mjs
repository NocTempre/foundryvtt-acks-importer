/**
 * OSE stat-block grammar tests.
 *
 * Every block below is INVENTED. The shapes are the ones real books print —
 * that is the point of the test — but the numbers are made up, because a stat
 * block copied out of a third-party PDF is that publisher's content and has no
 * business in a tracked file. A shape is exercised by its shape, not by its
 * values.
 */
import { parseOseStatline, resolveProfile, OSE_CANONICAL } from "../scripts/ose-statline.mjs";

let failed = 0;
const check = (name, got, want) => {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    console.error(`FAIL ${name}\n  got:  ${g}\n  want: ${w}`);
    failed++;
  }
};
const ok = (name, cond, detail = "") => {
  if (!cond) {
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
};

/* --- the canonical line ------------------------------------------------- */

const canonical = parseOseStatline(
  "AC 3 [16], HD 2** (7hp), Att 1 × bite (1d6) or 1 × gaze, THAC0 18 [+1], MV 150 (50), " +
    "SV D11 W12 P10 B14 S13 (Magic-user 2), ML 6, AL Chaotic, XP 47, NA 1d4 (2d6), TT R",
);
check("ac", canonical.fields.ac, { descending: 3, ascending: 16 });
check("hd", canonical.fields.hd, { count: 2, asterisks: 2 });
check("hp", canonical.fields.hp, 7);
check("thac0", canonical.fields.thac0, { toHitAc0: 18, ascendingBonus: 1 });
check("mv", canonical.fields.mv, [{ mode: "land", exploration: 150, combat: 50 }]);
check("sv row", canonical.fields.sv.row, { D: 11, W: 12, P: 10, B: 14, S: 13 });
check("sv saveAs", canonical.fields.sv.saveAs, { token: "Magic-user", level: 2 });
check("ml", canonical.fields.ml, 6);
check("al", canonical.fields.al, "Chaotic");
check("xp", canonical.fields.xp, 47);
check("na", canonical.fields.na, { wandering: "1d4", lair: "2d6" });
check("tt", canonical.fields.tt, "R");
check("no leftovers", canonical.extra, []);

/* --- hit-dice spellings -------------------------------------------------- */

const hd = (s) => parseOseStatline(`AC 5 [14], HD ${s}`).fields.hd;
check("hd plain", hd("3"), { count: 3 });
check("hd asterisk", hd("3*"), { count: 3, asterisks: 1 });
check("hd plus", hd("3+2*"), { count: 3, bonus: 2, asterisks: 1 });
check("hd minus", hd("3-1"), { count: 3, bonus: -1 });
check("hd fraction", hd("1/2"), { count: 0.5 });
check("hd vulgar fraction", hd("½"), { count: 0.5 });
check("hd large", hd("36*"), { count: 36, asterisks: 1 });

/* --- armour class -------------------------------------------------------- */

const ac = (s) => parseOseStatline(`AC ${s}, HD 1`).fields.ac;
check("ac negative", ac("-4 [23]"), { descending: -4, ascending: 23 });
check("ac bare", ac("6"), { descending: 6, bare: true });

/* --- attack multipliers and nested alternatives -------------------------- */

const attAscii = parseOseStatline("AC 5 [14], Att 2 x claw (1d3)").fields.att;
check("ascii multiplier", attAscii.modes, [{ count: 2, name: "claw", damage: "1d3", text: "2 x claw (1d3)" }]);

// "or" inside the damage parenthetical must not split the mode in half.
const attNested = parseOseStatline("AC 5 [14], Att 1 × weapon (1d6 or by weapon)").fields.att;
check("nested or", attNested.modes.length, 1);
check("nested or damage", attNested.modes[0].damage, "1d6 or by weapon");

const attAlts = parseOseStatline("AC 5 [14], Att 1 × horn (1d8) or 1 × trample").fields.att;
check("two modes", attAlts.modes.map((m) => m.name), ["horn", "trample"]);

/* --- movement ------------------------------------------------------------ */

const mv = (s) => parseOseStatline(`AC 5 [14], MV ${s}, ML 6`).fields.mv;
check("mv feet marks", mv("150' (50')"), [{ mode: "land", exploration: 150, combat: 50 }]);
check("mv multi-mode", mv("150' (50') / 210' (70') flying"), [
  { mode: "land", exploration: 150, combat: 50 },
  { mode: "flying", exploration: 210, combat: 70 },
]);

/* --- saves --------------------------------------------------------------- */

check("save bare level", parseOseStatline("AC 5 [14], SV D11 W12 P10 B14 S13 (5)").fields.sv.saveAs, { level: 5 });
check("save race-as-class", parseOseStatline("AC 5 [14], SV D9 W10 P8 B12 S11 (Dwarf 3)").fields.sv.saveAs, {
  token: "Dwarf",
  level: 3,
});
// A single printed save is one statement, and must not be spread across five.
const single = parseOseStatline("AC 5 [14], SV 12, ML 6").fields.sv;
check("single save", single, { single: 12 });
ok("single save has no row", single.row === undefined);

// A hyphen the extractor left mid-word must not lose the class.
check(
  "line-break hyphen survives folding",
  parseOseStatline("AC 5 [14], SV D11 W12 P10 B14 S13 (Mag-ic-user 2)").fields.sv.saveAs.token,
  "Mag-ic-user",
);

/* --- per-source dialect -------------------------------------------------- */

// A book that heads its hit dice differently gets its own profile. The
// canonical profile must be untouched by it.
const wld = resolveProfile({ base: "ose.demo", labels: { hd: ["HITPOINTS DICE"], att: ["ATT"] }, saveForm: "single" });
const dialect = parseOseStatline("AC 6 [13], HITPOINTS DICE 4 (17hp), ATT 1 × slam (1d10), SV 13, ML 9", wld);
check("dialect hd", dialect.fields.hd, { count: 4 });
check("dialect hp", dialect.fields.hp, 17);
check("dialect att", dialect.fields.att.modes[0].name, "slam");
check("dialect tag", dialect.dialect, "ose.demo");
// The point is that the shared profile is not MUTATED by a per-source one —
// not that it holds any particular list, which the corpus keeps changing.
ok(
  "canonical unchanged by the dialect",
  !OSE_CANONICAL.labels.hd.some((x) => x.toLowerCase() === "hitpoints dice"),
  OSE_CANONICAL.labels.hd.join(),
);
// ...and the canonical profile must NOT read that book's wording.
check("canonical does not learn HITPOINTS DICE", parseOseStatline("AC 6 [13], HITPOINTS DICE 4 (17hp)").fields.hd, undefined);

/* --- nothing is dropped, nothing throws ---------------------------------- */

const prose = parseOseStatline("A squat grey thing that lurks in the cistern and hums to itself.");
check("prose parses to nothing", prose.fields, {});
check("prose is preserved", prose.extra.length, 1);

const mangled = parseOseStatline("AC, HD, Att, THAC0 [ , MV (, SV D, ML, AL, XP");
ok("mangled block does not throw", true);
// Its pieces survive SOMEWHERE — as a field the reader made sense of, as a note
// where the value was words, or in `extra`. Which container holds them matters
// far less than that nothing vanished.
ok(
  "mangled block keeps its pieces",
  mangled.extra.length > 0 || Object.keys(mangled.fields).length > 0,
  JSON.stringify({ fields: mangled.fields, extra: mangled.extra }),
);

check("empty input", parseOseStatline("").fields, {});
check("null input", parseOseStatline(null).fields, {});

// An unrecognised trailing clause is surfaced, never silently eaten.
const trailing = parseOseStatline("AC 5 [14], HD 2 (9hp), ML 8, Frobnicator 4");
ok("unknown clause surfaces", JSON.stringify(trailing.extra).includes("Frobnicator"), JSON.stringify(trailing.extra));

/* --- an unrecognised label's clause is never swallowed -------------------- */

// Found live: a book heading its hit dice "HITPOINTS DICE" under a profile that has
// never heard of it. The words are not a label, so they fall inside the
// PREVIOUS field's segment — and every reader takes what it recognises off the
// front and dropped the rest without a trace. No gap, no warning, no hit points.
{
  const foreign = parseOseStatline("AC 7 [12], HITPOINTS DICE 1 (4hp), Att 1 x bite (1d4), ML 7, AL Neutral");
  check("the armour class still reads", foreign.fields.ac, { descending: 7, ascending: 12 });
  ok("the unknown clause is not lost", JSON.stringify(foreign.extra).includes("HITPOINTS DICE 1 (4hp)"), JSON.stringify(foreign.extra));
  ok("and no hit dice are invented from it", foreign.fields.hd === undefined);
}

// The same rule must not eat a legitimate clause. An attack list keeps its own
// text verbatim, so a comma between modes is not residue.
{
  const att = parseOseStatline("AC 5 [14], Att 1 x claw (1d4), 1 x bite (1d6), ML 6");
  check("the attack clause is kept whole", att.fields.att.text, "1 x claw (1d4), 1 x bite (1d6)");
  check("morale still reads past it", att.fields.ml, 6);
}

/* --- rules the corpus asked for ------------------------------------------ */

// Sweeping the third-party library is what turns "this block did not fit" into
// a rule. Each group below was a ranked finding in that report before it was a
// rule here.

// B/X and several descendants name two of the five saves differently — Rays for
// Wands, Hold for Paralysis. Knowing only one set does not fail on the other, it
// succeeds PARTLY: three letters match, two are invisible, and the creature
// quietly ends up with three saving throws.
{
  const alt = parseOseStatline("AC 5 [14], HD 3, SV D12 R13 H14 B15 S16, ML 8");
  check("alternate letters normalise", alt.fields.sv.row, { D: 12, W: 13, P: 14, B: 15, S: 16 });
  check("and the set is recorded", alt.fields.sv.letterSet, "drhbs");
  const std = parseOseStatline("AC 5 [14], HD 3, SV D12 W13 P14 B15 S16, ML 8");
  check("the usual letters still read", std.fields.sv.row, { D: 12, W: 13, P: 14, B: 15, S: 16 });
  ok("and are not marked as an alternate", std.fields.sv.letterSet === undefined);
  // "Saves" as the label, found across several publishers.
  check("Saves is a spelling of SV", parseOseStatline("AC 5 [14], Saves D12 R13 H14 B15 S16").fields.sv.row.W, 13);
  // Letters belonging to no complete set must not become a row.
  const partial = parseOseStatline("AC 5 [14], SV D12 B15 S16, ML 8");
  ok("an incomplete row is not built", partial.fields.sv.row === undefined, JSON.stringify(partial.fields.sv));
  check("it is reported instead", partial.fields.sv.partial, { D: 12, B: 15, S: 16 });
}

// NPC blocks print a level of their own rather than inside the save clause.
check("a printed level reads", parseOseStatline("AC 5 [14], HD 3, Level 2, ML 8").fields.level, 2);

// A label word inside a parenthetical is not a label. A group's hit points
// print as "(hp 4, 6, 7)", and reading that "hp" as a field of its own splits
// the clause and strands the rest of the list.
{
  const group = parseOseStatline("AC 6 [13], HD 1 (hp 18, 20), ML 8, AL Neutral");
  check("the hit-dice clause stays whole", group.fields.hd, { count: 1 });
  check("the first figure is the creature's", group.fields.hp, 18);
  check("and its fellows are kept", group.fields.hpEach, [18, 20]);
  check("morale still reads past it", group.fields.ml, 8);
  check("nothing is left over", group.extra, []);

  const three = parseOseStatline("AC 6 [13], HD 2 (hp 7, 9, 10), Att 1 x claw (1d4), ML 8");
  check("a longer list reads", three.fields.hpEach, [7, 9, 10]);
  check("and the attack after it survives", three.fields.att.modes[0].name, "claw");
  check("with nothing left over", three.extra, []);
}

// Both spellings of a single creature's hit points.
check("hp after the number", parseOseStatline("AC 5 [14], HD 1 (4hp)").fields.hp, 4);
check("hp before the number", parseOseStatline("AC 5 [14], HD 1 (hp 4)").fields.hp, 4);
ok("a single figure lists no fellows", parseOseStatline("AC 5 [14], HD 1 (4hp)").fields.hpEach === undefined);

// The residue cut must respect brackets, or it severs the very lists above.
check(
  "an unlabelled clause is still surfaced",
  JSON.stringify(parseOseStatline("AC 7 [12], HD 1 (4hp), ML 8, Frobnicator 4").extra),
  JSON.stringify(["Frobnicator 4"]),
);

if (failed) {
  console.error(`\nose-statline: ${failed} failure(s)`);
  process.exit(1);
}
console.error("ose-statline: OK");
