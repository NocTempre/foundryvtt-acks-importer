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

## A prose box that does not contain its own heading

Twenty-three entries are scoped to a region their anchor does not appear in, so
they extract whatever prints there instead of their own text: `def.equip.coat`,
`tunicAndPants` and `turban` show columns of price digits. The measure is exact
and cheap to re-run — an entry's FIRST paragraph, on the anchor's own page,
must contain the anchor's x.

The cause is `detectColumns`. It bins body-run x-positions and needs a bin
holding >8% of them, which a table starves: BTA p95 prints columns at x=36 and
x=306 and the detector returns 240 and 310. `defColumns` already repairs the
one-column case from run-in heading positions.

The multi-column case cannot be repaired the same way, and the attempt is
recorded because it looks obvious. Supplying the missing edge leaves the FALSE
edge in place: RR p71 returns [140, 330], where 140 is the Totem Animals
table's left edge and the real prose column starts at 72. Adding 72 closes the
box at 134, and Totem Animal loses the continuation it flows into — a truncated
description in place of a wrong one, which is worse. Requiring body lines at
the edge does not separate the cases either; x=72 has forty of them and is
genuinely a column.

Closing it needs the detector to say which of ITS columns are prose and which
are table structure — evidence a histogram of x-positions does not carry.
Run-in headings are that evidence (a prose column on a definition page has
them; a table column does not), so the shape is probably to drop detected
columns with no heading at their edge, verified the same way the boundary work
was: recompile, diff all 1200 entries, and read what changed.

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

## The system compendiums this importer does NOT yet replace

acks-extras 4.1 folds a system compendium out of the sidebar once the world
holds imported documents covering it (`hideSupersededPacks`). The map behind
that setting is a coverage audit, and every pack ABSENT from it is a gap here
— content a GM can only get from the system's own pack, which is exactly the
dependency materializing from their books is meant to end.

Covered today: weapons and armour (the book's own tables, via
`importWeapons`/`importArmor`), adventuring gear and clothing (178 register
entries), proficiencies (121 + 14 skills + 4 combat proficiencies), powers
(421), monsters (287 + 25 legacy + 4 templates), roll tables (23), languages
(58 — the whole Appendix A taxonomy).

**Not covered — the gaps:**

- **Spell lists** (system packs: 56 arcane, 19 divine). Deliberately parked —
  spell references land with the magic major (see the classes and repo
  roadmaps); the register carries the casting ladders but no spell documents.
- **JJ shield variants and masterwork gear.** Zero `buckler`/`kite shield`
  entries and one `masterwork` mention across the register, so extras'
  `equipment-samples` pack stays the only source of these and could not be
  retired with the other example packs. Closing this means reading the JJ
  shield table and the masterwork rules into equipment entries.
