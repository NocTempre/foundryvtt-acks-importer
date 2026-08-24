# Gallery

One row per workflow: what it shows, the guide that explains it, and the release
its current screenshot was taken in.

A row pointing at an older `v<X.Y.Z>/` directory is a truthful statement of how
stale that image is. Link here from the README and from release notes, never to a
raw PNG path, so those links survive the next refresh.

| Workflow | What it shows | Guide | Shot |
|---|---|---|---|
| The imported library | Where everything now lands: one compendium per document type, its shelves two levels deep, the priced rows filed under Equipment / Price List | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/library-compendium.png) |
| Connect a book | The book loader: the Getting Started band, and each book read from the server on every launch | [guide](guides/connect-a-book.md) | [v3.0.0](releases/v3.0.0/book-loader.png) |
| Forget books | The forget confirmation, reported only when the clear really happened | [guide](guides/connect-a-book.md) | [v2.6.0](releases/v2.6.0/forget-books-toast.png) |
| Import content | The onboarding panel: connect, then import everything the cookbook ships | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/book-loader.png) |
| Import classes | A class doc's Templates pane: each printed template materialized as a bundle of world documents a Judge can repair | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/classes-template-spells.png) |
| Import the class builder | A race document materialized from the Judges Journal — the ladder, costs, and every power resolved to the definition its rung names | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/classes-builder-import.png) |
| Browse and audit | The entry picker — the abilities with their book and page citation | [guide](guides/browse-and-audit.md) | [v2.0.0](releases/v2.0.0/cookbook-import.png) |
| Import equipment | An item priced only in prose, its cost read from its own paragraph | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/equipment-prose-price.png) |
| Import languages | The Appendix A taxonomy read from the connected book, filed on its own shelf in the library — none shipped | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/languages-import.png) |
| Register an OSE adventure | Naming a third-party book yourself, because a PDF's own title is often the file it was exported from | [guide](guides/import-an-ose-adventure.md) | [v2.10.0](releases/v2.10.0/ose-register.png) |
| Review an OSE conversion | Each block as printed, what every field converted to and on whose authority, and what was deliberately left alone | [guide](guides/import-an-ose-adventure.md) | [v2.10.0](releases/v2.10.0/ose-review.png) |
| Calibrate a book's wording | A publisher heading its hit dice differently, taught to that adventure alone | [guide](guides/import-an-ose-adventure.md) | [v2.10.0](releases/v2.10.0/ose-calibrate.png) |
| Convert a block by hand | Paste a stat block and it fills the fields; correct anything the reader got wrong before converting | [guide](guides/import-an-ose-adventure.md) | [v2.11.0](releases/v2.11.0/ose-manual.png) |
| Check a hand conversion | What each field became and on whose authority, with everything deliberately left alone listed beneath | [guide](guides/import-an-ose-adventure.md) | [v2.11.0](releases/v2.11.0/ose-manual-confirm.png) |

Snapshots are captured during a live-verification session against the release
(`acks-module-template/docs/TOOLCHAIN.md` §4b), never staged from data that was
not really imported.

**3.0.0 is a major and did not refresh every row.** Seven rows were re-shot
against the new compendium library, and one — *The imported library* — is new.
*Browse and audit* and the five OSE rows were not: their dialogs are untouched
by this release, and re-shooting the OSE ones means registering and converting a
third-party adventure end to end. Those rows keep their older `v<X.Y.Z>` links,
which is what those links are for. The 2.9.0 languages shot is from the post-release session
that live-verified (and fixed) the language import the release gate had not
reached. The
books connected for these shots were disconnected again afterwards.

Names and page citations appear in frame because they are what the picker is
*for*. They ship publicly in the cookbook register already.

The OSE shots are the one place a stat line appears in frame, and it is
unavoidable: what those dialogs exist to show is a block as printed beside what
it converted to, so a shot without one would document nothing. It is a single
line from a book the tester owns, materialized the way any import materializes
it — the case ip-doctrine names as legitimate rather than a leak. No rules
prose, no table of options, and nothing from an ACKS book.
