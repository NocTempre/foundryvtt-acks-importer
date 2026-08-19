# OSE — importing another game's books

How a Judge's own OSE or B-X adventure becomes ACKS II documents. The shipped
cookbook and its authoring pipeline are [COOKBOOK.md](COOKBOOK.md) and
[RECIPES.md](RECIPES.md); this is the fourth surface, and the only one whose
source books nobody has authored recipes for.

## Two ways a book is read

**Most books have no recipe, and never will.** There are thousands of OSE
adventures, and a source with no cookbook is registered by the Judge, in the
world, and never shipped. What ships for those is the procedure — a grammar for
the stat-block dialect, the arithmetic that turns its numbers into ACKS ones,
and the gates that stop either from guessing. That path reads about nine blocks
in ten with no authoring at all.

**A named few are authored and shipped.** Where a title is worth taking to
completion it gets a cookbook like an ACKS book: boxes the grammar could not
find on its own, plus the prose, tables and art that geometry can reach and a
stat-block reader cannot. The list is a deliberate IP ruling rather than an open
door — see DECISIONS, "Third-party books get shipped cookbooks".

Both are the same pipeline. **An authored entry supplies the BOX; the shipped
grammar still does the reading** — so a rule the corpus teaches improves the
authored books too, and an authored book can never drift into a private dialect
of its own.

## The modules

| Module | Job | Pure? |
|---|---|---|
| [`ose-blocks.mjs`](../scripts/ose-blocks.mjs) | find candidate stat blocks on a page | yes |
| [`ose-statline.mjs`](../scripts/ose-statline.mjs) | read one block, in OSE's own idiom | yes |
| [`ose-convert.mjs`](../scripts/ose-convert.mjs) | turn that into ACKS values | yes |
| [`ose-source.mjs`](../scripts/ose-source.mjs) | the Judge's source registry | world state |
| [`ose-binding.mjs`](../scripts/ose-binding.mjs) | build the actor | Foundry |
| [`ose-app.mjs`](../scripts/ose-app.mjs) | the Judge-facing dialogs | Foundry |
| [`ose-manual.mjs`](../scripts/ose-manual.mjs) | converting a block by hand | Foundry |

The first three touch neither Foundry nor a PDF, which is why almost all of the
behaviour is checked offline — `test-ose-blocks`, `test-ose-statline`,
`test-ose-convert`, `test-ose-binding` and `test-ose-manual`.

## The flow

Five entry points on `game.modules.get("acks-importer").api` (also
`globalThis.acksImporter`):

| Call | Does |
|---|---|
| `oseRegister()` | pick the PDF, name it, choose its ruleset |
| `oseImport(sourceId?)` | choose a registered adventure and a page |
| `oseCalibrate(sourceId, page)` | teach this book a label spelling it alone uses |
| `oseConvertAll()` | fill the axes that were waiting on the guide |
| `oseManual()` | paste, correct or type a block with no PDF at all |

The review step is the point of the flow. Nothing imports on the strength of a
pattern match: the Judge sees the block as printed, what each value converted to
and on whose authority, and every axis the converter refused — and then decides.
A candidate marked as another game's block, or as two creatures read as one,
**cannot be ticked at all**; importing either produces a confident wrong answer
rather than an obvious failure.

Source PDFs are session-only, exactly as the shipped books are. What persists is
the Judge's registry entry: a name they typed, a page count, the label spellings
they confirmed, and the boxes they imported from.

## The conversion instrument

ACKS II publishes the arithmetic in its **System Compatibility Guide**, which is
a book id (`scg`) like any other. The rule ships; the constants do not — they
are read off the Judge's own page 2 by
[`scg-constants.mjs`](../scripts/scg-constants.mjs) and handed to the converter
as arguments. `tools/validate-extra.mjs` §3 fails the build if a number that
could be one of them appears in the converter.

**Staged, not gated.** Without the guide an import still produces actors: name,
hit points, saving throws, movement, morale and alignment need no arithmetic.
Armour class and attack throw are reported as gaps and filled later by
`convertUnconvertedOse`, so a Judge can import an adventure today and buy the
guide next week.

## Dialect is per source

The canonical OSE labels ship. A book that heads its hit dice differently gets a
**profile row on its own source record**, confirmed by the Judge — never a
widened shared grammar. Widening is how one verified reading of one book becomes
an unverified claim about every book nobody has opened; see DECISIONS.

## What is refused rather than converted

Three things the locator marks instead of importing:

- **A block from another game** (`suspectLineage`) — ascending armour class with
  no descending counterpart, ability modifiers rather than scores, range bands
  instead of rates. Read as OSE, its armour class inverts silently.
- **Two blocks read as one** (`mergedBlocks`) — a doubled armour-class label.
  Happens where a narrow block is set inside a prose column, a sub-column the
  page-wide histogram cannot see.
- **An unsupported lineage** — the converter returns nothing and says why.

## What reaches the actor

Everything. An axis that converts becomes an ACKS field; an axis that does not
is a **gap** — the ACKS field is left at its schema default and the printed
value is kept. Both, plus the block as extracted, the grammar's reading, and the
route and citation behind every converted value, live under
`flags["acks-importer"].ose` and are shown on the monster sheet's **Source** tab
(acks-extras; contract in that repo's `docs/lib/API.md`).

Per-axis mapping, and which axes are gaps, is in the plan of record and in
`test-ose-convert.mjs`, which asserts every one of them.

## Converting by hand

The automatic path needs a PDF it can read. A scanned adventure has no text
layer, a block the locator refused is one it could not vouch for, and a creature
from a blog post or the Judge's own head was never in a book. `oseManual()` is
the same pipeline with the page taken out: paste a block and it is read, correct
whatever it got wrong, convert. Or type it from nothing and skip the reading.

**Each field holds its clause in the source game's own idiom** — `9 [10]`,
`1** (4hp)`, `D13 W14 P13 B16 S15 (Magic-user 1)` — and converting reassembles
them into a stat line and runs the ordinary grammar over it. A widget per parsed
value would have been easier and would have frozen the editor at whatever the
grammar understood the day it was written. As built, every rule the parser ever
learns reaches hand entry the moment it reaches the parser, with no work here:
`test-ose-manual.mjs` asserts that the two paths produce identical output from
the same block.

### What the world has learned

A pasted block is read with **every label spelling calibrated on any registered
source**, not only the canonical set, and the editor names which spelling fired
and which book taught it.

This is not the same as the per-source rule, and the difference matters. A BOOK
is read with its own profile and nothing else, because one book's wording
silently changing how another parses is the failure that rule exists to prevent.
Pasted text belongs to no book: there is no reading to corrupt, the Judge sees
the result in an editable form before anything is created, and the reader says
where each learned spelling came from. So knowledge accumulates where it is safe
to — calibrate one adventure's `HIT DICE` today and every pasted block
understands it from then on.

### Provenance

A hand-converted creature carries the same record as an imported one, with
`origin: "hand"`, no page and no box. The Source tab reads it unchanged.

## Improving the grammar

A block that has to be corrected by hand is a **defect report against the
parser**, not a case the manual editor exists to absorb. The editor is there so
a Judge is never stuck; the misreading is still meant to become a rule.

```bash
node tools/ose-coverage.mjs                 # every book in the library
node tools/ose-coverage.mjs --book carcass  # one title
node tools/ose-coverage.mjs --samples       # one real clause per finding
```

It sweeps the local OSE library named by `LIB_OSE` in `tools/reference-lib.mjs`
— LOCAL-ONLY, whatever the machine's owner owns — and ranks what the grammar
could not read. Take the top line, write the rule, run it again. The number to
move is the share of blocks read completely.

**Findings are SHAPES, not values.** Every digit run folds to `#`, so
`HIT DICE 2 (9hp)` and `HIT DICE 11 (48hp)` are one finding, and the report
carries no publisher's numbers. It prints to stdout and writes nothing — a
coverage file in the repo would be a corpus of other publishers' stat lines in a
tracked file.

### What the sweep is for

Two things, and the second is the surprising one.

It finds **wordings the grammar has never seen** — `Hit Dice` for `HD`, `Saves`
for `SV`, B/X's own `D R H B S` save letters. A wording several unrelated
publishers use is the family's rather than one book's, and that evidence is what
promotes it from a per-source profile into the canonical set (see DECISIONS).

It also finds **bugs in rules already written**, which no amount of staring at
three sample books will. The two largest findings in the first full sweep were
both from the same earlier rule: the residue cut severed a group's hit points at
the comma inside `(hp 4, 6, 7)`, and severed every thousands separator in the
corpus — 141 times across 22 books, presenting as an unexplained bare number.

### A partial reading is worse than none

The alternate save letters did not fail loudly. `SV D12 R13 H14 B15 S16` matched
three of five and quietly produced a creature with three saving throws, the rest
at their defaults with nothing to mark the difference. A row is now accepted
only when its letters make up a complete known set; anything else is reported as
a gap. When a rule is added here, prefer refusing to guessing — a gap is visible
on the Source tab and a wrong number is not.

### Where it stands

Last full sweep: **1127 blocks across 93 books, 90% read completely** from the
text alone, up from 72% before the corpus was used as a feedback loop. What
remains is long tail — the largest single finding is six occurrences in two
books — and it is what the per-source calibration and the hand editor exist for.

The two halves are meant to add up. The grammar reads what publishers write in
common; a wording only one book uses is calibrated onto that book; and anything
the geometry will not vouch for is offered to the hand editor rather than
refused outright. **Every block the sweep finds is reachable**, whether or not
the parser could read it — that is the number that has to be 100%, and the 90%
is how much of it happens without a person.
