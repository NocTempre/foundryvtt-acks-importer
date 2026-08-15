# Gallery

One row per workflow: what it shows, the guide that explains it, and the release
its current screenshot was taken in.

A row pointing at an older `v<X.Y.Z>/` directory is a truthful statement of how
stale that image is. Link here from the README and from release notes, never to a
raw PNG path, so those links survive the next refresh.

| Workflow | What it shows | Guide | Shot |
|---|---|---|---|
| Connect a book | The book loader, with the books this seat can open | [guide](guides/connect-a-book.md) | [v2.0.0](releases/v2.0.0/book-loader.png) |
| Forget books | The forget confirmation, reported only when the clear really happened | [guide](guides/connect-a-book.md) | [v2.6.0](releases/v2.6.0/forget-books-toast.png) |
| Import content | The onboarding panel: connect, then import everything the cookbook ships | [guide](guides/import-from-the-cookbook.md) | [v2.0.0](releases/v2.0.0/getting-started.png) |
| Import classes | A class doc's Templates pane: the spellbook's contents split onto the spell list | [guide](guides/import-from-the-cookbook.md) | [v2.4.0](releases/v2.4.0/classes-template-spells.png) |
| Import the class builder | A race document materialized from the Judges Journal — the ladder, costs, and every power resolved to the definition its rung names | [guide](guides/import-from-the-cookbook.md) | [v2.8.0](releases/v2.8.0/classes-builder-import.png) |
| Browse and audit | The entry picker — the abilities with their book and page citation | [guide](guides/browse-and-audit.md) | [v2.0.0](releases/v2.0.0/cookbook-import.png) |
| Import equipment | An item priced only in prose, its cost read from its own paragraph | [guide](guides/import-from-the-cookbook.md) | [v2.4.0](releases/v2.4.0/equipment-prose-price.png) |

Snapshots are captured during the live-verification session of a release
(`acks-module-template/docs/TOOLCHAIN.md` §4b), never staged afterwards. The
books connected for these shots were disconnected again afterwards.

Names and page citations appear in frame because they are what the picker is
*for*. They ship publicly in the cookbook register already; no rules text is in
any shot.
