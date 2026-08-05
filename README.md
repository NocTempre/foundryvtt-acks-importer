# ACKS II — Importer

Imports **Adventurer Conqueror King System II** book content into Foundry **from
your own PDFs**: monsters, proficiencies and class powers, equipment and price
tables, adventure locations and roll tables.

This module ships extraction *recipes* — page geometry, patterns and anchors —
and never the book text itself. Nothing is read unless you connect a PDF you own,
the bytes never leave your browser, and prose is streamed per-seat rather than
copied into the world.

A Foundry VTT module extending the
[ACKS II game system](https://github.com/AutarchLLC/foundryvtt-acks-core).

---

## Installation

In Foundry: **Install Module** → paste the manifest URL:

```
https://github.com/NocTempre/foundryvtt-acks-importer/releases/latest/download/module.json
```

**Requirements**

| | |
|---|---|
| Foundry VTT | v14+ |
| System | ACKS II (`acks`) v14+ |
| [ACKS II — Extras](https://github.com/NocTempre/foundryvtt-acks-extras) | Everything imported lands in structures it owns |
| Your own ACKS II PDFs | Nothing can be imported without them |

**Recommended:** [game-icons-net](https://foundryvtt.com/packages/game-icons-net)
for ability icons in the ACKS-shaped corners of the corpus (Acrobatics, Blind
Fighting, Caving, Mapping). Without it those fall back to core Foundry icons.

---

## How it works

The offline half of this project reads the books and produces **recipes**: for a
given entry on a given page, where its fields are and how to recognise them —
coordinates, patterns, anchors. Those recipes ship. The values do not.

At the table, you connect a PDF you own. The module runs the recipes against
*your* file, in your browser, and writes the results into Foundry documents:

- **Mechanics persist.** Stat blocks, tables and prices become real world data,
  so once a GM has imported them everyone at the table has them — including
  players who own no books.
- **Prose does not.** Descriptions are stored as `@PdfText[...]` tags and
  resolved per-seat at render time against that seat's own book. A seat without
  the book sees the tag, not the text.

The PDF bytes are never uploaded, never cached to the server, and are dropped
when you disconnect the book.

---

## Getting started

1. Enable this module and **ACKS II — Extras**.
2. Run **Connect Book** from the *Macros* compendium and pick a PDF you own. The
   module fingerprints it (page count and metadata title) to confirm which book
   and printing it is.
3. Run one of the import macros — start with **Import ALL Equipment (GM)** or a
   monster import — and watch the documents appear.
4. **Create Foundry Tables from Rules Import (GM)** turns imported rules tables
   into real RollTables and journal pages.

Imported rules tables land in the Extras rules-table registry, where its
henchmen and equipment features read them. You can audit, edit and override any
of them from **Settings → Ruledata Browser**.

---

## What it imports

| Source | Produces |
|---|---|
| Monstrous Manual | Monster actors with the full structured stat block, natural weapons, spoils and treasure links |
| Revised Rulebook | Character classes (progressions, saves, award ladders, starting templates — `importClasses()`), proficiencies and class powers, equipment, weapon/armour/gear price tables |
| Judges Journal | Proficiencies, drawbacks, and the rules tables the henchmen market runs on |
| Adventure line (AX2, AX3) | Locations as journals, roll tables, NPC and legacy-monster actors |

---

## What ships in this repo

- `cookbook/` — the compiled recipes: page geometry, patterns and anchors. Audited
  for values; there are none.
- `register/` — the entry definitions the cookbook compiles from: ids, book, page
  numbers, names, and the uppercase spelling used to anchor a page. Not shipped in
  the release zip; nothing reads it at runtime.
- `scripts/` — the extraction engine, the instruction executor, and the binding
  layer that maps its output onto ACKS documents.
- `vendor/` — a vendored pdf.js, so no PDF work leaves the browser.

The extraction pipeline's working state — raw fragments lifted from a reader's
own PDFs — stays local and untracked by design.

---

## License

**Code:** © NocTempre — proprietary; all rights reserved except as granted to
Autarch LLC under the **ACKS II App License**. This module is **not** open source
or Open Game Content, and no license is granted to copy, redistribute, or reuse
its code. See [`LICENSE`](LICENSE).

**ACKS II content** is used under the **ACKS II App License**. ACKS, ACKS II, and
Adventurer Conqueror King System are trademarks of **Autarch LLC**.

**Unofficial** — this is an unofficial fan module, not published or endorsed by
Autarch LLC.

**Registration #:** _[pending registration]_

**Requires:** legitimate copies of the ACKS II publications you import from —
the **ACKS II Revised Rulebook**, **ACKS II Judges Journal**, **ACKS II
Monstrous Manual**, and the adventure volumes for their content. This app streams
prose only from PDFs you already own and publishes no ACKS II content itself. It
is not a substitute for the books, and is free to use.
