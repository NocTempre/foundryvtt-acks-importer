# Changelog

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
