# Live-test recipes

The canonical procedure is `.claude/rules/live-testing.md` — read it first.
This file records only what is specific to this repo: the fixtures each surface
needs, the steps that exercise it, and the observable that proves each one.

`validate` and `npm test` here run against mocked globals and against page
geometry with no Foundry at all. They gate the arithmetic; only a live run
gates that anything reaches a document.

## The Books window

### Fixtures

- Two or more ACKS II PDFs **the tester owns**, placed together in one folder
  along with at least one unrelated PDF (the unrelated file is part of the
  check — it must be left alone).
- A seat whose remembered locations can be emptied: use the window's own
  "Forget books on this computer…" first, so the walk starts blank.
- For the shelf: an empty `acks-importer-books/` under the Foundry data
  directory. Create it, use it, delete it — it is a fixture like any other.

### Steps

1. Open "Your ACKS Books (this seat)" with nothing connected.
   *Observable:* ONE window, four bands. The walkthrough band is open (this
   seat has nothing), the server band says nothing is staged, and every book
   renders a row under "Not connected" with its would-unlock scope. There is no
   `<select>` anywhere in it — `root.querySelector("select")` is null. The
   refresh-bridge line renders in the footer, the per-book detail in the
   console.
2. "Connect a folder…" → the fixture folder.
   *Observable:* every ACKS book in the folder connects in one trip; the
   unrelated PDF is named on the console only, never warned about; sheet prose
   renders. Rows move to the "Open this session" group.
3. **Add to server** on an open book's row.
   *Observable:* the row says it is uploading, then the book appears in the
   server band; `Data/acks-importer-books/` holds the PDF as `<bookId>.pdf`;
   the world setting `game.settings.get("acks-importer","shelf")` names it.
   Press it a second time for the same book (re-open the window): the name is
   already taken on the server, and the copy up there is read and staged
   instead of a second upload being attempted — Foundry refuses to overwrite a
   non-media file, so an upload here fails the whole request.
3b. **Add to server** on a book that is NOT open and NOT staged, and the shelf
   band's own picker with several files at once.
   *Observable:* the row carries the control at all — this is the case that had
   none. The file is read and identified BEFORE anything is uploaded, so
   handing a row the wrong book's PDF is refused with nothing on the server;
   the bulk picker stages everything it can name and lists the files that named
   no book. Both leave the row reading "Read from the server on every launch".
4. **Shut the world down and relaunch it.** This is the check the whole shelf
   exists for and a page reload does not substitute for it.
   *Observable:* the staged book is open at `ready` with NO gesture, no picker
   and no window prompting for it; its row reads "from the server".
5. Copy a second PDF into `acks-importer-books/` by hand, then "Scan the
   folder".
   *Observable:* it is identified by name, opened to confirm it is that book,
   and staged. A PDF that is no book this module reads is counted, not staged.
   Rename a book's file to another book's name and re-scan to prove the
   verification: it must refuse rather than stage the wrong book.
6. Reload past the bridge window (or set the bridge to 0), then **Reconnect
   all**.
   *Observable:* one permission click on the remembered folder reopens every
   book in it; anything the folder cannot answer for is NAMED in the status
   line as still needing its own button. Shelved books never appear in that
   list at all.
7. `acksImporter.connectBook()` and `acksImporter.bookStatus()` from the
   console.
   *Observable:* both front the SAME window (singleton — a second call fronts
   it, never stacks a twin). This is what keeps macros already imported into
   worlds working after four macros became one.
8. Non-FSA fallback: repeat step 2 on an insecure origin or Firefox seat.
   *Observable:* the folder control is a directory input, per-book rows are
   file inputs rather than pick buttons, and books are remembered by NAME.
9. Join as the **Player** seat.
   *Observable:* the window does not auto-open; opening it by macro shows the
   server band read-only, with no Add/Remove/Scan controls.

### Driving the pickers

No automation opens a native file dialog, so the two picking routes are driven
differently. An `<input type="file">` accepts a FileList built in page context —
`const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;`
then dispatch a bubbling `change` — which drives the shelf band's own picker
end to end, real handler and all. The FSA branch (a row's **Add to server**
button, which calls `showOpenFilePicker`) cannot be driven at all; exercise
`acksImporter.stageBook(bookId, file)` instead, which is the function the
handler calls, and say so in the report. Files themselves come from the data
directory over HTTP: `new File([await (await fetch(path)).blob()], name)`.

To test a FRESH upload where the shelf already holds every book, move one file
aside on disk (`mv wld1.pdf wld1.pdf.aside`), stage it, then delete what the
upload wrote and move the original back — the uploaded copy must be
byte-identical, so `md5sum` is the check.

### Teardown

"Forget books on this computer…" and confirm; the rows return to absent. Then
remove each shelved book from the server band, delete
`Data/acks-importer-books/` and its contents, and clear the setting —
`game.settings.set("acks-importer","shelf",{})`. Confirm the window shows
nothing staged.

## Remove ALL Imports sweeps materialized rules tables

Import rules tables ("Import Rules Tables (GM)", then "Create Foundry Tables
from Rules Import (GM)"), confirm the sidebar holds "ACKS Imported Tables"
with per-doc subfolders and readable names, then run "Remove ALL Imports
(GM)". *Observable:* the confirm counts the materialized rules-table
documents; afterwards the folder tree, its RollTables, and the "ACKS Ruledata
(Imported)" journal are all gone, while the imported table DATA still answers
(the ruledata browser still lists tables, and re-running Create Foundry
Tables rebuilds the documents without re-importing).

## The library: compendium target and the two-level tree

The go-live gate for 3.0.0. Nothing offline can see a pack, so every claim here
needs a real one.

### Fixtures

A world that has imported nothing (or one reset with "Remove ALL Imports (GM)"
first), one connected book, and the **Player** seat for the ownership half.

### Steps

1. Import anything — one monster is enough.
   *Observable:* no new folder appears in the Actors sidebar. `game.packs` gains
   "ACKS Cookbook — Actor"; the actor is inside it, filed `<book> / <group>`.
   `game.actors.size` is unchanged.
2. Import abilities, equipment, weapons, armour, the price list and classes.
   *Observable:* every document is in "ACKS Cookbook — Item". Nothing sits loose
   at the pack's top level —
   `pack.folders.filter(f => !f.folder).flatMap(f => f.contents).length` accounts
   for none of them and `pack.index.filter(r => !r.folder).length` is 0. No
   folder is more than two deep:
   `[...pack.folders].every(f => (f.ancestors?.length ?? 0) < 2)`.
3. Check the namespaces that used to fall through: priced rows are under
   `Equipment / Price List`, races under `Races`, vehicles under
   `<book> / Vehicles` in the Actor pack, and **no** item has a
   `def.constant.*` cookbook id anywhere.
4. Run the vehicle import a second time.
   *Observable:* it reports every row as already present and
   `pack.index.size` does not change. (This is the check that was failing: the
   dedup asked the Item library about Actors.)
5. Right-click "ACKS Cookbook — Item" → **Configure Ownership**, set Player to
   Observer. Join as the Player seat.
   *Observable:* the pack opens and its documents are readable, from ONE
   setting. No per-folder dialog was involved.
6. Build class template packages, then open a class.
   *Observable:* bundles and gear are in the SIDEBAR under
   `Class Templates / <Class>` — they are world documents on purpose — and the
   class sheet lists them. This is the acks-extras library reader working: a
   blank list here means it is reading `game.items` somewhere.
7. Open an imported template actor and press Generate.
   *Observable:* the new creature is in a top-level **Generated** folder in the
   Actors sidebar, not in the pack and not beside the template.

### Teardown

"Remove ALL Imports (GM)". *Observable:* the confirm counts the packs' contents
AND the class-template documents; afterwards `game.packs` holds no
"ACKS Cookbook — …" pack, and no orphan is left in the sidebar —
`game.items.filter(i => i.flags?.["acks-extras"]?.templatePart).length` is 0.

## Recipes, audited without importing

`acksImporter.cookbookAudit()` answers "does this recipe still match the
printing?" with no documents written, so it is the cheapest check in the repo
and the first one to run when an import looks wrong.

*Observable:* with the core books connected,
`cookbookAudit({ books: ["rr","jj"] })` returns `ok: 720, noMatch: 0, threw: 0`
in about five seconds, and `{ books: ["mm"] }` returns `ok: 291` in about ten.
A `noMatch` names a recipe whose page moved; `misses` names a register token a
recipe read but could not place. Art is skipped unless you pass `{art: true}` —
with it, a single Monstrous Manual creature can take fifteen seconds.

`acksImporter.lastAudit()` reads a running pass, which is how a long one is
watched rather than waited on blindly.

## Import cost, and the shapes that used to be slow

Worth re-measuring whenever the import feels slow again, because every one of
these was misdiagnosed once.

1. Time a bulk step on a cold library: `cookbookImportAbilities()`.
   *Observable:* seconds, not minutes. It writes in batches; a regression to
   one-write-per-document shows up as a step that gets slower the longer it runs.
2. Compare a create into a small pack against a large one.
   *Observable:* a write costs what the target ALREADY HOLDS — ~35ms into a
   19-document pack, ~950ms into a 1,039-document one — and twenty-five in one
   `createDocuments` call cost about what one costs. That is the whole reason
   for batching, and it is why a slow import gets slower.
3. Import a creature whose art is already in `acks-importer-art/`.
   *Observable:* a few hundred milliseconds, WITH its illustration applied. The
   page walk that chooses an image is skipped when the image already exists;
   if the art stops appearing, the gate moved back onto the op's result instead
   of the recipe's own art field.

## Nothing is imported twice

The dedup rules, each with a case that used to break it.

- **Repeat any step.** Run `cookbookImportAbilities()` twice.
  *Observable:* the second run reports everything already present and takes
  a fraction of the first — ~190ms against ~9s — and the pack's document count
  is unchanged.
- **Out of order, and repeated.** Run templates before abilities, then abilities,
  then templates again.
  *Observable:* the end state matches the canonical order. Fingerprint the pack
  (document count, unique cookbook ids, duplicate count) before and after; the
  duplicate count is 0 either way. This is the check that caught two
  `def.race.dwarf` and two `def.race.elf`.
- **One thing printed two ways.** After a full equipment import, search the
  library for "oil".
  *Observable:* `Military Oil` (Weapons) and `Common Oil` (Adventuring Gear)
  exist; `Oil, Military (1 pint)` and `Oil, Common (1 pint)` do NOT — the price
  list recognised them. `Oil, Olive (1 pint)` DOES, because nothing else in the
  library is olive oil. Both halves matter: the check must dedup what is
  duplicated and keep what is not.
- **Completeness.** Fold every library document's name through
  `acksExtras.lib.vocab.nameKeys` and look for two documents sharing a key.
  *Observable:* the only collisions are entries the shipped cookbook itself
  duplicates (see ROADMAP) and paren-variants that are genuinely different
  products — "Candle (tallow, 1 lb)" and "Candle (wax, 1 lb)" are two things and
  must both survive.

## Three controls, and one shelf at a time

*Observable:* the "ACKS Importer — Macros" compendium holds FOUR macros in two
folders — your books, import everything, reimport one shelf, delete everything.
A fifth is a regression.

Reimport one shelf, e.g. Weapons:
*Observable:* the confirm names the count; afterwards the shelf holds exactly
what it held before and the pack's total is unchanged (38 removed, 38 written,
1,008 either side). Nothing on another shelf is touched, and a class template's
documents are never among the deleted — they carry acks-extras' stamp.

## Two books, one item

With BOTH the Revised Rulebook and By This Axe connected, import equipment.

*Observable:* ONE "Boots", one "Cloak", one "Journal", one "Manacles", one
"Whistle", one "Laborer's Tools" — the Rulebook's copy, carrying the By This Axe
id in `flags["acks-importer"].cookbook.merged`. A regional version with the same
stats is a variant, not a second base item.

Where two entries genuinely differ, both are kept and BOTH are tagged —
`Boots (RR)` / `Boots (BTA)` — each keeping its printed name in
`cookbook.printed`. That last part is what makes it stable: tagging rewrites the
name, and a rewritten name would never collide again, so a pair tagged by an
older build could never be reconsidered.

*Observable, and the reason the register was fixed:* dwarven belts, boots, caps,
cloaks, coats, turbans and tunics file under `Equipment / Clothing`, not
Adventuring Gear, and the war and guard bears are `acks-extras.animal` ACTORS.
They were all authored `group: "gear"`, which is what stopped Boots merging.

## Class template packages

The recipe lives with the surface's owner: acks-extras
`docs/classes/TESTING.md` § Template packages. This repo's own observables
inside that recipe: `importTemplatePackages()` (macro "Build Class Template
Packages (GM)", Getting Started step after classes) materializes with NO book
connected; bundles and gear land in the SIDEBAR under `Class Templates /
<Class>` and tables under `Class Templates` (world documents by design — a
package exists to be repaired, and imports live in a pack); and after
`cookbookUpdateClasses()` the rows' bundle links are re-derived and a
Judge-edited document shows up in the skipped count rather than being
rewritten.

### Auditing what a cell actually became

`tools/dev-template-cells.mjs` reads every class's Starting Equipment cell
through the SHIPPING executor and runs the shipping splitter over it, against a
menu built the way a real import builds one — the equipment cookbook plus the
weapon, armour and priced grids materialized from the same book. It needs the
local reference library and never runs in CI.

```
node tools/dev-template-cells.mjs               # every cell, item by item
node tools/dev-template-cells.mjs --unresolved  # only cells with a descriptor that matched nothing
node tools/dev-template-cells.mjs --pairs       # every distinct descriptor, grouped by what it matched
node tools/dev-template-cells.mjs --menu sack   # what does the book actually CALL this?
```

**`--pairs` is the one that finds real bugs, and the unresolved list is not.**
A descriptor that matches nothing is visible on the character sheet as an item
with no mechanics; a descriptor that matches the WRONG row looks perfectly
fine and is what ships a carpentry hammer as a warhammer. Read the groups: a
mismatch shows up as one catalogue row quietly collecting descriptors that have
nothing to do with it. Auditing 623 of them by eye is how the wax candle filed
under tallow, the two-handed sword filed as a sword, and the silver dagger filed
as a dagger were each found.

Before ruling anything unresolvable, ask `--menu` what the book calls it: most
of what looks unmatchable is a name the price list writes head-first
("Rations, Iron"), and that is a rule, not an exception. What genuinely cannot
be reached by rule goes in `register/_refs/equipmentPhrase.json`.

## Imported text is in the document, not resolved at render

The change that retired the `@PdfText` enricher. Everything here is about what a
document CONTAINS after import, so every check is worth more from a seat that
cannot read the book than from the one that imported it.

### Fixtures

1. A folder to import into, and one connected book (`mm` reaches the most
   shapes). Both go at the end.

### Steps

2. Import one monster. On the Description tab, confirm the block's own
   paragraphs are there, routed to their fields (appearance, combat, ecology…),
   and that the book and page appear ONCE, at the end of the last field that got
   text — not on every field, and not missing.
3. `api.forgetBooks()`, reload, and open the same actor. The text must be
   unchanged and complete. This is the whole feature: a seat with no book open
   reads everything.
4. **Join as a player** (a real seat, per the shared rule) and open the actor.
   The player owns no book and has connected nothing; they must read the same
   text. A stub, a tag, or an empty field here is the bug.
5. Search the actor's HTML for `@PdfText`. Zero hits — including the journal
   pages, roll tables, traps, equipment and class items an "Import Everything"
   run produces.
6. Confirm the text is ESCAPED, not parsed: import an entry whose page prints a
   `<` or `&` (a formula or a "&" in a name) and confirm the character shows as
   itself rather than vanishing into markup.
7. **A Judge's own writing survives.** Edit an imported ability's description by
   hand, then run *Update abilities*. The edited one keeps its prose and takes
   the mechanics; an untouched one is rewritten. Reversing that pair is the
   failure this stamp exists to prevent.
8. **The accepted cost, verified deliberately.** Hand-set a document's
   description to `<p>@PdfText[mm.ghoul]{MM p.112}</p>` — the pre-upgrade shape —
   and confirm it renders as that literal string, with no enricher left to hide
   it, and that *Remove ALL Imports* + a fresh import replaces it with real text.
   A world upgraded from an older build looks like this until it is re-imported,
   and the report should say so rather than implying otherwise.

### Teardown

9. Delete the folder and everything created, and the hand-made fixture from
   step 8.

## OSE import

### Fixtures

- An OSE or B-X adventure PDF **the tester owns**. Nothing in this repo ships
  one, and no path to one belongs in a commit.
- The ACKS II System Compatibility Guide, for the second half of the run.
- Actors created by the test are deleted at the end. Nothing existing is
  edited — a converted actor is disposable by construction, which is why the
  recipe creates rather than mutates.

### Offline first

```bash
npm run validate
```

Must report `ose-statline: OK`, `ose-convert: OK`, `ose-blocks: OK`, and
`cookbook drift: none`. The drift line is what proves the committed
`cookbook/constants.json` still matches what `register/scg/` compiles to.

### The constants, before anything else

This is the highest-risk step, because box geometry is per-printing and cannot
be checked without the book.

1. Connect the Compatibility Guide. It should fingerprint as 12 pages; its
   metadata title carries the publisher's own spelling ("Compatability"), which
   is why the registry matches on the stem.
2. Confirm all four constants resolve. In the console:
   `await readScgConstants(doc, cookbook, registers)` returns four integers, and
   returns **null** against any other book — the anchors refusing, which is the
   behaviour that matters.
3. If any constant returns null against the guide itself, the printing has
   moved and `tools/harvest-scg-constants.mjs` must be re-run against it. Do not
   widen the boxes to make it pass.

### Stage A — import without the guide

4. Disconnect the guide. Register the adventure with `api.oseRegister()`:
   give it a name of your own (the file's metadata title is not trusted), and a
   lineage. Register the same file twice and confirm it is recognised and
   reopened rather than duplicated.
5. Pick a page with stat blocks. Confirm the candidates the locator offers
   match the blocks you can see — **count them against the page**. A page whose
   blocks sit beside prose in the facing column is the case worth checking.
6. Import one. Then open it and verify:
   - hit points, saving throws, movement, alignment and morale are filled;
   - **armour class and attack throw are NOT**, and both appear as gaps reading
     "needs the System Compatibility Guide";
   - the Source tab exists, shows the block as printed, and carries the
     unconverted warning.
7. Open a hand-built monster and confirm it has **no** Source tab.

### Morale, specifically

8. Import blocks with three different morale scores and read the actor's
   `system.details.morale`. A book's ML 7 must read −1 and its ML 12 must read
   +4 — and a middling ML 9 must read +1. If everything above the midpoint
   reads +4, a clamp is firing and the mapping is not being applied.

### Stage B — connect the guide

9. Reconnect the guide and run `api.oseConvertAll()`. It must report the
   number of actors updated.
10. Re-open the actor from step 6: armour class and attack throw are now filled,
    the unconverted warning is gone, and the Source tab's route column cites the
    guide for exactly those two axes.
11. Run `api.oseConvertAll()` a second time. It must report **0**. The
    no-op is asserted offline too (`test-ose-convert.mjs`), because the bulk
    pass's own filter used to be the only thing making it true.

### What must be refused

12. Point `api.oseImport()` at a page of blocks from a different game (one
    sample book prints two systems' stat blocks in one volume). Their
    checkboxes must be **disabled**, with the reason shown. Confirm the import
    button cannot reach them — a foreign ascending armour class read as
    descending inverts, which is the failure this check exists for.
13. Find a page where a narrow block sits inside a prose column. Its candidate
    must be marked as possibly two blocks, and also be untickable.

### Calibration

14. Find a page whose labels the canonical grammar does not know (one sample
    book heads its hit dice differently). The review dialog must say so. Run
    `api.oseCalibrate(sourceId, page)`, map the word, and confirm the blocks
    now read. Then open a DIFFERENT registered adventure and confirm it did
    **not** learn that spelling — the whole point of a per-source profile.

### Converting by hand

16. Run `api.oseManual()`. Paste a stat block into the box and press **Read
    it** — the fields must fill with the clauses as written (`SV` holding the
    whole five-letter row, not a parsed shape). Correct one clause, press
    **Convert**, and confirm the CORRECTED value is what the preview shows and
    what the created actor carries. An edit that survives the preview but not
    the document is the exact fault this surface was split to prevent.
17. Clear the paste box, fill two or three fields in by hand, and convert. The
    creature must be created with no source, no page, and `origin: "hand"` in
    its provenance; its Source tab must read "Entered by hand".
18. Calibrate an adventure to a wording the canonical grammar lacks (step 14),
    then paste a block using that wording into `oseManual()`. It must be
    understood, and the editor must say which spelling was used and which book
    taught it. This is the accumulating half — a book calibrated once makes
    every later paste better.
19. Paste something that is not a stat block. It must say so and change nothing.

### Teardown

20. Delete every actor created, and remove the registered source. Report which
    of the steps above were reached and which were not — a surface that could
    not be exercised is named, not omitted.

## Authored OSE books

Eleven third-party books ship a cookbook of creature boxes. The path is
`importOseBook(bookId)` — no registration, no calibration, no block picking.
Requires the book's own PDF connected this session; the fingerprints are page
count plus metadata title, and two Quick Delves share a page count, so a title
is what separates them.

### Fixtures

1. A folder to import into, created for the test and deleted after. Never import
   an authored book into the world root — 340 actors are hard to find again.

### Steps

2. `game.modules.get("acks-importer").api.authoredOseBooks()` lists the shipped
   books with their creature counts and whether each is open this session. A
   book whose PDF is not connected must report `open: false` and must not be
   importable — check the refusal, not just the list.
3. Import a SMALL book first (`qd1`, six creatures). Confirm: actors created
   with the cookbook's names, a Source tab on each, and a biography holding the
   block's own text with the book and page as its closing line.
4. **Check a name against the page.** The harvester's names are gated but not
   proofread; an actor named after a room or a sentence is the failure that gate
   exists to prevent, and it is visible only here.
5. **Check an illustration against the page.** Each picture goes to the block
   nearest it, so a creature the page never illustrated correctly has none. What
   must NOT appear is one picture on several unrelated creatures.
6. Import `dmb` and verify the DIALECT end to end. A Dolmenwood block prints
   its armour class ascending and alone, so the sheet must show an armour class
   that IMPROVES with the printed number — the same figure read as OSE lands
   several points the other way and looks entirely plausible. Confirm against
   the page for at least one creature, and confirm `flags["acks-importer"].ose`
   records `lineage: "dolmenwood"`.
7. **Run the same import a second time.** Nothing may be created, and it must
   be FAST: the presence check is taken before the page is read, so a book
   already imported costs an index lookup per entry, not a re-read. Measured on
   the full library, 643 documents in 41s becomes 0 in 1s. A second run that
   takes as long as the first means the check moved behind the read.
8. **Delete what was imported and import it again.** The claim is keyed by
   identity, and a claim that answers for deleted documents is the failure this
   step exists to catch — everything must come back.
9. `api.oseImportAuthored()` — the step "import everything" runs. It walks every
   authored book the seat has OPEN and is silent about the rest: a Judge who
   owns three of the eleven must not be told about the other eight. Confirm the
   documents carry one id each — no two share
   `flags["acks-importer"].cookbook.id` — and that a book printing several
   creatures on one page (`dmb`) produced one document per creature.

   Driving it: fire it without awaiting and poll a global, because reading a
   library of PDFs pins the renderer's main thread and an awaited eval times
   out. `art: false` keeps a test run from writing hundreds of extracted
   illustrations into the data directory, which nothing deletes afterwards.

### Teardown

10. Delete the folders and every actor in them. Report which books were
   exercised and which were not reached.

## Keyed areas as places

117 numbered rooms across Quick Delves 1-3 and Planar Compass 1-3 import as
`acks-extras.location` actors. Requires the adventure's own PDF connected.

### Fixtures

1. A folder to import into, created for the test and deleted after.

### Steps

2. `api.oseImportAreas("qd1", { folderId })`. Expect **17 rooms plus one
   location for the adventure** — the count matters, because the failure this
   path had was silent: an entry that compiled cleanly and refused at import,
   leaving a book that looked authored and produced nothing.
3. Confirm every room's `system.parentUuid` is the adventure's uuid. Nesting is
   the reason this binds to an actor rather than a journal page; unparented
   rooms are the feature not working, not a cosmetic difference.
4. Open a room and confirm its notes hold the printed text — description AND
   the roster line beneath it ("5 skeletons: Stats on p7, hp 3, 6, 7, 7, 8"),
   closing on the book and page. The words must arrive from the reader's copy,
   never from the cookbook.
5. Check one room's name against the page. The number leads ("2. Statue Hall")
   so the rooms sort as the map is keyed; a title that wrapped onto a second
   line must be whole, not cut at the wrap.
6. Import a book that ships none (`wld1`) and confirm it says so rather than
   inventing rooms.
7. Import the areas twice. The second run must create nothing — neither rooms
   NOR a second adventure beside the first, which is what a book-level id
   (`<book>.adventure`) is for.

### Teardown

7. Delete the folder and every actor in it. Filter what you delete by
   `flags["acks-importer"].ose` — a parallel session's fixtures live in the same
   world, and deleting theirs is the mistake this line exists to prevent.
