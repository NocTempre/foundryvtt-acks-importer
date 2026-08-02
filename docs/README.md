# Documentation

Four kinds of document, each answering a different question. Nothing is stated in
two places: a fact lives at the deepest level where it is entirely true, and
rises only when a second reader needs it. A fact owned by another repo stays
there and this one points at it — a pointer is not duplication.

| Kind | Answers | File |
|---|---|---|
| **MODEL.md** | How does it work now? | [MODEL.md](MODEL.md) |
| **DECISIONS.md** | Why is it this way? What was rejected? | [DECISIONS.md](DECISIONS.md) |
| **ROADMAP.md** | What is not built yet? | [ROADMAP.md](ROADMAP.md) |
| **guides/** | How do I use it? | [guides/](guides/) |

This is a single-feature repo, so `docs/` is flat. It additionally splits by
topic, because the pipeline has three independently-versioned surfaces:

- [COOKBOOK.md](COOKBOOK.md) — the shipped, engine-agnostic database and its
  frozen instruction set.
- [RECIPES.md](RECIPES.md) — the offline authoring pipeline that produces it.
- [BINDING-FOUNDRY.md](BINDING-FOUNDRY.md) — how the Foundry engine consumes it.

[GALLERY.md](GALLERY.md) indexes the guides and the release each screenshot came
from.

## Not shipped

None of `docs/` is in `module.zip` — the release artifact carries the Foundry
runtime plus the root README and LICENSE. These are read on GitHub.
