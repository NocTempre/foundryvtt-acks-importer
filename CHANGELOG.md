# Changelog

## 2.4.3

### Fixed
- **A bonus records what it is a bonus to.** An ability's modifiers were read
  off the page for their size and their kind and never for their subject, so
  "a +2 bonus on Lockpicking proficiency throws" and "a +2 bonus on Hiding and
  Sneaking proficiency throws" both arrived as an unattributed +2 to proficiency
  throws — indistinguishable from each other and from every other, and useless
  to anything that wanted to apply one. The activity the sentence names is now
  kept, so a proficiency that improves another one finally reaches it.
- **A methodical attempt gets its bonus.** Lockpicking, Searching and
  Trapbreaking each state a throw worth four more when made slowly, and each
  stored that bonus beside a throw it never reached — so a thief picking a lock
  methodically was scored against the hasty number. The bonus now names the
  throw it belongs to rather than being matched against its own prose, which
  mentions both attempts in one breath and would land it on the hasty throw too.
- **Searching offers the two attempts it always had.** The book gives it a hasty
  throw and a methodical one, as it does for picking a lock and breaking a trap;
  only Searching arrived as a single unlabelled throw.
- **A class records whether its templates already spend an Intellect bonus.**
  The studious spellcasters' starting packages are built assuming one, and
  nothing said so — so character generation offered it a second time and gave a
  character below that band more than they may hold.

Values are read when an item is created, so **delete and re-import** the
abilities and classes you want these to reach. Anything already in your world
is left exactly as it is until you do.

## 2.4.2

### Fixed
- **A deleted import can be imported again, in the same sitting.** 2.4.1 gave
  the importers a session-long memory of what they had already made, and that
  memory outlived the documents: delete an imported item to pick up a changed
  price or a corrected description, run the import again, and it was told the
  item was already there — the refresh only worked after a page reload. The
  memory now confirms a document still exists before it speaks for it, and an
  import in progress stops being remembered the moment it finishes. Importing
  the same thing from several places at once still yields one document.

## 2.4.1

### Fixed
- **An import asks the shelf it writes to.** Equipment, location journals,
  adventure roll tables and an ability's companion creature all checked the
  world sidebar for what was already there while writing into a compendium —
  so a GM who had switched imports to a compendium got the whole shop list,
  every district journal and every table again on each run, and the counts
  reported them as new. Each check now reads the same place its import lands.
  Worlds that leave imports in the sidebar were never affected.
- **A shared ability is imported once, however many things ask for it at
  once.** Monsters and NPCs import four at a time and each resolves its own
  proficiency list, so four creatures reaching for Alertness in the same
  moment each found nothing and each made one — four copies of one
  proficiency, and the creatures split between them. The first request now
  claims the ability and the rest wait for it, which is also what makes the
  class import and the ability import land on the same item instead of one
  each.
- **A macro marked "(GM)" is a GM's to run.** Import Character Classes,
  Import ALL Equipment and Update Classes were the only bulk imports with no
  seat check, while their macros are visible and runnable by everyone. In a
  world that grants players item creation — the usual arrangement where
  players build their own characters — a player pressing Import Character
  Classes added a second set of all 31 to the world; Update Classes let them
  rewrite the set. They now decline for anyone but the GM, as the rest of the
  import macros already did. Worlds on the default permissions were shielded
  by Foundry's own check and only ever saw the polite refusal arrive late.
- **Import everything means everything.** The walkthrough's one-click chain
  skipped character classes entirely and never linked companion creatures.
  Classes now import after the proficiencies and equipment their awards point
  at, and companion slots are filled once the creatures exist — the order
  prerequisites actually need.
- **Loading a page twice does not load it twice.** Browse & Load a Page made
  a fresh document each time it was pointed at a heading it had already
  loaded. The document now carries the page reference it came from and is
  reused.
- **A cached illustration is proved cached once, not once per creature.**
  Importing a book listed the whole art directory again for every creature —
  a request that grows with every image imported, taken hundreds of times
  and queued behind three other importers, so a world whose art was already
  on disk still spent minutes proving it. The listing is taken once per
  session and kept true as images are added.

## 2.4.0

### Added
- **A spellbook's contents become the template's spells.** Where a starting
  package prints "spellbook with sleep and magic missile", the book imports
  under its own name with a note of what it holds, and the named spells land
  on the class template's spell list — so chargen can grant them as spell
  items. Already-imported classes pick this up on the next Update Classes
  run.
- **An item priced only in prose still gets its numbers.** Equipment whose
  entry states its cost, weight in stone, or damage die in the paragraph
  rather than a price grid — most of the dwarven chapter — now reads those
  values out of its own text at import: "Cost: 2,000gp" fills the price,
  "weighs two stones" the weight, "dealing 1d8" a weapon's damage.

## 2.3.0

### Added
- **The dwarven equipment chapter imports.** Thirty-seven By This Axe items —
  the delver's harness, gnostic implements, the dwarven brewer's lab, helms
  and workshops, the fuels, the earthshooter, the bears — come in as
  equipment documents with their page text behind the per-seat reveal, so a
  dwarven template's gear lands as instances of real base items instead of
  bare names. Items the Revised Rulebook already defines (prosthesis,
  earplugs, ear trumpet, mess kit, metamphora) stay the Rulebook's.
- **A counted container splits into itself and its contents.** "Quiver with
  20 arrows" imports as a quiver plus twenty arrows — the count lands on the
  arrows where the sheet can spend it, and the contents record what carried
  them. A pair splits only when both halves are known equipment: "spear and
  short sword" becomes two weapons, while "tunic and pants" — one outfit,
  one printed price — stays whole. Already-imported classes pick this up on
  the next Update Classes run.

## 2.2.0

### Added
- **A printed either-or imports as a real pick.** Four classes' choose-one
  powers now come in as choices on the class document, offered at character
  creation and granted as the option taken: the warlock's dark path, the
  witch's tradition (the traditions table, whole, behind each option), the
  barbarian's tribal origin (the regional combat-proficiencies table
  likewise), and the By This Axe earthforger's sigil — four sigils, each
  read from its own section of the book. Every option is its own document
  with the page's text behind the per-seat reveal, and the source matrix
  seats each one under its class.

## 2.1.0

### Added
- **By This Axe deals its classes.** Connect the By This Axe PDF and Import
  Character Classes brings in its ten dwarven classes — Delver, Earthforger,
  Excavator, Furnacewife, Fury, Machinist, Pugilist, Rhetor, Sporecaster,
  Tombsealer — read whole from your book: level progressions, their own
  factored attack and saving throw tables, skill ladders, starting caste
  templates from the templates chapter, class powers at their printed levels,
  and gnostic casting for the earthforger and furnacewife (the Maximum
  Invocation Level ladder rides the class document). The five proficiencies
  only that book defines import with the rest, and the class proficiency
  pick schedule is read from each spread's own Proficiency Progression
  paragraph.
- The craftpriest and vaultguard stay the Revised Rulebook's: By This Axe
  reprints them, and the source matrix records where the printings differ.
  Powers the Judges Journal already defines keep their entries — a world
  without By This Axe loses nothing.
- The By This Axe dwarven-caste split and its scavenged-parts equipment
  tables now import with the rules tables.

## 2.0.0

### Added
- **Your book deals the classes.** Import Character Classes reads all
  twenty-one Revised Rulebook classes from a connected PDF into class
  documents acks-extras plays: progressions, saves and attack throws, award
  ladders, starting templates, spell slots, and per-class proficiency lists.
  (Released 2026-08-05; recorded here with 2.1.0.)

## 1.2.0

### Changed
- **The importer's windows are ACKS windows.** Every dialog this module opens —
  the book loader, the cookbook screens, Getting Started — now wears the same
  frame as the rest of the family: the porphyry running head, square rules, and
  the burgundy-and-black palette the books are printed in. It follows your seat,
  light or dark, and answers to the ACKS colour scheme setting that acks-extras
  provides. Nothing about importing changed; only what it looks like while it
  runs.

### Fixed
- **A dark seat is drawn in dark-seat colours.** The dialogs asked Foundry for
  their rules and their hint text through variables Foundry defines only once,
  for a light client, so on a dark seat they came back as light-theme grey.

## 1.1.0

### Added
- **Update Abilities asks before it overwrites what it did not write.** An
  ability matched only by its name belongs to whoever wrote it, and its
  description is no longer replaced without a word. Every such match is now
  listed first, with the text that would be lost shown, and each one is yours to
  settle: keep your version, or take the book's. Keeping renames yours to
  "*name* (original)" and creates the module's reference beside it, so the
  character ends up holding both — the text you wrote, and a working reference
  with its mechanics. The list defaults to keeping, has **Keep every one** and
  **Replace every one** for a world with hundreds of matches, and closing it
  without answering leaves every ability exactly as it was.
- Running Update Abilities twice does what running it once did: an ability kept
  and renamed is never picked up again, and the reference standing beside it is
  refreshed in place. The closing summary now reports what was renamed, what was
  created, what was replaced on request, and what was left alone.

### Fixed
- **Connect a book takes the books you choose.** The book list is now a
  multi-select, and the books you pick are filled from the files you pick, in
  the order you picked them. Choose more books than files and it names the ones
  left closed rather than opening one and stopping.
- **A multi-file picker is one again.** Foundry quietly strips attributes it
  does not allowlist from a dialog's markup, and `multiple` on a file input is
  one of them — so on Firefox, or on any seat reached by a network address
  rather than localhost, the picker had always taken exactly one file however
  many the module asked for. Every dialog in the module is now built in a form
  the sanitiser leaves alone. This is why picking several books never worked for
  the seats it was written for.
- **A book is recognised by the name it downloaded under.** Files named
  `ACKS_II_Revised_Rulebook.pdf` or `By.This.Axe.pdf` matched nothing, because
  only the spaced title was looked for; underscores, hyphens and dots are now
  read as spaces.
- **A book reconnected from its own row survives a reload**, as every other way
  of opening one already did.
- **Importer windows show what they hold.** They scroll their contents instead
  of cutting them off, their buttons stay reachable at the bottom, the connect
  and reconnect windows can be resized, and the ability and monster lists grow
  with the window rather than stopping at a fixed height. Long file paths wrap
  instead of running off the edge.
- The Connect button said **Extract**. The Getting Started panel named a
  compendium that does not exist — the macros ship as "ACKS Importer — Macros" —
  and browsed documents landed in a folder named after a development phase.

## 1.0.0

### Added
- The first full snapshot gallery: the book loader, the onboarding panel and
  the entry picker, each embedded in the guide that explains it.

## 0.3.1

### Fixed
- The 0.3.0 artifact still carried docs/. The tag was pushed before the
  template change that excludes it.

## 0.3.0

### Changed
- Documentation restructured into four kinds: MODEL, DECISIONS, ROADMAP and
  guides/. Code comments now explain mechanics only.
- Withdrawn surface is recorded in docs/DECISIONS.md rather than narrated in
  the files it was removed from: the demo book, the Judge's Screen inserts,
  the PoC driver, a duplicate LevelValue resolver, and the offline-resolved
  powerValue that put book values in the module.
- The equipment-root ruling is owned by acks-extras; both sites here point at
  it instead of restating it.

### Added
- docs/guides/ for the three workflows, plus GALLERY.md and docs/README.md.

No user-visible behaviour change, so no release snapshots (TOOLCHAIN §4b).

## 0.2.0

Identity and icon cleanup (2026-08-02).

### Fixed

- The ready message advertised `acksContent.*()` console commands — a global
  that has not existed since the rename from acks-content (the real one is
  `acksImporter`) — and a macro folder that never matched the shipped pack.
- The organize/remove macros pointed at `icons/svg/sort.svg` and `trash.svg`,
  which Foundry v14 does not ship.
- User-facing errors no longer prescribe dead modules ("needs acks-lib
  0.17+", "update acks-location", "Enable acks-location"): they describe the
  live requirement, ACKS Extras.

### Changed

- **The pre-rename identity is gone all the way down**: `ACKS-CONTENT.*`
  lang keys are `ACKS-IMPORTER.*`, `acks-content |` notification prefixes
  (~137 across scripts and every macro body) say `acks-importer`, CSS
  classes are `acks-importer-*`, and a validator guard FAILs any survivor.
  Pack `_id`s keep their `acksc` prefix — id is identity, and renaming it
  would duplicate every imported macro. The `ACKS-HENCHMEN.rarityTable.default`
  mirror keeps its name by design (it is written into world data and
  localized by ACKS Extras).
- **98 register entries adopt the system's purpose-drawn icons** by exact
  name match (proficiencies, class powers, and gear like backpack/crowbar/
  holy-water); `propose-icons` now indexes the system tree alongside Foundry
  core, and `lint-register` accepts the guaranteed-present system prefix.
- Icon-path existence is validated against a discoverable install/checkout.

## 0.1.0

First release, from `acks-content`. Ships the cookbook recipes, the extraction
engine that runs them, and the binding layer that lands their output on ACKS II
documents. Recipes are page geometry, patterns and anchors — no book text.

### Changed by the merge

- Requires **ACKS II — Extras**, which now owns everything imported content
  lands in: the rules-table registry, the `animal` and `template` actor
  sub-types, the ability effect model and the Full Monster Sheet.
- Sibling APIs are reached through `globalThis.acksExtras`; this module exposes
  `globalThis.acksImporter`.
- Flag scopes split by purpose. Provenance (`cookbook`, `generated`) stays under
  `acks-importer` — flags of an uninstalled module persist, so an imported world
  keeps working once this module is removed. The light marker is written under
  `acks-extras`, because that is the scope its equipment feature reads.
- The Full Monster Sheet is no longer optional, so the fallback that wrote
  monster prose to `system.details.biography` instead is gone — one description,
  one home.
- `register/` no longer ships in the release zip; nothing reads it at runtime.
