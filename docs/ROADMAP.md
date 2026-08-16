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

## A definition heading that opens mid-line

`def.power.masteryofdominationanddeception` is a run-in whose heading does not
start its line: JJ p323 closes the previous entry with "Elven Courtier]" and
opens this one immediately after, at x=129 in a column starting at 72. Every
rule that locates a run-in assumes it is flush left — the stop that ends the
previous block, the section test, the column-edge check `assists.columns`
states. Nothing is currently wrong with what it extracts (it is an alias and
reads its target's passage), so this is a latent assumption rather than a
defect, and it is written down because the next such heading may not be an
alias.

---

## The printed traps, as mechanics rather than a price

`acks-extras` 4.9.0 built the whole of the delve chapter's trap procedure and an
`acks-extras.trap` Item to hold one, deliberately so this importer would have
something to materialize into. Nothing here fills it.

What already imports is the CONSTRUCTION side and only that: thirteen trap rows
come across as `kind.equipment` / `meta.group: "structure"` from the RR price
list at p.152 — `def.equip.arrowFiringTrap`, `deadfallTrap`, `portcullisTrap`,
`scythingBladeTrap` and the rest — each carrying a name, a citation and its
description. A Judge who imports gets what a trap COSTS to build and no way to
spring one.

The mechanics print in the Judge's Journal, pp. 241–243, under STEP 7: PLACE
TRAPS. Each trap is a named entry giving six tiers, one per trap level, and the
tier states the attack throw or the save, the damage, and whatever rider it
carries. Page 240 holds the two things every trap reads from: the trigger
mechanisms and the trap-level rule.

**DONE 2026-08-16 — the kind and the entries.** `kind.trap` is minted
(`register/_kinds/trap.json`) and all thirteen printed traps are authored in
`register/jj/p241-p243-traps.json`, compiling to `cookbook/traps.json`. Thirteen,
not the eleven this family used to say: the wiki snapshot's chapter-8 outline
lists Ceiling Collapse, Deadfall, Excavated Earth Pit, Fire, Missile, Needle,
Portcullis, Rock-Cut Pit, Rolling Rock, Scything Blade, Spring Snare, Swinging
Log and Whipping Branch, and the pages agree.

They anchor through the existing `subheading` locate mode — the trap names are
solo runs of a distinct font at body size, which is exactly what that mode was
built for, so no new locate strategy was needed. Each carries an
`assists.columns` pair because the indented tier lines defeat column detection
(the 2026-08-15 ruling: author the assist, leave the detector alone), and the
spread is mirrored, so odd pages state `[72, 329]` and even pages `[45, 302]`.
Verified against the wiki: every entry materializes exactly two blocks — the
description and the run of six level tiers — except Portcullis, whose three are
one block broken by a column turn.

**DONE — the binding, and the decision it was waiting on.** Extras 4.12 rebuilt
`TrapData` so ONE document holds all six levels (`levels`, with `level`
selecting the row in force), which settles the question this section used to
pose: thirteen documents, not seventy-eight. A scything blade is one trap; what
changes with its level is what it does, not what it is.

`importTraps()` builds them. Two things are read out of the seat's prose and no
more: the tier SPLIT, which is the book's own numbering and the same kind of
structural cut `parseEquipment` makes on a starting-equipment cell, and the
damage dice, which is the frozen `dice` locate. Each level's printed sentence is
kept WHOLE on the row beside them.

Everything that would take a judgment — save or attack throw, which save, what
beating it is worth, how far the effect reaches — is deliberately left at its
default with the sentence sitting next to it on the sheet. A wrong-but-plausible
save key is worse than a blank one, and reading those out of prose is the
interpretation this pipeline keeps offline (RECIPES §1).

Measured against the reference library: **all thirteen traps yield all six
levels**, and eleven yield damage dice on five or six of them. The two that
yield none are the pits, correctly — a pit's damage is printed as a DEPTH, and
extras derives it from that. Where a tier states several dice the first is
taken, which is not always the headline number (a needle's poison die can beat
the needle's own), so the printed sentence is the authority and the field is the
convenience.

`kind.trap` is in `NON_ABILITY_KINDS` — without that a new definition kind
silently joins the ability import and mints items that fail validation, which is
what shipped in v0.26.0 — and `def.trap` files onto a "Traps" shelf.

---

## Variations: the documents an item's differences are made of

`acks-extras` 4.11 models a difference between one item and its plain self as
an `acks-extras.variation` Item, applied to a base item by the `containedIn`
relation gear uses to sit in a backpack. The module ships the mechanism and no
values: masterwork's surcharge, silver's multiplier, a buckler's rating and a
gem's cut are page values, and a world imports them or has none. A Judge can
type one in by hand, exactly as they can a trap.

So this importer owes two things, and neither exists yet.

**One document per published variation**, materialized into a compendium the
same way abilities and traps are. The `system` shape it must fill:

| Field | What it holds |
|---|---|
| `key` | namespaced, `masterwork.weaponToHit` — the PREFIX is the exclusivity group, so two variations of one family can never sit on one item. Choosing the prefix IS the modelling decision |
| `appliesTo` | base types (`weapon`, `shield`, `gem`, …). Empty means any, which is right for most |
| `supersedes` | printed cross-family rules ONLY, `magical.*` patterns allowed. Empty unless a page states one; magic superseding masterwork is the single known filler |
| `deltas` | `bonus`, `damage`, `ac`, `weight6` |
| `cost` | `baseMul` scales the item's listed price, `add` is a flat surcharge, `mul` scales the whole — the rules' own order, and silver must not multiply a masterwork surcharge |
| `dataFields` | field specs for anything this variation records per instance (a gem's carat, a named blade's ladder) |
| `conditional` | value claims reported to the Judge, never applied |

The pages to read: the masterwork tiers and their surcharges, the silver
quality's multiplier, the JJ shield table's forms and carry states, and gem
quality wherever the Judge's Journal and Treasure Tome print it.

**The `baseTypeFields` table**, in the ruledata document `variations`, keyed by
base type — the field specs a CATEGORY records, which belong to no one document
because they describe every gem rather than one.

Two consumers follow once those land: loot tables and class templates granting
variations by default, and extras retiring its three legacy flags (masterwork,
silver, shield variant) onto documents. Until then a flag owns its family and
extras refuses a variation that would double-count with it.

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

**The first caution turned out to govern most of the counts.** The separate
register-vs-pack audit (`npm run verify:compendium`) was itself miscounting: it
read neither `kind.skill` nor `register/_refs/`, and its alias file had never
been authored, so a name the edition replaced and content filed under another
kind both read as absent. Corrected 2026-08-16, its proficiency gap fell from 16
to 1 and its power gap from 45 to 26 ([DECISIONS.md](DECISIONS.md)). The table
below is the LIVE IMPORT audit, a different measurement, and it has **not** been
re-run — so read these numbers as an upper bound on what is missing, and
re-measure before authoring against them.

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
- ~~**Thief-skill powers as documents.**~~ SETTLED 2026-08-16 as a modelling
  difference, and nothing is owed. The Revised Rulebook's own table names eight
  thief skills — Climbing, Hiding, Listening, Lockpicking, Pickpocketing,
  Searching, Sneaking, Trapbreaking — and the register carries every one as
  `kind.skill`. They are class powers whose target improves with level, so they
  are ladders a class entry references rather than twelve standalone documents.
  `acks-class-abilities` prints Backstab / Climb Walls / Hide in Shadows / Hear
  Noise / Move Silently / Find Traps because it was built against ACKS I; those
  are now aliased onto the ACKS II names. See [DECISIONS.md](DECISIONS.md).
- **Monster resistances and immunities are not documents, by design.** Cold /
  Fire / Gas / Lightning / Piercing / Crushing / Slashing Resistance, Immunity
  to Fire, Regeneration and Superior Regeneration print as items in
  `acks-monster-abilities`. This module materializes them into `fields.defenses`
  by scanning the seat's own description prose against a shipped vocabulary
  ([COOKBOOK.md](COOKBOOK.md), "Defenses are materialized, never baked"), so
  they arrive as a field on the monster and never as their own item. The
  compendium audit still lists them, deliberately — a standing decision should
  be met while reading the report, not silenced inside the tool.
- **`Apostasy` is the one proficiency genuinely absent.** It appears in neither
  the Revised Rulebook nor the Judge's Journal, so it is ACKS I content or
  prints in a book this register has not read. Locate it before deciding
  whether it is a gap at all.
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
  shield table and the masterwork rules into entries — as VARIATIONS now, which
  the next section specifies.
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

## Which languages a class or a race speaks — the human homeland pick

Built for classes and races (2.9.4): a spread's `Tongues:` runin becomes the
class's granted list, a class whose page will not parse borrows from a
sibling of its declared race, bonus grants land as picks, and the race
documents inherit. What remains is the homeland pick itself — the regional
languages a human character chooses from print as prose examples rather than
a table, so that one slot is filled by hand from whatever the world holds.

The Nobiran spread prints no Tongues runin at all, so a Nobiran class carries
the human default and its race declaration waits for a page that names them.
