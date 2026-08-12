# Content Streamer — decision record

Why this feature is shaped the way it is: what was ruled, what was rejected, and
what it cost. How it behaves *now* is [MODEL.md](MODEL.md).

Entries are dated and append-only. A superseded entry stays, marked.

---

### Position is not evidence, and a file that is another book is refused (2026-08-11)

**Problem.** A reader selected four books in the connect dialog, picked their
four PDFs, and every one of them landed in the wrong book — each warning that it
was a "different edition/printing" of the book it was not. The pairing was
positional: nth book selected takes nth file picked, which the dialog's own note
advertised as "paired in the order you chose them".

**Ruling.** That order does not exist. A `<select multiple>` reports
`selectedOptions` in *document* order however it was clicked, so the reader's
sequence is gone before the callback runs; the OS file picker returns its files
in its own order, usually alphabetical. Position therefore carries no information
about which file is which, and pairing on it is a coin toss that looks
deliberate. The filename matcher that had always existed — remembered name, then
byte size, then the book's title in the filename — was consulted only for
*surplus* files, i.e. never in the case that mattered. It now decides the named
books first, and position survives only as the last resort for files no evidence
could place. The matcher moved to its own module so the pairing can be exercised
offline instead of only against four real PDFs.

**Also ruled: a wrong-book file is refused, not warned about.** The fingerprint
check already knew the file was wrong and said so — and read it anyway. Every
recipe this build extracts is a page number, so a book filled from the wrong PDF
imports the wrong page's content under the right name and nothing downstream can
tell. `identifyBook` asks the fingerprint the other way round ("whose file is
this?") and the read is refused when the answer is another book in the registry.
A printing that fits *no* book still only warns: that is edition drift, which is
what the warning was for.

**Cost.** One case the guard cannot catch cleanly: a variant printing whose page
count exactly equals another book's and which carries no metadata title at all
would be refused as that other book. No shipped printing does this — the
registry's page counts are distinct, and a test holds them that way — and the
alternative was reading it into the wrong slot in silence.

**Rejected: asking the reader which file is which.** A row per book with its own
picker already exists for reconnect, and it costs one trip through the OS dialog
per book. The whole point of the multi-select is that one trip does the lot; the
evidence is good enough to earn it, and what it cannot place it names.

---

### One dedup rule for every importer: ask the shelf you write to, and claim before you build (2026-08-06)

**Problem.** Duplicate imports, reported from a live table as "double-importing
(or worse), especially the classes". Four independent causes, none of which the
offline suite can see (it has no compendium, no concurrency and one user):

1. *World read, pack write.* `importToCompendium` moved where documents are
   created. `importedIndex`/`importedIdSet` were taught to follow it; equipment,
   location journals, adventure roll tables and `resolveCompanion` were not, and
   kept asking `game.items` / `game.journal` / `game.tables` / `game.actors`.
   With the setting on, each of those saw an empty shelf on every run.
2. *Check and create are not atomic.* `importAbility` read the dedup index, then
   spent a page extraction and a socket round-trip building the item. Imports
   run four at a time and every creature resolves its own proficiency list, so
   four creatures reaching for one shared ability in that window each made one.
   This is the "or worse": the copy count is the concurrency, not two.
3. *No GM guard.* `importClasses`, `importAllEquipment` and
   `cookbookUpdateClasses` were the only bulk entry points without one, while
   their macros are labelled "(GM)" and executable by every seat.
4. *No dedup at all.* `cookbookImportIds` and the browse-and-load path created
   unconditionally.

**Taken: the two rules, applied everywhere.** A presence check reads whichever
target the matching write goes to — `importedIdsOfType(type, worldCollection)`
is that question asked once, and `importedItem` / `importedActor` are its
document-returning forms. And a build is *claimed* before it starts:
`claimImport(id, build)` caches the in-flight promise keyed by cookbook id, so
the second caller waits for the first one's document. This is the same shape
`ensureFolderPath` already used for folders, generalized. Because the claim is
keyed on the cookbook id alone and shared by every item importer, it is also
what guarantees the class import and the ability import resolve to the same
item rather than one each — the cross-importer half of the report.

**Rejected: a de-duplicating repair pass.** Worlds that already ran the broken
importers hold twins. Merging them means choosing which copy the actors that
embedded it should follow, and that is a migration with a new user-facing
surface — a minor, not a patch. The clean-slate path already ships and works:
Remove ALL Imports, then import again. Recorded in ROADMAP.

**Amended 2026-08-06 (2.4.2): a claim is a window, not a cache.** The first cut
of `claimImport` kept the resolved promise in `inflightImports` forever, which
made it a second cache — one `forgetImportedIndex` reached but nothing else did.
Deleting an imported document therefore left the claim answering for it, and
delete-then-re-import (the only way to refresh a value derived at CREATE time)
silently did nothing until a page reload. The claim is now released in a
`finally`; `rememberImported` has already run by then, so the verified index
holds the result and no window is reopened. `importedItem` also confirms a
cached document against its collection before trusting it, since the index is
built once and the GM may delete from the sidebar at any time. Caught by live
testing — the delete path has no offline coverage, and both faults are
invisible to a single-pass import.

**Cost.** `importEquipment` splits in two so the item half can be claimed while
the animal half (an Actor) stays outside the item index. `poc.mjs` gains a
`browsed` flag so a browse-loaded document can be found again — documents
created before this release carry no such flag and will still be twinned once,
after which they are stable.

---

### The refresh bridge: bytes may cross a reload, and nothing longer (2026-07-29)

**Problem.** The possession model persists a book's *location*, never the book.
Three location kinds existed, and only two could reopen themselves: a
`FileSystemFileHandle` (one permission click) and a fetchable `url` (silent).
Both are out of reach for the seat that needs them most — the File System
Access API does not exist outside a secure context, so a player on plain
`http://` over the LAN, and every Firefox seat regardless of origin, fell to the
`file` kind: the remembered *name* of a PDF and nothing else. That seat re-picked
every book through the OS file dialog on every page load, and a Foundry client
reloads constantly.

**Rejected: caching the PDF per seat.** IndexedDB is the only store not gated on
a secure context, so a durable byte cache is the only thing that would have made
a remote seat reconnect with no gesture at all. It was rejected because it
quietly converts "you must keep the book" into "you must have had the book
once": the cache outlives the file, and the module's central claim stops being
true.

**Taken: a 60-second window, measured from when the page went away.** The bytes
of an *already open* book are held in IndexedDB and are readable only while a
`touched` stamp — refreshed every 20s by a live page, and once more on
`pagehide` — is inside the window. Every join sweeps first: inside the window,
books reopen silently; outside it, the bytes are deleted before anything else
runs. `Forget Books` and setting the window to `0` both empty it immediately.

The stamp is deliberately not written at connect time. Measured from the
connect, an hour of play would leave the window long expired at exactly the
reload it exists to cover, which is the whole failure it addresses.

Three properties of that stamp are load-bearing, and 0.61.0 shipped with all
three wrong — the bridge never once fired on a real refresh. Recorded because
each is invisible until tested against an actual reload:

1. **The stamp lives in localStorage, not IndexedDB.** It is written from
   `pagehide`, and an async IndexedDB transaction opened there never commits —
   the page is destroyed first. Measured directly: the localStorage write lands
   every time, the IndexedDB write lands never. With the async write silently
   lost, the freshest stamp was whatever the 20s heartbeat last managed.
2. **The comparison is against `performance.timeOrigin`, not "now".** Foundry
   takes 20–45s to reach `ready`, so comparing at `ready` charged the reader's
   window for the boot they had just sat through — a 60s window bought perhaps
   fifteen, and a slower world bought none. The question is "how long was this
   seat away?", which is timeOrigin minus stamp and nothing else.
3. **A slightly negative gap is the normal case, not clock drift.** A reload
   records the incoming document's `timeOrigin` *before* the outgoing page is
   given `pagehide`, so an ordinary refresh yields a gap a few milliseconds
   below zero. A `gap >= 0` guard therefore rejected every single refresh. Only
   a stamp more than `CLOCK_TOLERANCE_MS` ahead means the clock actually moved.

Worth stating plainly: the byte cache was never the fragile part. An
FSA-derived `File` stored in IndexedDB was verified to survive a reload and
read back byte-identical. Every failure was in deciding *whether* to use it.

What this does and does not concede: a reload is not a new session, so bridging
it enforces nothing less than before. A *session* still cannot begin without the
reader's own file. Nothing is uploaded, nothing enters world data, no other seat
can read it, and prose remains memory-only everywhere.

**Also:** where a gesture is still required, it is now one gesture for the whole
shelf. A plain file picker grants no persistent permission and so consumes no
user gesture (unlike `requestPermission` on a handle, which is why the per-book
rows exist at all), so a seat re-picking two or more books gets a single
multi-file control that matches files to books by remembered name → remembered
size → the book's title in the filename. Unmatched files are named, never
guessed at: a book filled from the wrong PDF is worse than a book left closed.

### Dialogs are singletons (2026-07-29)

`connectBook()` and the reconnect pass are each reachable from more than one
place — a macro, the Getting Started button, the join hook — and none of them
checked whether their dialog was already open. Every extra call stacked another
identical window, so a reader who clicked "Connect your book" twice got two book
pickers, two dropdowns listing the same six books, and two chances to read the
same PDF into the same slot. Both now register a key *synchronously*, before
their async content build, and a second call brings the open dialog forward
instead.

---

### Withdrawn surface

Things this module used to ship and deliberately does not. Recorded because the
absence is a decision, and a reader of the registry would otherwise re-add them.

**The demo book (2026-07-19).** A fake entry ("cw", Codex of Whispers) sat in the
book registry to demonstrate the missing-book path. The cookbook now spans three
real books and no seat is expected to own all of them, so an unreadable entry is
the ordinary case and needs no prop to show it off.

**The Judge's Screen inserts (2026-07-24).** Listed as a book ("js") because four
hiring tables were read off them. Every one of those tables is printed in a book
the reader already needs — three in the JJ, the signing bonus in the RR — so the
screen only ever added a fifth PDF to connect for content the seat could already
read. A book id is a promise that connecting that PDF unlocks something; the
cheatsheet no longer unlocks anything.

**The PoC driver and its audit popout (2026-07-19).** A fixed sample set and a
side-by-side contrast of the two language options. Both demonstrated a question
the cookbook has since answered in production, and both leaned on the fake book.

**A third copy of the LevelValue resolver.** A local `levelValueAt()` flattened
an imported ability's roll target to a first-level number to fit core's single
`rollTarget`. Ladders now travel whole into the abilities flag and resolve there
against the character — this module locates and classifies, it does not evaluate.

**An offline-resolved `powerValue`.** The custom-class build cost used to be
resolved during compilation and shipped as a number, which put book values in the
module. It is now a shipped *pattern* matched against the reader's own extracted
text at runtime, like the defence and effect scans. The pattern ships; the number
it finds never does.

---

### The book-progress denominator measured the wrong thing

The "how much of this book can I read" count compared the handful of hand-written
PoC recipes against `proseMem`, the prose extracted eagerly on connect. Both
predate the cookbook, so a seat holding the whole Monstrous Manual was told about
a denominator of a dozen against a numerator that starts at zero and stays there
— cookbook prose is extracted lazily per reveal and never lands in `proseMem`.

The number was not wrong so much as measuring something nobody asked about. What
a reader wants to know is how many SHIPPED entries this book's connection
unlocks.

---

### Fingerprints are page count plus metadata title, never file hashes

DriveThruRPG watermarks each customer's copy, so the bytes differ per person. A
hash-based fingerprint would identify one buyer's PDF and reject everybody
else's.

---

### A second class book joins without a second import path (2026-08-06)

**Problem.** By This Axe prints ten dwarven classes plus reprints of the RR
craftpriest and vaultguard, in a typography measurably different from RR:
body type at exactly 10pt (RR sets 9), glyph runs joined without inter-word
spaces, XP figures kissing their Title neighbours at 6-8px, proficiencies as
run-ins rather than display headings, and the class C/G schedule stated only
in prose because the RR grid does not know these classes.

**Ruled: RR wins every overlap, and no BTA register entry re-anchors what
another book already defines.** The two reprinted classes got no bta recipes
- their rows in the source matrix carry the bta spread page and a note of
what the diff found (the craftpriest reprint is value-identical; the
vaultguard differs at two mid-table XP thresholds). Powers the JJ
consolidated chapter or an RR spread already anchors keep their ids and
anchors; a world with RR+JJ loses nothing by not owning BTA. Only what no
book has is authored bta-primary.

**Ruled: typography is a per-book constant, not a global.** Widening the
definition body ceiling globally to admit BTA leaked RR sidebar quotes into
neighbouring entries; widening cell glue globally would have re-fused RR
columns. Both are dispatched per entry book. The prose C/G schedule is a
binder fallback that fires only when the grid lookup misses, so RR classes
never touch it.
