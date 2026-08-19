# Live-test recipes

The canonical procedure is `.claude/rules/live-testing.md` — read it first.
This file records only what is specific to this repo: the fixtures each surface
needs, the steps that exercise it, and the observable that proves each one.

`validate` and `npm test` here run against mocked globals and against page
geometry with no Foundry at all. They gate the arithmetic; only a live run
gates that anything reaches a document.

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

### Teardown

15. Delete every actor created, and remove the registered source. Report which
    of the steps above were reached and which were not — a surface that could
    not be exercised is named, not omitted.
