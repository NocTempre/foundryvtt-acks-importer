# Changelog

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
