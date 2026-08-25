# Foundry engine binding (stub — defined separately from the cookbook)

Original design content (in-repo). The cookbook (`docs/COOKBOOK.md`) is an
engine-agnostic database; **this** document owns everything Foundry-specific.
The two are versioned independently: this binding declares
`consumes: acks-cookbook/1`. The engine can change (Foundry versions, rewrites,
other VTTs) while cookbooks stay valid.

## Responsibilities of the binding (none of these live in the cookbook)

- **Routing:** register kind → Foundry document plan. `kind.monster` → Actor
  type `monster` (+ embedded weapon/ability Items); `kind.monsterLegacy` (AX
  appendix blocks) → the same Actor surface via a stats translation, deferring
  to the entry `meta.revisedBy` names when that book is open on this seat;
  `kind.npc` → Actor from the parsed statline (values persist in world fields,
  ability scores/gear notes in `flags["acks-importer"].npc`, proficiencies
  through the ability-provider tiers); `kind.location` → JournalEntry page
  (one JournalEntry per `meta.group`, body = the room's own text + the creature
  names from the seat-extracted creature lookups — pin the page to a scene to
  attach it to the map); `kind.rolltable` → RollTable (ranges from shipped
  section structure, row text materialized at import into the GM's world — the
  hand-typed-table equivalence — formula from the page's dice locator, else
  derived mechanically from ranges starting at 1); notes → JournalEntry (the
  "memorial wall"). Unrouted kinds
  default to JournalEntry — routing coverage may lag capture without losing
  anything.
- **Field mapping:** executor output → `system.*` paths (the successor of
  `scripts/stats-map.mjs`). E.g. `stats.armorClass` → `system.aac.value`,
  save class+level → the saves LUT, attacks → weapon Items with
  `flags.acks-extras.*` (damageType/naturalWeapon/extraordinary from the
  executor's `{key, ref}` triples and glyphColor result).
- **UI:** the materialized-text shape (`scripts/prose.mjs` — the entry's
  paragraphs, page reference last, stamped so a re-import can tell its own
  writing from a Judge's), concept→examples surfacing, the audit dialog.
- **Possession model:** per-seat book connection, fingerprint gate, and world
  persistence of everything a GM imported — values and prose alike (the
  hand-typed equivalence; never in the cookbook). Reading an imported document
  needs no book on any seat.
- **Destination:** WORLD COMPENDIA, one per document type per LINE — "ACKS
  Cookbook — Actor" for the ACKS library, "ACKS Cookbook — Dolmenwood — Actor"
  and its siblings for everything else — created on first use; folders inside
  are at most two deep. The line is a book's series (`BOOKS[id].line`, or a
  registered source's own `line`); a book that declares none is ACKS and uses
  the unsuffixed pack. Every label keeps the `ACKS Cookbook — ` prefix, which is
  what sorts the library together in the sidebar and what Remove Imports finds
  its packs by.

  Decided at creation time by ONE rule per document type (`actorFolderFor`,
  `ensureItemFolder`) — never by a later pass — and the SHELF is derived from
  the document's own cookbook flag by `lineOf`, so every presence check reads
  the destination from the same input the write did. Reads span every pack
  (`ourPacksOfType`); only writes pick one. The rulings and what they replaced:
  [DECISIONS.md](DECISIONS.md) 2026-08-24 and 2026-08-25.

## Contract with the executor

The binding embeds the dumb executor (`scripts/executor.mjs`) and calls it per
node id; it receives extract JSON and builds documents from it. The binding
must treat executor stubs/misses as renderable states (citation alone), never
errors. No binding code may re-derive content the executor didn't produce.

*(To be expanded when the module runtime is rewired from the PoC recipes to the
cookbook. The PoC's enricher/audit/import flows are the prototypes.)*
