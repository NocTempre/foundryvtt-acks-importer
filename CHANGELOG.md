# Changelog

## 2.14.0

### Added
- **Put a book on the server and stop reconnecting.** A PDF staged under the
  Foundry data folder is read automatically at every launch, by every GM seat,
  on any machine — no file picker, no permission click, nothing remembered per
  browser. Add one from its row in the Books window, or copy PDFs into
  `acks-importer-books/` yourself and press **Scan the folder**. Either way the
  file is opened and checked before it is staged, so a misnamed PDF is refused
  rather than staged as the wrong book. Removing a book from the server stops
  the module reading it and tells you where the file still is. (A file under the
  data folder can be fetched by anyone signed in to your world who knows the
  path — staging makes a book undiscoverable, not inaccessible.)
- **Reconnect all.** One button that does everything needing no permission
  first — the server's books, served paths, and whatever the browser will still
  open by itself — then spends its single click on the folder you connected
  from, which re-reads every book inside. Anything a folder cannot answer for is
  named as still needing its own button, because one click can only ever
  re-grant one file's access.

### Changed
- **Four macros and three windows became one window.** "Getting Started",
  "Connect Your Book", "Book Status & Reconnect" and "Forget Books" all asked
  overlapping questions in different words, and two of them asked "which book do
  you mean?" separately. **Your ACKS Books** is now the single surface: the
  walkthrough, the server's books, the controls that answer for several books at
  once, and a row per book grouped into waiting / open / not connected. Macros
  you already imported into a world keep working — they open the same window.
- **The book list is gone; the row is the chooser.** Picking books out of a
  six-line scrolling list of twenty was the worst part of connecting, and it
  existed only so files could be paired to books afterwards. Each book's own row
  carries its own control instead, so naming a book takes no list at all — and
  with nothing left to infer, a file the module cannot place is now always named
  rather than dealt into a slot.
- **Forgetting is about this computer only.** It says so, and it leaves books
  staged on the server alone.

## 2.13.4

### Fixed
- **A totem animal is a creature, not a trinket.** The shaman's templates each
  name one in their equipment cell, and each arrived on the character's
  equipment list as an item with no mechanics and no creature behind it. The
  ability that confers the companion — Totem Animal, Familiar, Animal Companion
  — has always carried an empty slot for it, because which creature it is was
  never a property of the ability; the template is the thing that says which,
  and the phrase now becomes that ability's selection. A witch whose proficiency
  column already printed "Familiar" got the ability AND an item named for her
  cat: she now gets one `Familiar (black cat)`. The class's own grant of the
  same ability no longer hands over a second, unselected copy.
- **A head dress is a hat.** The bladedancer's, the priestess's and the gossamer
  one resolve to the shop list's hat and keep the price the page prints beside
  them; they were arriving as nothing at all.

## 2.13.3

### Fixed
- **A price the page prints beside an item is imported with it.** Most of the
  gear a template names in passing — a bladedancer's head dress, a silver
  amulet, an ornamental crystal ball — has no row in the shop list at all, which
  is exactly why the cell prices it where it stands. That number was read only
  to be skipped, so the item arrived with the one value its page ever gave it
  thrown away. It now lands as the item's cost, and where the item does have a
  catalogue base the printed price wins: a staff described as worth 45gp is
  worth 45gp, not what a plain staff costs.
- **A book and the thing after it are two items** where the cell prints no comma
  between them — one holy book was arriving with a quill welded onto its name.
- **A few more of the book's own words are recognised**: a week's rations
  without "iron" said, a heavy helmet under its description, a breast band, a
  hat, an alchemist's tools, a freeholder's dress.

## 2.13.2

### Fixed
- **A starting equipment cell is read in the words the cell uses.** The price
  list writes a name head-first with its qualifier after a comma — "Rations,
  Iron", "Rope, 50'", "Sack, Small", "Horse, Medium riding" — while a template
  writes the same thing as English, and a slash names one row by either word
  ("Waterskin/Wineskin", "Sandals/Shoes"). The two halves of one book could not
  meet: a week's iron rations alone went unrecognised in 142 places. Both
  spellings are now read as the conventions they are, and what no convention can
  reach — "1 lb garlic" for the list's "Herb, Garlic", a scimitar for the short
  sword it stands in for — is written down once for the whole book instead of
  per class. Of 719 printed descriptors that pointed at nothing, 662 now find
  what your book calls them.
- **Things printed across a comma are put back together.** A book's contents are
  an English list — "prayer book with remove fear, angelic choir, and
  counterspell" — and split at the commas its spells went onto the character as
  inventory. They now stay with the book and land in the template's spell list,
  a prayer book's as well as a spellbook's, while a spell the cell leaves to the
  player ("and one spell of character's choice") is no longer created as a spell
  named after the offer. A quiver of twenty arrows is one row in the price list
  and is no longer torn into two things the list has never heard of. Armour worn
  "under" a cassock is two garments, and the cassock is no longer lost inside the
  armour's name.
- **A price in brackets is not money.** An amount was skipped only when the word
  "value" followed it, and the same tables also print "(20gp)" bare — so a witch
  began play with an item named "silver earrings (" and 20 gold she was never
  given. The bracket is the test now, not the word after the amount.
- **Words are no longer broken where the line broke.** A cell that wraps in the
  middle of a hyphenated word gave "Well- made wool dress" and "Blood- stained
  club"; the compound is kept whole.
- **Some gear was quietly filed under the wrong row.** Found by checking every
  descriptor against what it matched rather than only the ones that matched
  nothing: a purple wax candle was imported as a tallow one, a two-handed iron
  sword as an ordinary sword, and a silver sacrificial dagger as plain steel.

Re-run **Import Everything**, or *Import Character Classes* followed by *Build
Class Template Packages*, to bring an existing world's templates onto the
corrected gear. Documents you have repaired by hand are left alone. Gear that
came through welded together by an older import — one item named for two weapons
— is not repaired by that pass: detach that class's packages from its Templates
tab, delete the welded documents, and build again.

## 2.13.1

### Fixed
- **A class's starting equipment is matched against every piece of gear your
  book supplies, weapons and armour included.** The list a printed cell was
  checked against was built from the shop list alone — the weapon and armour
  grids come in by a different route, and nothing joined the two up. Three
  things followed from that. A sword named nothing the importer knew and
  arrived as an unnamed trinket. A war hammer bound to the carpentry hammer
  the shop list does carry, so a dwarf started play holding a tool. And a cell
  printing two weapons — "polished sword and dagger" — was never recognised as
  two, so the character got a single item named for both, carrying the
  dagger's damage, with the sword quietly gone. All three now resolve against
  the gear your import has actually created.
- **A description finds its item by the words it uses, not by their length.**
  Matching a printed description to a catalogue name needed six letters to
  fire, and most of the printed weapons are shorter — sword, staff, spear,
  club, mace, torch, dart. A shorter name now matches when it is a whole word
  of the description, a printed plural counts as that word ("torches" is the
  Torch), and a name buried inside a longer word still matches nothing.
- **A template's skinned gear is no longer mistaken for the gear it was
  skinned from.** Each is a copy, and a copy carried the original's import
  identity — so one class's "aged and dusty staff" could become the name every
  other class's staff was matched against.

Re-run **Import Everything**, or *Import Character Classes* followed by
*Build Class Template Packages*, to bring an existing world's templates onto
the corrected gear. Documents you have repaired by hand are left alone.

## 2.13.0

### Added
- **Character classes import their starting templates as packages.** With ACKS
  Extras 4.14.0, each printed template is also built as a container of the
  abilities and gear it grants, filed under
  `ACKS Cookbook / Classes / Templates`, with a 3d6 roll table per class. That
  is what makes a mis-imported piece of starting kit repairable once, rather
  than on every character generated from it. A **Build Class Template Packages
  (GM)** macro brings worlds whose classes were imported earlier up to the same
  shape, and needs no book connected — it works from the class documents already
  in the world. Importing or updating classes relinks the packages and never
  overwrites a document you have repaired.
- **Imported creatures carry their book's own prose.** Nearly every creature
  from the eleven authored books (476 of 483) now arrives with its
  description — the text above the stat block and the text below it — and with
  its own tables: what it hoards, what it carries, the rows it is stated in.
  Words are no longer welded together at line breaks on the way in.
- **An entry that was never one creature imports as a generator.** A block
  printing a hit-dice range used to arrive as the weakest member of its kind
  with the rest gone; a retainer printed at three levels arrived as three
  strangers sharing a name. Both now build the same varies-by-rank generator
  documents the Monstrous Manual's ranked entries already use.
- **The Dolmenwood Monster Book fills out: 79 entries become 165, each with
  its portrait.** The book prints one monster to a page with a full
  illustration beside it; the entries were being lost to page-geometry bugs,
  and the missing art was the symptom. Pictures are now claimed by the entry
  whose region holds them, so one illustration can no longer land on four
  different monsters.
- **Keyed rooms import as places you can build on.** Quick Delves 1 to 3 and
  Planar Compass 1 to 3 ship their numbered areas — 117 of them — and each
  arrives as a location actor nested inside a location standing for the
  adventure itself, with its description read from your own copy. A room is a
  place rather than a page of notes, so it can hold what is stored there, who
  lives there, and the market it runs, instead of needing a second document
  kept in step by hand. Wicked Little Delves keys its rooms another way and
  ships none rather than guess.
- **One Books dialog for status and reconnecting.** Book Status, the offer to
  reconnect when you join, and reconnecting on demand all open the same
  dialog: every book shows as open, remembered, or absent, with the controls
  to unlock, retry, or connect right on its row — nothing is sent to the
  console anymore. The separate Reconnect macro leaves the pack; worlds that
  imported it keep a working copy.
- **Connect a whole shelf at once.** The connect dialog can take the folder
  your PDFs live in: every book inside identifies itself by its own evidence,
  and on browsers that can remember a folder, next session one permission
  gesture re-opens all of them. PDFs it does not recognize are counted and
  left alone.

### Changed
- **Every shipped macro fails politely on an older module build** — "needs a
  newer build of this module" instead of an error — and the macro folders sort
  their contents in a stable order again.
- **Remove All Imports also sweeps the rules-table documents** materialized
  into the world by ACKS Extras' ruledata provider. Documents only, counted
  in the confirmation; the imported table data itself stays registered.

## 2.12.0

Eleven third-party books now import in one press, and the reader got harder to
fool.

### Added
- **Eleven books ship ready to import.** Connect your own copy and press
  import — no page-hunting, no calibration, no picking blocks off a page. The
  OSE Advanced Fantasy Referee's Tome (340 creatures), the Dolmenwood Monster
  Book (79), all three Quick Delves, all three Wicked Little Delves and Planar
  Compass issues 1 to 3: 483 creatures in all, each carrying the page it came
  from, the block exactly as printed on its Source tab, and the book's own
  illustration where the page has one for that creature.
- **Dolmenwood is read as Dolmenwood.** The Monster Book shares OSE's shelf and
  prints a different block: an armour class that counts the other way, hit
  points as dice, a speed for each way a creature moves, and Morale, Enc and
  Hoard where OSE writes ML, NA and TT. Read as though it were OSE, its armour
  class lands several points out and looks entirely reasonable on the sheet. It
  now declares its own dialect, and nothing else you import is affected.
- **A source can start from a dialect instead of from scratch.** A publisher's
  whole line usually shares one block shape, so calibrating one of its books can
  begin from that shape and correct it, rather than teaching a label at a time.
- **A wording the reader does not know is reported instead of absorbed.** It
  used to run quietly into the field before it, so a book in an unfamiliar
  dialect looked like it had been read perfectly. Anything that cannot be placed
  is now named, under the word your book actually prints.

### Fixed
- **A saving throw went missing on every import.** ACKS II is renaming two
  saves, and on the current system build the new name has nothing behind it — so
  the blast save was dropped on the way into the document, silently, and
  creatures arrived with four of their five. Saves now go in under the names
  your system actually has, whichever build you are on.
- **Hit dice were rolled on the wrong die.** A block printing "HP 1d4" was given
  a d8, because the die was worked out from the number of hit dice instead of
  read from the page. What the page prints now wins.
- **A creature could be named after the room it stood in.** Names came from the
  nearest heading, which in a keyed adventure is the area and in some bestiaries
  is a line of description — so monsters could arrive called "13. Hallway", or a
  fragment of a sentence. Names now come from the block itself or the label
  beside it, and anything reading like a sentence or an area number is left for
  a person rather than guessed at.
- **One illustration could end up on four different monsters.** Art was matched
  by asking each creature for its nearest picture, so a bestiary page carrying
  one picture gave it to everything on the page. Each picture now belongs to a
  single creature, and creatures the page never illustrated have none.
- **A variable-hit-dice creature lost its attack throw.** "THAC0 By HD (17 [+2]
  to 12 [+7])" read that "HD" as the start of a new field and cut the range away
  from the throw it belonged to.

## 2.11.0

Convert a stat block with no book to point at, and read the ones you have far better.

### Added
- **Convert a stat block by hand.** Some blocks the automatic path cannot take:
  a scanned adventure with no text in it, a block it refused because it could
  not tell two creatures apart, a monster from a forum, or one you invented.
  Paste it and press Read, correct anything it got wrong, and convert — or
  ignore the paste box and just fill the fields in. Each field takes the clause
  the way your own game writes it, and the same reader handles both paths, so
  nothing drifts apart between them.
- **A block the importer would not vouch for is no longer a dead end.** Tick
  "correct by hand" and its text goes to the editor, so everything found on a
  page is reachable whether or not it could be read automatically.
- **Pasted blocks understand every wording you have taught it.** Calibrate one
  adventure to say `HIT DICE` and every block you paste afterwards reads it —
  and the editor tells you which wording was used and which book taught it.

### Improved
- **Far more of what your books print is now understood.** Across a library of
  93 adventures the reader went from 72% to 93% of stat blocks read completely.
  Among the things it now reads: hit dice headed `Hit Dice`, saving throws
  headed `Saves`, the B/X save letters (D R H B S as well as D W P B S), a
  printed `Level`, hit points written as `(hp 4)` or as a list for a group,
  treasure written as a list, movement modes of two words, and experience awards
  in the thousands — which were being cut in half at the comma.
- **A creature that names itself now arrives named.** A block headed
  "Brood-Mother Nightworm:" fills in the name box for you.
- **Prose that merely mentions statistics is no longer mistaken for a stat
  block.** Room text quotes armour classes and hit dice constantly, and those
  paragraphs were being read as creatures.

### Fixed
- **A saving-throw row printed in the other letter set is no longer half-read.**
  A block using B/X's Rays and Hold in place of Wands and Paralysis matched
  three letters of five and quietly produced a creature with three saving
  throws. A row is now taken only when it is complete, and reported when it is
  not.
- **Experience awards of a thousand or more.** `XP 1,250` was read as 1.
- **A group's hit points.** `(hp 4, 6, 7)` lost everything after the first
  figure; all of them are kept now.

## 2.10.0

Your own OSE adventures, converted by ACKS II's own rules.

### Added
- **Import a monster from an Old-School Essentials adventure you own.** Register
  the PDF, pick a page, and the stat blocks on it are found, read and converted
  — armour class, hit dice, attacks, saving throws, movement, morale and
  alignment. B/X, BECMI, Labyrinth Lord and LOTFP read the same way. Your file
  is opened in your browser and nowhere else, and nothing from it is stored
  except the creatures you choose to import. See the new guide, *Importing an
  OSE adventure*.
- **The System Compatibility Guide is now a book you can connect.** It carries
  the arithmetic that converts a foreign stat block, and those numbers are read
  from your own copy rather than shipped with the module. Without it an import
  still works: everything that needs no arithmetic is filled in, armour class
  and attack throw are marked as waiting, and one command fills them in later
  once the guide is connected.
- **A Source tab on every converted creature** (with acks-extras 4.13.0). It
  shows the stat block as printed, each converted field with the rule behind it,
  and every field deliberately left alone. If a number ever looks wrong at the
  table, that tab is where you check it against your book.
- **Books that word things differently can be taught.** Where a publisher heads
  its hit dice `HIT DICE` rather than `HD`, you can say so once and that
  adventure reads it that way. What you teach applies to that book alone.

### Notes
- **Some fields are deliberately never filled in.** Experience, treasure type, a
  single printed saving throw, and a class ACKS II does not have are all left at
  their defaults, because neither rulebook says what they should become. The
  printed value is kept and shown on the Source tab, so you can enter it
  yourself if you want it.
- **Stat blocks from other games are refused rather than converted.** Some
  adventures print two systems side by side; a block with an ascending armour
  class would come out inverted if read as OSE, so it cannot be imported by
  mistake. The same applies where two creatures' blocks could not be told apart.

## 2.9.13

The price list gets a shelf of its own.

### Fixed
- **The items imported from the price list are filed.** All 113 of them landed
  on the Equipment folder itself, loose among the folders that sort the rest of
  the gear — a shelf of subfolders with a hundred-odd items spilled beside it.
  They now sit together under Equipment, on a shelf of their own. Re-run the
  equipment import to file the ones you already have, then delete the strays.

## 2.9.12

Every price the book prints is a price you can pay.

### Fixed
- **A price of a thousand or more is no longer read as its last three digits.**
  A treatise ladder imported at 400, 800, 200 and 600 gold; it is 400, 800,
  1200 and 1600. Superior thieves' tools cost 1600 and imported at 600, a war
  elephant cost 2000 and imported free. Anything under a thousand was always
  right, which is what made this hard to notice: the wrong prices looked like
  ordinary ones.
- **Gear names have their spaces.** The price list imported "Saddle andtack,
  draft" and "craftsman'stools", because the gap between two printed words is
  a position on the page rather than a character in the text. Names now read as
  the page sets them, opening capital included.

### Added
- **Everything the price list sells now imports as something you can buy.**
  113 rows the shop list prices had no item: a candle is sold by what it is
  made of and a saddle by what it is for, and each was imported once, as the
  category, with no price at all — because pricing it would have meant picking
  one of its variants. Every row the book prices is now its own item, costed
  and weighed from your own page. The category keeps its description.

### Known gaps
- Structures, lodging, provisions and barding are priced in tables this release
  does not read, and import without a cost. Coins, trade bars and furs are not
  in the equipment lists at all.

## 2.9.11

A class arrives knowing what it is trained to fight with.

### Added
- **An imported class carries its own weapon, armour and fighting-style
  training.** Every class spread states all three in one paragraph, and that
  paragraph now comes across as an effect on the class document, so a character
  holding the class is read against what the class is actually trained in.
  Until now nothing stated it, and every character answered "proficient with
  everything" and "may wear the heaviest armour there is" — a mage in plate
  drew no comment. Nineteen of the twenty-one classes carry it.
- **The two mandatory styles are not imported, because they are not optional.**
  Every class has them already; the import states only what its own paragraph
  chooses on top.

### Fixed
- **A class whose paragraph cannot be read honestly grants nothing.** Two
  spreads state their training in a form the parse cannot take: one gives it as
  a table of peoples rather than a sentence, and one has its level table sitting
  inside the text, which arrives folded through the sentence a word at a time.
  Both import with no training rather than a half-read one — a character in
  either class reads exactly as it did before this release.

## 2.9.10

What the newest importers create can be removed again.

### Fixed
- **Traps, variations and vehicles can be removed again.** Nothing the three
  newest importers created carried the mark that says this module made it, so
  "Remove ALL imported content" walked straight past all of them and reported
  the world already clean. They are marked now, and removal takes them along
  with everything else. Documents imported by an earlier version carry no mark
  and cannot be reached this way — delete those yourself, because a fresh
  import makes a second copy beside them rather than adopting the first.
- **Removing imports now clears the folders it made, too.** The folders every
  importer creates to sort its work — "ACKS Cookbook" and the book and category
  folders under it — were never marked as this module's, so removal counted
  them and then left every one of them standing. Folders made from here on are
  marked and go with the documents they held. A folder you already had under
  one of those names is adopted rather than claimed, and stays where it is.

### Added
- **Traps, variations and vehicles arrive with Import Everything.** All three
  could previously be reached only by hunting for a macro that did not exist.
  Each has one now in the import folder, and all three sit in the one-click
  chain in dependency order — variations after the gear they attach to.
- **The shield forms import.** Six of them — auxiliary, buckler, crescent,
  heater, kite and phalanx — arrive as differences you drag onto a shield.
  Each records where its protection reaches and what takes it away, which is
  the whole difference between them; how much protection is the shield's own.
  They are a record for now: nothing applies these conditions for you yet.
- **Silver imports.** A weapon commissioned in silver arrives as a difference
  you drag on, priced from your own page. It multiplies the weapon's listed
  price, so a masterwork surcharge added on top is not multiplied along with it.

## 2.9.9

Every vehicle on the page arrives, not most of them.

### Fixed
- **The vehicles that differ only by their team now import too.** Three went
  missing — the two-horse cart, the two-mule cart and the four-horse wagon —
  because each shares its name with a lighter version of itself and the import
  treated the second as already present. The team in the parentheses is the
  whole difference between them, and it is what changes the cargo, so it now
  tells them apart. Nineteen vehicles import where sixteen did.

## 2.9.8

The land vehicles drive off your own page.

### Added
- **Every land vehicle in the equipment chapter imports as a working vehicle.**
  Nineteen of them — carts, wagons, chariots, howdahs and palanquins — arrive
  as vehicle actors with their crew, cargo, armour class and structural hit
  points read from your own table, not as a line item you can only buy.
- **A vehicle's printed pairs become its speed tiers.** The table gives cargo
  and movement as two figures, at normal and at heavy load, so a cart hauling
  its heavier load now arrives already knowing it moves slower for it. That is
  what lets a small palanquin state its berths honestly: one passenger at the
  quick pace, two at the slow one.
- **A howdah rides as passengers, not as crew.** Its cargo figure is printed in
  parentheses because the creature carries people or freight instead, so those
  rows fill the passenger count and leave the pace to the beast.

## 2.9.7

Masterwork comes across from your own page.

### Added
- **The masterwork variations import.** Six differences an item can carry —
  a weapon's attack throw, its damage, both at once, armour lightened, armour
  protecting, and an ornamented finish — arrive as documents you drag onto a
  sword the way you drop a rope into a backpack. The armour two apply to
  shields as well. Every surcharge and every bonus is read from your own book;
  nothing is shipped, and a number that could not be read is left blank rather
  than guessed at. Needs ACKS Extras for the variation item type.
- **The Treasure Tome is a book the importer knows.** Connecting it does not
  unlock anything yet; it is registered so the magic items can follow.

## 2.9.6

The printed traps come across from your own book.

### Added
- **Thirteen traps import with all six of their levels.** The Judge's Journal
  prints each trap at six levels; every one of the thirteen now arrives as a
  single document carrying all six, with each level's printed sentence kept
  whole beside whatever damage could be read out of it. What springs it, which
  save it allows and how far it reaches are left for you to set — a plausible
  guess at a save is worse than a blank one, and the book's own words are there
  to fill it from. Needs ACKS Extras for the trap item type.

### Fixed
- **A chapter tab no longer prints itself into an entry, and 1st keeps its
  st.** The two were told apart by how tall a run of small glyphs stood,
  which had them backwards on some pages: the tab survived as a word of
  gibberish at the end of an entry, while the ordinal was quietly deleted off
  every numbered step. Twelve class-power entries get back the ordinals and
  footnote marks they had been losing.
- **An entry that runs to the foot of the last column continues onto the next
  page.** It used to stop at the page break, so the last entry on a spread
  silently lost whatever it had left to say.
- **The coverage audit stops reporting content it already has.** It never
  looked at thief skills or the shared reference tables, and no renames had been
  recorded, so entries the register holds counted as missing. Proficiencies fall
  from 16 reported gaps to 1.

## 2.9.5

A class knows what it speaks even when its own page will not say.

### Added
- **A class whose page will not parse takes its race's list.** The register
  declares which race a class is an expression of — an elf class is an elf
  class whether or not its spread reads cleanly — and the tongues are
  borrowed from a sibling of the same race whose page did parse. Every name
  still comes off your own book, just from the page that printed it legibly.
  The Elven Spellsword, whose page interleaves its proficiency list through
  the Tongues sentence, now gets the full elven list instead of the human
  default.
- **Bonus languages a class grants are imported as picks.** A Multilingual or
  Linguistics power grants languages of your own choosing rather than named
  ones, so they arrive as open slots: the Venturer and Bard carry three each,
  the By This Axe Rhetor four.

### Fixed
- **The common tongue's name is found again.** Its sentence glues shut in the
  extracted text (`called“Common”`), so the pattern missed it and every human
  class imported with no tongue at all rather than the one it starts with.
## 2.9.4

An entry's description is its own.

### Fixed
- **A description is read from the column its own heading starts.** Sixteen
  entries were scoped to a region their heading does not appear in and
  extracted whatever printed there instead — *Coat*, *Tunic and Pants* and
  *Turban* showed a column of price digits, *Master Gnosis* described dwarven
  tongues, *Evasion* recited a proficiency table. Column detection reads a page
  by where its text runs begin, and a price list beside a definition out-votes
  the definition; each of these pages now states its own columns. The last
  release's known issue is closed by this.
- **A description no longer opens with the tail of its own heading.** An
  ability printed as "Renown (9th level):" is located by the part of its name
  that does not vary, so the level began the description instead — sixty-two
  entries started "9th): ". They now start at their first word.
- **An entry does not end at its own last sentence.** A short closing line
  alone at the foot of a column reads exactly like a section heading, and
  *Turban* lost half its description to one. A heading is not a sentence, so a
  line ending in a full stop no longer ends a block.

Worlds imported before this release still hold the old text — **re-run the
import** to take the correction.

### Changed
- `npm run validate` now fails when a definition's description comes from
  outside its own heading's column, and names the entries. All three defects
  above shipped green; this is the check that would have caught the first.

## 2.9.3

An imported class knows what it speaks.

### Added
- **A class's languages import with it.** A demi-human spread's Tongues trait
  becomes the class's granted list, read whole off your own page — the racial
  tongue, the common one, and the rest. A class without the trait is human:
  it grants the common tongue (its name read from your chargen chapter) and
  leaves one open pick for the homeland language. Works for every book with
  class spreads — the By This Axe classes carry the same trait and import the
  same way.
- **The builder's race documents inherit their classes' tongues**, keyed by
  the trait's own subject, and never overwrite a list you edited yourself.
- One known fallback: the Elven Spellsword's page interleaves its proficiency
  list into the middle of the Tongues sentence, so that one class takes the
  human default (the common tongue plus an open pick) rather than risk
  granting a proficiency as a language. The elf race document still carries
  the full list, read from the Nightblade's page.


## 2.9.2

The imported languages are languages.

### Fixed
- **The taxonomy imports as the system's own `language` type**, not as
  abilities. The system declares that type, files it in its own section of the
  character sheet, and reads it in the Polyglot support it ships — minting
  abilities put all 58 of them outside every bit of that at once. A world that
  already imported them is converted on the next import, and ACKS Extras
  converts one that never imports again.
- **The import finds a language before it builds one.** A tongue the world
  already holds — under its derived id, under a name you typed, or as the
  system compendium's own document — is adopted and stamped rather than laid
  down a second time beside itself. Adopting the system's copy keeps whatever
  description and art it came with.
- The toast counts what was adopted and retyped as well as what was created,
  so a run that changed your world no longer reports doing nothing.
- **The macros pack joins the family folder.** Its folder is declared under the
  same name ACKS Extras uses, so both modules' compendiums land in one
  "ACKS II" folder instead of one folder each.

### Changed
- **The coverage section is a measurement, not a claim.** Everything the
  cookbook can materialize was imported against six books — 1,307 documents —
  and every system and module pack compared document by document. Languages is
  the only pack that came back complete, which is why ACKS Extras now hides
  it. The rest are recorded with their real shortfalls: 43 named equipment
  entries, the twelve thief-skill powers the register models as class ladders,
  the class training grants with no counterpart here, and three henchmen
  mechanics the abilities model cannot yet state. The monster legs are marked
  unverified rather than counted.
- **The IP scanner tells a locator from a quotation.** A `cite` value that is
  nothing but a citation says where to look in your own copy and reproduces
  nothing; a citation with prose attached is a pointer to the sentence it came
  from. Keying on that shape took a first report of 1,262 leaks down to the
  nine that were real — all `note` fields, all now carrying their mechanical
  fact without the page reference beside it.

## 2.9.1

The 2.9.0 language import works now.

### Fixed
- **The languages recipe never ran.** The import resolves a recipe's book from
  the table entry, and the languages table carried its book only in the
  doc-level source line — so the whole recipe was silently filed under a
  missing book. Its binding also matched a doc id the import never reports,
  and its page hint spelled a field the page-finder does not read. All three
  found on the first live import; fixed and live-verified end to end (58
  languages, twice, the second run creating nothing).
- **Languages filed in the world root.** The binding minted `def.lang.*` ids,
  which the shelf lookup cannot key — the exact failure the id ruling had
  already named — and created the items with no folder. Ids are
  `def.language.*` now and creation goes through the same shelf machinery as
  every other imported ability, so languages land under **Languages**.
- The 2.9.0 gallery gains the languages-import shot, taken in the live session
  that verified the fix.

## 2.9.0

The language taxonomy is read from your own book instead of shipped in this
module.

### Added
- **Languages import from the Revised Rulebook you own.** A recipe carries a
  page, the section heading, two column bands and an indent step — the depth of
  a printed cell is its place in the family tree — and the languages themselves
  are extracted from your copy at import time and made into ability items. What
  the tree contains, and which tongue descends from which, stays in the book.

### Fixed
- **A list of names was shipping in the register.** Fifty-eight entries carried
  a language name in the id, again in the name field, and a third time as the
  anchor, because a language has no mechanic for an anchor to find — the entry
  was the name and nothing else. That is not a way of locating content, it is
  the content, and no value read off a page ships in this family. Removed, and
  replaced by the recipe above.
- **Neither IP gate could see it.** `ip-scan` caps how long a shipped string may
  be and hunts for prose; the register lint caps a label at sixty characters.
  Neither counts how many short proper nouns a kind ships, so a taxonomy
  authored one cell per entry passed both. `audit-transcription` now fails a
  kind that ships a catalogue of name-only entries — but only where the kind's
  own fields extract nothing else, which is what separates a language from a
  power, whose entries carry a bare anchor apiece and keep their instructions
  in the kind.

## 2.8.0

A race's powers reach the rungs that grant them. The books name a power one way
in a class or race spread and another way where it is defined, and the import
had only exact names to work with — so a dwarf arrived with "Hardy" written in
a note and no power attached.

### Fixed
- **Racial powers resolve by the name their spread prints.** A power the world
  does not already hold now goes through the source register, which records
  the printed name beside the definition it means: "Hardy" reaches Hardy
  People, and a dwarf's and an elf's Tongues both reach Gift of Tongues —
  a name no definition carries, so nothing could ever have matched it. A rung
  keeps pointing at the definition even when that power has not been imported
  yet, and lights up when it is. A name several definitions answer to (nine
  classes print a "Renown" of their own) still resolves to nothing rather than
  to a guess, and stays in the rung's note where a Judge can see it.
- **The power-source register was compiled under no name at all.** It was the
  one reference register that never declared its `registry`, so it landed in
  the compiled cookbook keyed as "undefined" — unreadable by anything, and
  liable to be overwritten by the next register that made the same omission.
  The lint now requires every register to name itself, and to match its own
  filename, so a second one cannot go missing the same way.

## 2.7.1

### Fixed
- A name expectation that throws during import now fails that entry instead
  of counting as a pass.
- A failed compendium index read during bulk import warns with its
  consequence named (re-created imports) instead of silently reading as
  "nothing imported yet".

## 2.7.0

The item-market tables: five new ruledata recipes read the market grids from
the GM's own books for the acks-extras markets feature.

### Added
- **Five market table recipes** — Equipment Availability by Market Class
  (RR), the 29-type Common and Precious Merchandise grid (RR), Market
  Characteristics (RR: tolls, baselines, consignments, passengers), the
  Magic Item Transaction grid (JJ), and Wage and Construction Rates (RR).
  All import through the existing table pipeline and land in the world
  registry the markets feature reads.
- The gridRows extractor learned cost-band labels parsed from the page,
  leading columns ahead of a market grid, and a small-gap merge for the
  face that splits a cell’s first glyph into its own run.


## 2.6.3

### Added
- **Two custom powers the importer never knew about.** *Fool's Luck* and
  *Luck's Boon* — both the Fool's — print their headings in a typeface the
  harvest was not looking for, so they were absent from the cookbook entirely.
  Checked the other way round as well: of the 249 custom powers the Judges
  Journal marks with a class list, these two were the only ones missing.

### Fixed
- **A class power describes itself and then stops.** *Ageless* ran on through a
  code of behavior, a list of strictures and a table of templates — a whole
  class's remaining pages under one power's name — and it was not alone. An
  entry ended only at the next entry of its own kind, so anything printed
  between the two came along: a witch tradition recited every additional power
  the class gets, an earthforger's sigil recited the traits of dwarves, a flask
  of refined oil recited a weapon table. A section heading now ends an entry,
  whatever kind of heading it is, and an entry that has already ended no longer
  goes looking for its continuation in the next column and the page after it.
  Thirty-four entries stop where their own text stops; *Ageless* went from
  1946 characters to 285, and three witch traditions from 5012 to 915.

  The last release's known issue is closed by this. Worlds that imported these
  powers still hold the longer text — **run "Update Abilities in World"** to
  take the correction, which keeps any description you have written in yourself.
- **An entry ends at the next entry even when the book changes typeface for
  it.** One printed style can reach the reader as several different fonts, and
  a heading was only recognised in the same font as the entry that opened the
  block. So *Firewood* described itself and then described refined oil, the
  entry printed beneath it in a font one shade different.

### Known
- Twenty-three entries have prose boxes that do not contain their own heading,
  because column detection misreads a page whose layout is dominated by a
  table — *Coat*, *Tunic and Pants* and *Turban* show price digits instead of
  their descriptions. Correcting it means overruling detected columns rather
  than adding to them, and the obvious repair truncated other entries in
  testing. See `ROADMAP.md`.

## 2.6.2

### Fixed
- **The description you wrote on an imported ability is yours to keep.**
  "Update Abilities in World" rebuilds every ability this module imported. It
  already asked before touching an item it had merely adopted by name, but an
  item it created itself was rewritten whole — so a Judge who imported an
  ability and then typed a ruling, a house note or a page reference into its
  description lost those words on the next update, silently. The update now
  holds back the description alone on any ability whose text has been added to,
  writes everything else, and says how many it kept. The mechanics are still
  repaired; only your prose is left standing.
- **An entry ends where its section ends.** A definition that runs past the
  bottom of its column continues in the next one, and that continuation stopped
  only at the next entry of the same kind — so it read straight through
  anything else in its way. Refined oil described itself and then recited a
  weapon table and the entry for an earthshooter; a dwarven whistle recited the
  price of firewood and alchemical fuel; an earthforger's sigil went on into the
  traits of dwarves in general. Fifteen entries stop at their own section now.
- **What is left after a price is lifted out is not a piece of gear.** A
  template paying "a further 20gp of equipment of the character's choosing" put
  an item named *a further* in the character's inventory, because the coin was
  taken out of the sentence and the words in front of it stayed behind.

### Known
- Entries whose next section begins with a **bold heading at body size** still
  read on past their end — *Longeval*, and the four powers that share its text,
  continue into a code of behaviour and a template table. *(Closed in 2.6.3.)*

## 2.6.1

### Fixed
- **A power is read from the book its rules text prints in.** Thirty-one class
  powers that the Judges Journal lists by name — *Ageless*, *Alien Senses*,
  *Battle Plan*, *Scion of Kings* and the rest — print their actual rules under
  another name in the Revised Rulebook. Their recipes pointed at the right
  passage but kept asking the Judges Journal for it, so the page coordinates
  landed wherever those rectangles happened to fall in the wrong book: *Ageless*
  described itself with a poison table and the general proficiency-throw rules,
  broken off mid-word and mangled in its spacing. Each of these powers now opens
  the book its text is printed in — the book its citation already named — and
  shows the rules it is actually describing.

  Two consequences worth knowing. These powers now want the **Revised Rulebook**
  connected rather than the Judges Journal, so a seat holding only the Judges
  Journal sees no text where it used to see the wrong text. And a world that
  already imported them holds effects scanned out of that wrong text — **run
  "Update Abilities in World" to repair them.** That rewrite replaces the
  description of every ability this module imported, so anything a Judge typed
  into one of those descriptions is replaced along with it.

### Changed
- The build refuses a recipe whose page coordinates belong to a book other than
  the one it reads, and reports how many powers follow their text across a book
  boundary.

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
