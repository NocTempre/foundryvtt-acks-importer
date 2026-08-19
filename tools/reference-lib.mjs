/**
 * Where the LOCAL reference PDFs live, and whether this machine has them.
 *
 * Dev-harness only. The library is licensed material: it is never committed,
 * never shipped, and never present in CI — so every tool that reads it must be
 * able to say "not here" and skip cleanly rather than fail. Kept in one place
 * so the compiler, the acceptance gate and the drift check cannot disagree
 * about which printing they are reading.
 */
import fs from "node:fs";

export const LIB = "C:\\Proj\\acks-reference\\ACKSII";
export const LIB_AX = "C:\\Proj\\acks-reference\\AX";

/**
 * Third-party OSE and B-X adventures, for testing the stat-block grammar
 * against the range of things publishers actually print.
 *
 * Not a list of files, because it is not a fixed set: it is whatever this
 * machine's owner has bought, arranged however they arranged it, and it grows.
 * Tools walk it rather than name anything in it.
 *
 * The same LOCAL-ONLY rules apply as to the ACKS library, and one more that
 * matters more here: a coverage report over this corpus is full of other
 * publishers' stat lines, so no tool may write one into the repo. Report
 * SHAPES, print to stdout, and keep the values on the machine that owns the
 * books.
 */
export const LIB_OSE = "C:\\Proj\\ose-reference";

/** Book id -> the exact printing the register's page numbers were read from. */
export const FILES = {
  rr: `${LIB}\\ACKSII_Revised_Rulebook_DIGITAL_FINAL_r10_2nd_Printing.pdf`,
  jj: `${LIB}\\ACKSII_Judges_Journal_DIGITAL_FINAL_r9_2nd_Printing.pdf`,
  mm: `${LIB}\\ACKSII_Monstrous_Manual_DIGITAL_FINAL_r7_2nd_Printing.pdf`,
  tt: `${LIB}\\ACKSII_Treasure_Tome_DIGITAL_r2.pdf`,
  bta: `${LIB}\\ByThisAxe_digital.pdf`,
  ax2: `${LIB_AX}\\AX2_Secrets_of_the_Nethercity_-_Bookmarked.pdf`,
  ax3: `${LIB_AX}\\AX3_Capital_of_the_Borderlands.pdf`,
  scg: `${LIB}\\ACKSII_System_Compatibility_Guide_FINAL_r4_2nd_Printing.pdf`,
};

/**
 * True only when EVERY book is readable. A partial library still lets the
 * compiler do useful per-book work, but it cannot reproduce the whole cookbook
 * — so the drift check needs the stricter question, not "some book is here".
 */
export const referenceComplete = () => Object.values(FILES).every((f) => fs.existsSync(f));
