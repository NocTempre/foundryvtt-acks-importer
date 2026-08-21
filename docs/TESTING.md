# Live-test recipes

The canonical procedure is `.claude/rules/live-testing.md` — read it first.
This file records only what is specific to this repo: the fixtures each surface
needs, the steps that exercise it, and the observable that proves each one.

`validate` and `npm test` here run against mocked globals and against page
geometry with no Foundry at all. They gate the arithmetic; only a live run
gates that anything reaches a document.

## The Books window (the shelf, the group controls, the rows)

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
   server band; `Data/acks-importer-books/` holds the PDF; the world setting
   `game.settings.get("acks-importer","shelf")` names it.
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

## Class template packages

The recipe lives with the surface's owner: acks-extras
`docs/classes/TESTING.md` § Template packages. This repo's own observables
inside that recipe: `importTemplatePackages()` (macro "Build Class Template
Packages (GM)", Getting Started step after classes) materializes with NO book
connected; bundles and gear land under `ACKS Cookbook / Classes / Templates /
<Class>` and tables under `ACKS Cookbook / Class Templates`; and after
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
   with the cookbook's names, a Source tab on each, and `@PdfText` biography
   resolving against the reader's own copy.
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
7. Re-import the same book into a second folder and confirm the first set is
   untouched — the path creates, it never updates in place.

### Teardown

8. Delete the folders and every actor in them. Report which books were
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
4. Open a room and confirm its notes resolve to the printed text — description
   AND the roster line beneath it ("5 skeletons: Stats on p7, hp 3, 6, 7, 7,
   8"). The words must arrive from the reader's copy, never from the cookbook.
5. Check one room's name against the page. The number leads ("2. Statue Hall")
   so the rooms sort as the map is keyed; a title that wrapped onto a second
   line must be whole, not cut at the wrap.
6. Import a book that ships none (`wld1`) and confirm it says so rather than
   inventing rooms.

### Teardown

7. Delete the folder and every actor in it. Filter what you delete by
   `flags["acks-importer"].ose` — a parallel session's fixtures live in the same
   world, and deleting theirs is the mistake this line exists to prevent.
