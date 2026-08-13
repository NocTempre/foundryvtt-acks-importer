/**
 * `parseEquipment` — splitting a template's printed Starting Equipment cell.
 *
 * The cell is prose written by a human for humans, and every class's author
 * punctuated it their own way. What this pins is the SPLITTING: where one item
 * ends and the next begins, which separators count, and which do not. What each
 * piece then resolves to is the equipment menu's business and is stubbed here to
 * whatever the case under test needs.
 *
 * No book text is reproduced. The cells below are shaped like the printed ones —
 * same punctuation, invented gear.
 */
import assert from "node:assert";
import { parseEquipment } from "../scripts/cookbook.mjs";

let pass = 0;
const check = (label, cond) => { assert.ok(cond, label); pass++; };

const fold = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
/** An equipment menu in the shape the real one is built in. */
const menu = (...names) =>
  names
    .map((name) => ({ name, ref: `def.equip.${fold(name)}`, fold: fold(name), foldStripped: fold(name.replace(/\([^)]*\)/g, " ")) }))
    .sort((a, b) => b.name.length - a.name.length);

const names = (cell, m = menu()) => parseEquipment(cell, m).items.map((i) => i.name);

/* --- Semicolons separate, the same as commas ------------------------------- */
//
// Splitting on the comma alone fused whatever followed a semicolon onto the item
// before it, so a character started play holding a staff welded to a spell.
const grouped = names("enameled spellbook with discern magic and one spell of character's choice; smooth-worn staff, blue robe");
check("a semicolon ends an item", grouped.includes("smooth-worn staff"));
check("nothing is left welded across the semicolon", !grouped.some((n) => n.includes(";")));
check("the comma after it still separates", grouped.includes("blue robe"));

/* --- The leading "and" is stripped ----------------------------------------- */
//
// The strip used to run BEFORE the trim, so it could only ever match the first
// chunk — which is the one that never begins with "and". Every list's last item
// therefore arrived carrying the conjunction as part of its name.
const listed = names("a spear, a shield, and a helmet");
check("the last item of a list drops its 'and'", listed.includes("a helmet"));
check("no item is named with a leading 'and'", !listed.some((n) => /^and\b/i.test(n)));
check("'and' inside a name is untouched", names("bow and arrow set").includes("bow and arrow set"));

/* --- What the separators must NOT break ------------------------------------ */
check("a comma inside brackets holds the item together",
  names("ornamental crystal ball (etched, polished)").includes("ornamental crystal ball (etched, polished)"));
check("a semicolon inside brackets holds it together too",
  names("waxed tablet (ruled; gridded)").includes("waxed tablet (ruled; gridded)"));

/* --- Rules the split must keep obeying ------------------------------------- */
//
// A counted container splits into itself and its contents, and the count lands
// on the contents where the sheet can spend it.
const quiver = parseEquipment("quiver with 20 arrows", menu()).items;
check("a counted container splits into device and load", quiver.length === 2 && quiver[0].name === "quiver");
check("the count rides the load, not the device", quiver[1].qty === 20 && quiver[0].qty === 1);
check("and the load records where it is carried", /carried in quiver/.test(quiver[1].note));
check("an uncounted container stays one item", names("pouch with herbs").length === 1);

/* --- A pair of known items splits, whatever they are called ---------------- */
//
// The whole-descriptor guard exists so "tunic and pants" — one printed outfit
// at one printed price — is not torn in half. It used to ask `resolve`, whose
// containment fallback answered yes for the wrong reason: "spear and short
// sword" CONTAINS "short sword", so the joined string read as an already-known
// item and the pair never split. The character got one item named for two
// weapons, and the rule only ever fired when both halves happened to fold
// shorter than six characters.
check("a pair of known weapons splits", names("spear and sword", menu("Spear", "Sword")).length === 2);
check("a long-named half no longer swallows the pair",
  names("spear and short sword", menu("Spear", "Short Sword")).length === 2);
check("and both halves come out under their own names",
  names("spear and short sword", menu("Spear", "Short Sword")).join("|") === "spear|short sword");
check("name length is irrelevant on either side",
  names("adventurer's harness and short sword", menu("Adventurer's Harness", "Short Sword")).length === 2);

// What the guard is FOR, and still does.
check("an outfit the menu knows whole stays whole", names("tunic and pants", menu("Tunic and Pants")).length === 1);
check("a bracketed qualifier does not stop it being known whole",
  names("tunic and pants", menu("Tunic and Pants (common)")).length === 1);
check("an alias naming the whole thing keeps it whole",
  parseEquipment("long bearded axe and haft", menu("Great Axe"), { "long bearded axe and haft": "def.equip.greataxe" }).items.length === 1);

// Both halves must be known — one alone proves nothing about the other.
check("a pair the menu knows nothing about stays whole", names("odds and ends").length === 1);
check("one known half is not enough to split", names("spear and whatnot", menu("Spear")).length === 1);
check("splitting is not attempted on a phrase with no 'and'", names("short sword", menu("Short Sword")).length === 1);

/* --- Coin and encumbrance still come off cleanly --------------------------- */
const paid = parseEquipment("a dagger, 12gp, 8sp (Enc. 3 stones).", menu("Dagger"));
check("gold and silver are read out of the cell", paid.gp === 12 && paid.sp === 8);
check("the encumbrance note is lifted off the end", /3 stones/.test(paid.enc));
check("neither leaves an empty item behind", paid.items.length === 1 && paid.items[0].name === "a dagger");
// "(45gp value)" PRICES an item; it is not money the character is carrying.
const valued = parseEquipment("gemstone-tipped staff (45gp value)", menu());
check("a priced item adds no coin to the purse", valued.gp === 0);
check("and keeps its whole printed name", valued.items[0].name === "gemstone-tipped staff (45gp value)");

/* --- What the coin lift leaves behind is not an item ----------------------- */
// Taking "20gp of equipment of the character's choosing" out of its clause used
// to strand the words in front of it, and "a further" went on the sheet as gear.
const further = parseEquipment("a dagger, and a further 20gp of equipment of the character's choosing", menu("Dagger"));
check("a stranded connective is not an item", !further.items.some((i) => /^(a further|and|a|of)$/i.test(i.name.trim())));
check("and the gear beside it survives", further.items.length === 1 && /dagger/i.test(further.items[0].name));
check("while the coin is still read", further.gp === 20);
// The guard names function words, not one reported phrase, so it must never
// reach a descriptor that carries a noun — however short or common the noun.
check("a real item made of short words is kept", names("a war dog").length === 1);
check("an item whose name is mostly function words is kept", names("suit of plate").length === 1);

console.log(`test-starting-equipment: all ${pass} checks passed`);
