# OSE — importing another game's books

How a Judge's own OSE or B-X adventure becomes ACKS II documents. The shipped
cookbook and its authoring pipeline are [COOKBOOK.md](COOKBOOK.md) and
[RECIPES.md](RECIPES.md); this is the fourth surface, and the only one whose
source books nobody has authored recipes for.

## Why it is not a cookbook book

Every ACKS book in [`scripts/books.mjs`](../scripts/books.mjs) has hand-authored
page geometry compiled against one exact printing. That works for seven books
and cannot work for third-party adventures: there are thousands, none has a
recipe, and a module cannot ship a list of other publishers' books anyway.

So an OSE source is **registered by the Judge, in the world, and never
shipped**. What ships is the procedure — a grammar for the stat-block dialect,
the arithmetic that turns its numbers into ACKS ones, and the gates that stop
either from guessing.

## The four modules

| Module | Job | Pure? |
|---|---|---|
| [`ose-blocks.mjs`](../scripts/ose-blocks.mjs) | find candidate stat blocks on a page | yes |
| [`ose-statline.mjs`](../scripts/ose-statline.mjs) | read one block, in OSE's own idiom | yes |
| [`ose-convert.mjs`](../scripts/ose-convert.mjs) | turn that into ACKS values | yes |
| [`ose-source.mjs`](../scripts/ose-source.mjs) | the Judge's source registry | world state |
| [`ose-binding.mjs`](../scripts/ose-binding.mjs) | build the actor | Foundry |
| [`ose-app.mjs`](../scripts/ose-app.mjs) | the Judge-facing dialogs | Foundry |

The first three touch neither Foundry nor a PDF, which is why almost all of the
behaviour is checked offline by `test-ose-blocks`, `test-ose-statline` and
`test-ose-convert`.

## The flow

Four entry points on `game.modules.get("acks-importer").api` (also
`globalThis.acksImporter`):

| Call | Does |
|---|---|
| `oseRegister()` | pick the PDF, name it, choose its ruleset |
| `oseImport(sourceId?)` | choose a registered adventure and a page |
| `oseCalibrate(sourceId, page)` | teach this book a label spelling it alone uses |
| `oseConvertAll()` | fill the axes that were waiting on the guide |

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
