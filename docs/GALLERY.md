# Gallery

One row per workflow: what it shows, the guide that explains it, and the release
its current screenshot was taken in.

A row pointing at an older `v<X.Y.Z>/` directory is a truthful statement of how
stale that image is. Link here from the README and from release notes, never to a
raw PNG path, so those links survive the next refresh.

| Workflow | What it shows | Guide | Shot |
|---|---|---|---|
| Imported text | What an import now leaves behind: the entry's own words in the document, closing on the book and page it was read from | [guide](guides/import-from-the-cookbook.md) | [v4.0.0](releases/v4.0.0/imported-text.png) |
| The imported library | Where everything lands: a set of compendiums per SERIES, so another game's creatures never share a shelf with the ACKS ones | [guide](guides/import-from-the-cookbook.md) | [v4.3.0](releases/v4.3.0/library-compendium.png) |
| Connect a book | The book loader, whole: the server list folded behind its count, the picker that puts a library there at once, and **Add to server** on the rows of books this computer has never opened | [guide](guides/connect-a-book.md) | [v4.2.1](releases/v4.2.1/book-loader.png) |
| Forget books | The forget confirmation, reported only when the clear really happened | [guide](guides/connect-a-book.md) | [v2.6.0](releases/v2.6.0/forget-books-toast.png) |
| Import content | The onboarding panel: connect, then import everything the cookbook ships | [guide](guides/import-from-the-cookbook.md) | [v4.0.0](releases/v4.0.0/book-loader.png) |
| Import classes | A class doc's Templates pane: each printed template materialized as a bundle of world documents a Judge can repair | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/classes-template-spells.png) |
| Import the class builder | A race document materialized from the Judges Journal — the ladder, costs, and every power resolved to the definition its rung names | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/classes-builder-import.png) |
| Browse and audit | The entry picker — every entry with its book and page citation, and what an import will read from your copy | [guide](guides/browse-and-audit.md) | [v4.0.0](releases/v4.0.0/cookbook-import.png) |
| A class's printed powers | A 1st-level Dwarven Excavator carrying every power its spread grants at the start of play — including the three the import used to leave behind | [guide](guides/import-from-the-cookbook.md) | [v5.5.0](releases/v5.5.0/classes-awards.png) |
| Import ammunition | The four rows the weapons grid types Ammunition, filed as gear with a count and a fraction of a stone rather than among the weapons with a damage die | [guide](guides/import-from-the-cookbook.md) | [v5.5.0](releases/v5.5.0/equipment-ammunition.png) |
| A rebuking table, read whole | The crusader's rebuking grid as ladders on the imported class — one per kind of undead, each rung carrying its target or the cell the page prints where no throw is made | [guide](guides/import-from-the-cookbook.md) | [v5.5.0](releases/v5.5.0/rebuking-import.png) |
| Import equipment | An item priced only in prose, its cost read from its own paragraph | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/equipment-prose-price.png) |
| Import languages | The Appendix A taxonomy read from the connected book, filed on its own shelf in the library — none shipped | [guide](guides/import-from-the-cookbook.md) | [v3.0.0](releases/v3.0.0/languages-import.png) |
| Import another game's books | What the import chain's OSE step leaves in the library: an authored adventure's keyed rooms and the creatures it prints, filed under the book they came from inside its series' own compendium | [guide](guides/import-an-ose-adventure.md) | [v4.3.0](releases/v4.3.0/ose-import-everything.png) |
| Register an OSE adventure | Naming a third-party book yourself — and the series it belongs to, which is the shelf its creatures will land on | [guide](guides/import-an-ose-adventure.md) | [v4.3.0](releases/v4.3.0/ose-register.png) |
| Review an OSE conversion | Each block as printed, what every field converted to and on whose authority, and what was deliberately left alone | [guide](guides/import-an-ose-adventure.md) | [v2.10.0](releases/v2.10.0/ose-review.png) |
| Calibrate a book's wording | A publisher heading its hit dice differently, taught to that adventure alone | [guide](guides/import-an-ose-adventure.md) | [v2.10.0](releases/v2.10.0/ose-calibrate.png) |
| Convert a block by hand | Paste a stat block and it fills the fields; correct anything the reader got wrong before converting | [guide](guides/import-an-ose-adventure.md) | [v2.11.0](releases/v2.11.0/ose-manual.png) |
| Check a hand conversion | What each field became and on whose authority, with everything deliberately left alone listed beneath | [guide](guides/import-an-ose-adventure.md) | [v2.11.0](releases/v2.11.0/ose-manual-confirm.png) |

**5.5.0 is a minor and adds two rows.** Both are what the release changed and
neither had a row before: a class now grants every power its spread prints, and
an Ammunition row now arrives as gear. Nothing else was re-shot, so every other
row still points at the release its picture was taken in.

**4.3.0 is a minor and re-shot three rows.** All three are the release: the
library is no longer one Actor shelf, so *The imported library* is now the
compendium list filtered to Actor packs — `ACKS Cookbook — Actor` above
`— Dolmenwood — Actor` and `— Quick Delve — Actor`, which is the whole change
in one frame. *Import another game's books* is the same subject as 4.2.0 and
the same scroll position — where an adventure's rooms meet its creatures — but
now inside its series' own pack and under folders, where before all of it sat
loose at the top of the shared shelf. *Register an OSE adventure* gained the
**Series or publisher** field, which is what decides that shelf.

The rows not re-shot are the OSE dialogs whose surfaces this release does not
change (*Review*, *Calibrate*, *Convert a block by hand*, *Check a hand
conversion*). Two changelog entries have no row of their own and got no shot:
where a hand-converted block is filed is not visible in the dialog that makes
it, and the "imported into…" message is a notification toast. The documents in
frame were imported for the live gate from books the tester owns, and deleted
immediately after.

**4.2.1 re-shot *Connect a book*, and it is a hotfix that earned a picture.**
The window it fixes is a different shape: the server list folds behind its
count, so the whole thing fits one frame instead of scrolling past nineteen
staged books. The bridge line in it reads "0 book(s) bridged" beside seventeen
books open from the server, which is the other half of 4.2.0 doing its job.

**4.2.0 is a minor and added one row.** *Import another game's books* is new,
because the release is what it shows: books whose recipes shipped with no
control that reached them are now part of the one import. The frame is the
library listing rather than a sheet — names only, no stat line and no printed
prose, scrolled to where an adventure's rooms meet its creatures. The
documents in it were imported for the shot from a book the tester owns and
deleted immediately after.

**4.1.0 is a minor and re-shot one row.** *Connect a book* is the only surface
it changes, and the frame is scrolled to the change rather than to the top of
the window: the shelf band's own picker with its note, and two books this seat
has never opened carrying **Add to server**. The other rows keep their older
links, which is what those links are for. The shelf in frame is this test
world's real one, staged from books the tester owns.

Snapshots are captured during a live-verification session against the release
(`acks-module-template/docs/TOOLCHAIN.md` §4b), never staged from data that was
not really imported.

**4.0.0 is a major and did not refresh every row either.** Four subjects were
re-shot and one — *Imported text* — is new, because it is what the release is:
a document holding the words the GM imported, with the page reference closing
them. The rows that were not re-shot are the ones whose subject is a document
imported by an EARLIER version. Re-shooting those honestly means deleting the
test world's existing imports and importing them again — documents this session
did not create and does not own — so they keep their older links until a session
that owns them refreshes them. The five OSE rows are unchanged surfaces, as
before.

The room in *Imported text* is from a third-party quick delve the tester owns,
and its two paragraphs are in frame because they are the feature. It is the same
case the OSE rows make below: text materialized from the reader's own copy, which
ip-doctrine names as legitimate rather than a leak.

**3.0.0 was a major and did not refresh every row.** Seven rows were re-shot
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
