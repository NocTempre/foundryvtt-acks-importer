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
- **Destination:** one WORLD COMPENDIUM per document type ("ACKS Cookbook —
  Actor", "… — Item", …), created on first use; folders inside it are at most
  two deep. Decided at creation time by ONE rule per document type
  (`actorFolderFor`, `ensureItemFolder`) — never by a later pass. The ruling and
  what it replaced: [DECISIONS.md](DECISIONS.md) 2026-08-24.

## Contract with the executor

The binding embeds the dumb executor (`scripts/executor.mjs`) and calls it per
node id; it receives extract JSON and builds documents from it. The binding
must treat executor stubs/misses as renderable states (citation alone), never
errors. No binding code may re-derive content the executor didn't produce.

*(To be expanded when the module runtime is rewired from the PoC recipes to the
cookbook. The PoC's enricher/audit/import flows are the prototypes.)*
