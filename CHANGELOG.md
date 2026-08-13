# Changelog

## 2.6.0

Stabilization release — the importer's share of the 2026-08-07 hygiene
sweep's backlog.

### Fixed
- **"Forget books" no longer claims success it did not have.** The success
  toast is gated on both clears actually completing; a partial or failed
  forget warns instead.

### Changed
- Document-type checks read frozen `ITEM_TYPE` / `ACTOR_TYPE` constants
  instead of scattered string literals.
- Swallowed failures across the import pipeline now log what failed through
  the module prefix instead of vanishing in bare catches.
- The validate harness (synced from the module template) now checks path
  case-sensitivity against CI's case-sensitive filesystem, enforces the
  `relationships.requires` invariants, and no longer lets a longer sibling
  key shield a missing exact i18n key.

## 2.5.0

### Added
- **The Judges Journal table import now reads the whole class-builder
  chapter.** New table recipes extract the category value ladders (Hit Dice
  with mortal-wounds bonuses, the Fighting summary with its 1a/1b split,
  Thievery, Divine, Arcane), all eleven printed per-value spell grids —
  Divine 1–4, Arcane 1–4 and the three Delayed Acquisition variants — the
  trade-off table with its XP penalty, the saving-throw precedence, the
  post-8th XP increments, the smoothing rule, the racial level-cap table, and
  the dwarven and elven racial sections. As always, geometry and anchors ship;
  every number is read from your own copy at import time.
- **The import leaves working examples, not just tables.** After the raw
  extraction, the binding assembles the shape the ACKS Extras class builder
  consumes, materializes Dwarf and Elf race documents from their printed
  ladders (requirements, per-rung costs, base powers, the elf's arcane
  stacking and discount, each race's post-8th increases), and stamps the
  Ready-for-Play builds from the back of the chapter onto the twelve matching
  core and demi-human class documents — each opens in advanced mode with its
  printed allocation filled and its build paragraph in the notes. Requires
  ACKS Extras 3.8.0 to put the builder tables to work.

## 2.4.7

### Fixed
- **Each file goes to the book it belongs to, whatever order you pick them in.**
  Selecting four books and picking their four PDFs in one trip gave every book
  somebody else's copy: the Revised Rulebook opened the Judges Journal, the
  Judges Journal opened the Monstrous Manual, and each one warned that it was a
  "different edition/printing" of the book it was not. Files were paired to books
  by position — the first book selected took the first file picked — and neither
  order is the reader's: the book list reports its selection top to bottom
  however it was clicked, and the file picker hands its files back in its own
  order, usually alphabetical. The stock DriveThruRPG filenames sort differently
  from the way the books are listed, so they rotated straight past their own
  books. Each file is now matched to its book by the name this seat used for it
  last time, its size, or the book's title in the filename — the same rules that
  already placed surplus files, now asked first. Position decides nothing unless
  no evidence can place a file at all, and one book with one file works exactly
  as before.
- **A file that is another book is not read into this one.** The module could
  tell the file was the wrong book — that is what the "different printing"
  warning said — and read it anyway. Everything the importer extracts is a page
  number, so a book filled from the wrong PDF quietly imports the wrong pages
  under the right names, with nothing afterwards to show for it. A file that
  identifies as a different ACKS book is now refused, and says which book it
  actually is: nothing is read, so nothing needs undoing. A printing the module
  simply does not recognise still opens with the usual warning — an unfamiliar
  edition is not a wrong book.
- **A book that opened is never reported as one that didn't.** If the browser
  refused to store where a book came from, the message said the book "could not
  be opened" — of a book sitting there open and readable. Remembering the
  location is now reported as its own outcome: the book is open, and you will be
  asked for the file again next session.

## 2.4.6

### Fixed
- **An item from a price table describes itself, not the key behind its
  description.** A weapon or armour imported from one of the book's tables
  showed a line of code where its description should be —
  `ACKS-IMPORTER.pdftext.def.weapon.staff` on a staff, and the same for every
  other row. Those items build their own reference to the page they came from,
  and nothing knew how to word that reference for a seat with the book closed.
  Each now reads as every other unopened entry does: its name, the page it is
  printed on, and how to read the rest. With the book connected nothing changes
  — the text was always reachable.
- **Starting equipment separated by semicolons is separated.** A class whose
  printed equipment list groups with commas and separates with semicolons had
  everything after each semicolon welded onto the item before it, so a
  character began play holding one item named for two — a spell and a staff on
  a single line. A semicolon now ends an item exactly as a comma does, and one
  inside brackets still does not.
- **No item is named "and something".** The last entry of a printed list —
  "a spear, a shield, and a helmet" — arrived carrying the conjunction as part
  of its name. The step that strips it ran before the spacing was tidied, so it
  could only ever match the first item of a list, which is the one that never
  begins with "and".
- **Two pieces of gear joined by "and" arrive as two.** "Spear and short sword"
  imported as a single item named for both weapons. Before splitting a pair, the
  parser checks whether the whole phrase is already a known item — that is what
  keeps "tunic and pants", one printed outfit at one printed price, in one
  piece. But the check matched on any catalogue name merely *contained* in the
  phrase, and "spear and short sword" contains "short sword", so the pair read as
  something already known and was never split. The longer the second item's name,
  the more certain it was to happen; the split only ever worked when both names
  were very short. The whole phrase now has to match a known item outright.
  Outfits and aliased entries still stay whole.

## 2.4.5

### Fixed
- **A refill takes back what the page no longer yields.** Refreshing an
  already-imported monster could add and overwrite stats but never retract
  one: a value an improved recipe no longer produces — a mis-read treasure
  type, a morale score, appearing dice — survived every refill. Each stat the
  binder owns is now returned to the state a fresh import would leave whenever
  the re-extraction does not produce it. A linked treasure table is the
  Judge's own and is never touched.
- **Update Abilities retracts what a definition dropped.** An entry that
  un-deprecates, or loses a prerequisite, alias, granted capability or power
  value, now clears that field from every already-imported copy on the next
  Update run; before, the stale value was kept forever, because an update
  could add and overwrite but never take away.

## 2.4.4

### Fixed
- **A template hands over the coin it prints, in the coin it prints.** Starting
  money was read as gold and only as gold, so a package paying in silver paid
  nothing: a proselytizer's twenty silver for alms, a priest's twenty-five, a
  tribal warrior's sixty-five, and the silver that rounds out a hedge wizard's
  and a noble magist's purse all vanished — and three of those characters began
  play with no money whatever. The silver arrives with the gold now, and the
  words that named it stop turning up in the equipment list as an item called
  "20sp for alms".
- **What an item is worth is not what the character is carrying.** A staff
  tipped with a glass gemstone is priced at forty-five gold in its own
  description, and that was being counted into the purse — a noble magist began
  with seventy-nine gold instead of thirty-four — while the bracket it was
  written in cut the staff's own name in half.

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
