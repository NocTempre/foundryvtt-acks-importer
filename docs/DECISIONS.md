# Content Streamer — decision record

Why this feature is shaped the way it is: what was ruled, what was rejected, and
what it cost. How it behaves *now* is [MODEL.md](MODEL.md).

Entries are dated and append-only. A superseded entry stays, marked.

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
