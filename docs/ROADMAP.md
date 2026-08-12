# Roadmap

Designed but not built. Anything here is deliberately absent from the code, not
missing from it.

---

## Cross-book merging beyond the current signals

Families merge today on a shared member id or a shared family suffix. Entries
that are the same creature under different names in two books — with neither
signal — still import as twins. A chef-authored alias would close it; the
question is whether that belongs in the register or in the binding.

---

## Locators for gear values

Cost, weight, weapon damage and armour AC currently fall back to the system's
defaults, with the printed table governing and the entry marked unaudited. No
chef-authored locators ship for them yet.

The pattern is proven — the defence and effect scans already do exactly this, and
`powerValue` was moved onto it — so this is authoring work, not design work.

---

## Gnostic invocations as documents

The Earthforger and Furnacewife casting entries carry the gnosis kind and the
Maximum Invocation Level ladder, but their invocation lists (BTA ch.5) are not
imported as documents — matching the RR classes, whose spell lists are also
empty on the casting entry. When spell-list references land for the vancian
classes, the invocation lists should ride the same mechanism.

---

## Merging duplicate imports already in a world

The importers no longer make twins (DECISIONS, 2026-08-06), but a world that
ran the earlier ones still holds them. Removing the extra copy is not enough:
actors that embedded a shared ability point at whichever copy their import
happened to resolve, so a merge has to re-point those embeds, and a GM who
edited one of the twins has to be told which one wins. That is a migration with
a confirmation surface of its own — a minor.

Until then the clean-slate path is the answer and it works: Remove ALL Imports,
then import again. It is exactly what the test cycle does.

---

## Starting equipment: telling gear from what it is packed with

`parseEquipment` splits a template's printed Starting Equipment cell into items.
Splitting it correctly is a solved problem — commas and semicolons separate,
brackets hold, a counted container yields device plus load, and a pair of known
items yields two. What the splitter cannot do is decide what the pieces ARE.

A cell that reads "enameled spellbook with discern magic and one spell of
character's choice" names one piece of gear, one SPELL recorded in it, and a
choice the player has not made yet. All three arrive as items, because nothing
in the wording distinguishes them: "discern magic" is shaped exactly like the
name of a trinket, and a rule that guessed would drop real gear whenever it
guessed wrong.

Closing it needs a source of truth the splitter does not have — the spell list,
so a descriptor naming a known spell becomes a spell reference on the book that
carries it rather than an item; and some way to represent "one spell of the
character's choice" as a decision the sheet asks for rather than a line of
inventory. Both are the abilities/magic model's to own, not the splitter's.

Until then the pieces are all items, correctly separated, and a Judge deletes
the two that are not gear. That is a tidier failure than the alternative and it
loses nothing.
