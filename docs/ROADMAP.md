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
(the whole Appendix A taxonomy, read from the seat's own book at import time —
no language entry ships in this module; see DECISIONS 2026-08-15).

**Measured 2026-08-15.** Everything the cookbook can materialize was imported
into a world holding the seat's six books (1,307 documents), and each system
and module pack was compared against it document by document. Counts below are
that comparison. Two cautions on reading them: a miss can be a NAMING or
MODELLING difference rather than absent content (the system pack enumerates
"Craft: Smithing" and "Combat Trickery: Disarm" where the register carries one
`Craft` / `Combat Trickery` entry with picks), and the monster leg did not
finish inside its budget, so the monster numbers are unverified rather than
low.

| Pack | Docs | Not produced by the import | Verdict |
|---|---|---|---|
| `acks-languages` | 58 | **0** | **superseded in full** — now hidden by `hideSupersededPacks` |
| `acks-adventuring-equipment` | 103 | 11 | partial |
| `acks-all-equipment` | 55 | 15 | partial |
| `acks-clothing` | 38 | 17 | partial |
| `acks-proficiencies` | 119 | 35 (many pick-modelled) | partial |
| `acks-class-abilities` | 20 | 12 | partial |
| `acks-monsters` | 44 | 27 | UNVERIFIED (import timed out) |
| `acks-monster-abilities` | 52 | 48 | UNVERIFIED (rides the monster import) |

No system pack carries an Active Effect, so for these the question is only
whether the document exists; the module packs are the reverse (41/42, 32/34,
19/20 carry effects) and are covered above.

**Not covered — the gaps:**

- **Named equipment the import does not produce.** Coins and trade bars
  (Copper/Silver/Gold/Platinum, Furs), the helmet line (Light, Heavy Dwarven,
  Heavy Elven), the three Saddle and Tack rows, candles by material, bundled
  rows the price list sells as one purchase (Torches (6), 30 Sling Stones,
  1 Silver Arrow), Craftsman's Tools, and the ironbound chest. Roughly 43
  entries across the three equipment packs.
- **Thief-skill powers as documents.** `acks-class-abilities` prints Backstab,
  Climb Walls, Hide in Shadows, Hear Noise, Move Silently, Find Traps and the
  rest as items; the register models the skills as class ladders instead, so a
  world that imports has the NUMBERS but not the twelve documents. Decide
  whether that is a gap to close or a modelling difference to state — it is
  currently neither.
- **The monster legs were never measured.** Importing 287 monsters exceeded the
  audit's budget. Until it completes, `acks-monsters` and
  `acks-monster-abilities` are hidden by `hideSupersededPacks` on a floor of
  ten imported monsters while nobody has checked what the other 34 contain.

- **Spell lists** (system packs: 56 arcane, 19 divine). Deliberately parked —
  spell references land with the magic major (see the classes and repo
  roadmaps); the register carries the casting ladders but no spell documents.
- **JJ shield variants and masterwork gear.** Zero `buckler`/`kite shield`
  entries and one `masterwork` mention across the register, so extras'
  `equipment-samples` pack stays the only source of these and could not be
  retired with the other example packs. Closing this means reading the JJ
  shield table and the masterwork rules into equipment entries.
- **Class training grants — what a class may WIELD and WEAR.** The whole of
  extras' `equipment-training` pack (34 items: 5 fighting styles, 5 armour
  rungs, 18 weapon selections) has no counterpart here. The register's four
  `kind.combatProficiency` entries (`def.prof.weaponProficiency`,
  `armorProficiency`, `fightingStyles`, `nonProficientUse`) are the RULES TEXT
  and carry no effects; `kind.class` entries carry `profList`, `awards`,
  tables and `equipAliases` but no weapon-selection or armour-rung data. So an
  imported class says which proficiencies it awards and never which weapons it
  may carry. Until this is read off the JJ pp. 290–291 class-construction
  chunks, that pack is the only source of those grants, and a world without it
  falls open: extras' `weaponProficiency()` answers "all" and `armorMax()`
  answers "heavy" rather than refusing. Closing it needs the grant vocabulary
  (`flags.acks-extras.weaponProf` / `.armourProficiency` / `.styleProficient`,
  documented in extras' `scripts/equipment/proficiency.mjs`) emitted per class.
- **Three henchmen mechanics the abilities model cannot yet say.** Extras'
  `proficiencies-powers` is otherwise redundant — its bonuses are recovered
  either by the henchmen collector's name fallbacks or by the typed
  `modifier target=reaction` specs this module already ships — but three have
  neither route: **Inspire Courage's morale-roll bonus**, **Utter Domination's
  morale BASE of 4** (a floor, not a bonus), and **Beast Friendship's hiring
  magnitude** (the name fallback grants a bonus but not the +2). Additionally
  `def.prof.command` and `def.prof.leadership` are `audited: false` with no
  effects, so the two proficiencies most central to henchman morale are
  carried by the name fallback alone.
