# Content Streamer — decision record

Why this feature is shaped the way it is: what was ruled, what was rejected, and
what it cost. How it behaves *now* is [MODEL.md](MODEL.md).

Entries are dated and append-only. A superseded entry stays, marked.

---

### A block that reaches the foot of the last column turns the page (2026-08-16)

**Problem.** `subheading` entries followed a column turn but not a page turn,
which the `display` branch has always done. Scything Blade is the last trap on
its spread: its fifth level was cut mid-sentence at the foot of the page and its
sixth was lost entirely. Twelve traps of thirteen were whole, so the defect was
invisible in aggregate and only showed against the wiki's own outline.

**Ruled:** the branch follows the turn, and what stops it there is tested by
SHAPE, in three parts — because each of the first two, alone, is wrong:

- **Not by font alias.** pdf.js names fonts per PAGE, so the alias that
  identifies an anchor's siblings means nothing on the page after it.
- **Not by "alone on its line" either.** A wrapped sentence at the top of a page
  is frequently a single run, and it stopped the flow before it carried
  anything — indistinguishable from the turn never happening.
- **So: alone on its line, in a face the page's body is not, AND body-sized.**
  The third clause is owed to the ordinals: the `th` of the very tier being
  carried over is alone, in its own face, and stopped the flow at the page's
  first line.

`assists.flowColumns` states the continuation page's columns, reusing the AX
path's own vocabulary — a page that defeated column detection for the entry
defeats it for the turn as well, and Scything Blade's continuation page is one.

**Cost, and the second thing this taught.** The first version carried the
next page's "column zero" wholesale, and on RR p18 that is the MARGIN TAB: the
`nonProficientUse` entry gained three paragraphs that dropped to empty strings.
Furniture is now excluded before paragraphs are built rather than left to the
drop fixes, so an entry with no real continuation gains no paragraph at all.
With that, the whole-corpus diff is `powers.json` only — `proficiencies.json` is
byte-identical, which is the check that the turn fires where it should and
nowhere else.

### A margin tab is known by where it sits, not by how tall it stands (2026-08-16)

**Problem.** Authoring the trap entries surfaced `marginTabs` failing in both
directions on one page. The rule separated a vertical chapter tab from a
superscript ordinal by the height of the stack: three or more small runs sharing
an x, spanning at least twenty points, is a tab. Neither half holds. The Judge's
Journal sets its "Dungeons" tab as four glyphs over sixteen points — under the
threshold, so it was kept, and materialized as a word of gibberish at the end of
every entry that reached the foot of the last column. Meanwhile a trap's six
tier ordinals share one indent and span two hundred points — over the threshold,
so the `st` was dropped off every `1st level`.

**Ruled:** position, which is the direct test. A tab is set in the trimmed
margin, OUTSIDE the block of body type; an ordinal sits on a line of it. The
extent is measured from the runs of body height on the page, deliberately not
from the detected columns — a tab stack can drag a column left onto itself, and
an edge derived from that places the tab inside the very block it is meant to be
outside of. That was tried first and it un-dropped the Revised Rulebook's own
`ProFIcIEncIES` tab, which is how the reasoning got checked.

**Measured, whole corpus:** twelve entries changed, all of them in `powers.json`,
all shedding drops rather than gaining them — ordinal superscripts on the class
tables and a row of footnote asterisks that had been silently deleted from the
text for as long as the rule has existed. `proficiencies.json` is byte-identical,
which is the check that the margin tabs are all still caught.

**Cost:** the rule now trusts that body type reaches further than furniture
does. A page whose only body runs are themselves in the margin would defeat it,
and none exists in six books.

### The coverage audit counted a naming difference as absent content (2026-08-16)

**Problem.** `verify-against-compendium` reported 98 differences against the
system's packs — 16 proficiencies and 45 powers the register supposedly lacked.
That report is not idle: it is where this roadmap's authoring priorities come
from, and extras' `hideSupersededPacks` map is built on the same question. Read
one by one, most of the 61 were content the register already holds.

Three separate blindnesses, each mechanical:

- **A kind the pairing does not read.** The proficiency pairing read
  `kind.proficiency` and `kind.combatProficiency` only. The Revised Rulebook's
  own table names eight thief skills — Climbing, Hiding, Listening, Lockpicking,
  Pickpocketing, Searching, Sneaking, Trapbreaking — and the register carries all
  of them as `kind.skill`, which neither pairing looked at.
- **A directory the reader cannot reach.** `registerEntries` walks the book
  directories and skips everything beginning with `_`, so `register/_refs/` was
  invisible. Animal, Beastman, Construct, Demon, Humanoid, Ooze, Undead and
  Vermin are creature-type tokens there; the pack ships each as an item.
- **A name the edition replaced.** The pack predates ACKS II and carries ACKS I
  spellings. Each was settled by searching the RR for both: *Righteous Turning*,
  *Master of Charms & Illusions*, *Dungeon Bashing* and *Apostasy* do not appear
  in it; *Righteous Rebuke*, *Mastery of Enchantments & Illusions* and
  *Dungeonbashing Expertise* do.

**Ruled:** an answer is reported at the tier that is true of it, rather than as
coverage or as a gap. Content under a kind the pairing does not read, and content
carried as a descriptor token, each get their own bucket and their own sentence —
counting them as covered would hide a real modelling difference, and counting
them as missing sends a chef to author an entry that already exists. Settled
renames go in `compendium-aliases.json`, which had never been authored: it held
its own example and nothing else. Proficiencies fell from 16 to 1, powers from
45 to 26 with 8 descriptor and 4 cross-kind.

**Ruled — the thief-skill question, which the roadmap left as neither.** It is a
modelling difference, and the register's model is the ACKS II one: these are
class powers whose target improves with level, so they are ladders the class
entries reference, not twelve standalone documents. The pack ships *Backstab*,
*Climb Walls*, *Hear Noise*, *Hide in Shadows*, *Move Silently* and *Find Traps*
because it was built against ACKS I. Nothing is owed here.

**Cost:** the ten monster resistances and immunities are still reported. They are
materialized into `fields.defenses` from the seat's own prose and will never be
documents, which is a standing decision rather than a lookup — so it is written
in the roadmap where the audit lives, and a chef meets it while reading the
report rather than finding it silenced inside the tool.

**One genuine gap survived the pass:** *Apostasy*, which appears in neither the
Revised Rulebook nor the Judge's Journal. It is named in the roadmap as content
to locate rather than aliased away.

### A page the histogram cannot read is authored, not out-detected (2026-08-15)

**Problem.** Sixteen definitions extracted whatever printed beside them instead
of their own text — Coat, Tunic and Pants and Turban shipped a column of price
digits. `detectColumns` bins body-run x-origins and needs a bin holding >8% of
them, which a table starves: BTA p95 prints columns at 36 and 306 and the
detector returns 240 and 310, both edges of the price list below.

**Rejected: a better detector.** Two were built and measured against the whole
corpus. Reading the gutters as whitespace over the page fails where a wide table
crosses them (RR p71 sets seventeen stat lines across the gutter). Reading them
from the anchor's own lines works on BTA but breaks pages where the block is
short and a table follows it: recompiled, that version fixed sixteen entries and
broke four that had been correct, `def.power.jargon` among them. Every variant
traded one set of pages for another, because the pages that defeat the detector
are irregular in different ways.

**Ruled:** `assists.columns` — the per-entry override the repo already had, and
already used on six register files — is the answer for these, and the detector
is left alone. An authored pair of numbers is exact, verifiable by reading the
entry's own text, and risks nothing on the eleven hundred entries that were
never in doubt. Sixteen entries authored across eleven pages.

**Cost:** a page that defeats detection now needs a human to notice. So the
measure became a gate rather than a note: `tools/check-prose-boxes.mjs` fails
when a definition's first paragraph does not contain its own anchor's x, and
names the entries needing the assist. It reads only the compiled cookbook, so
CI carries it.

**Two compiler rules were sharpened in the same pass**, both of them cases where
a test of SHAPE matched something that was not that shape:

- A section heading may not end in a full stop. Turban's closing line — "Meniri
  dwarves south of Opelenea and Kemesh." — is forty-four characters,
  capitalised, alone on its line, and set in a face that is not its column's
  commonest only because a price table below it holds the vote. It read as a
  heading and cut the entry in half.
- A run-in anchored on a PREFIX ending in "(" does not end at the prefix. The
  anchor is written that way because the level ordinal varies, but "(9th):" is
  still heading: 62 of 69 prefix-anchored definitions opened their description
  with their own heading's tail. Absorption now runs to the closing parenthesis
  and the colon after it, and only where the line actually holds that shape.

---

### Prose continues across a column and a page; never across a heading (2026-08-13)

**Problem.** A definition block that reaches the bottom of its column resumes
in the next one, and `columnFlow` / `pageFlow` ended that continuation at the
next anchor of the SAME kind. Nothing else stopped it, so a block ran through
whatever lay between: an equipment entry swallowed a weapon table and the next
item's entry, a dwarven whistle swallowed a fuels price list, a class power
swallowed a race's traits.

**Ruled:** a continuation also ends at a display heading, whatever kind it
belongs to. Body runs sit below the display-heading size, so the size alone
tells them apart without knowing what the heading says. Measured over the whole
shipped corpus: 15 of 1204 entries changed, every one of them shorter, none
longer — and the text each one shed was another entry's.

**Superseded same day for the body-size case — see the entry below.** This
ruling stands for display headings; the body-size run-in it declined to handle
was closed in 2.6.3.

---

### A block ends at its section heading, calibrated on the body (2026-08-13)

**Problem.** The reported entry survived the rule above. `def.power.longeval`
(and the four aliases that follow its text, *Ageless* among them) ends at "Code
of Behavior", which is a heading in neither of the senses the compiler knew: not
a display heading — it is set at body size — and not the next entry, because the
stop matched `alias === anchor.alias` and required a colon, and a section
heading is a THIRD font carrying no colon. The page sets a run-in face, a body
face and a heading face; the stop could see only its own.

**Ruled:** calibrate on the BODY, not on the anchor. Whatever face most of a
block is set in is prose, and a line-initial run in any other face that occupies
its whole line is a heading that ends the block. Testing the RUN's own text
rather than the line's is what keeps a bullet glyph — its own tiny face, empty
string, sitting at the column edge of a wrapped sentence — from reading as one.

**The half that mattered more.** Finding the stop is not enough: a block
continues into the next column and overleaf only because it ran out of column,
and a block that ended at a heading ran out of nothing. Those two branches were
gated on the run-in stop alone, so an entry that had already finished still
collected the next column and the page after it. `longeval` shed its Code of
Behavior and went on gathering a template table until the continuation was
gated on the section stop too.

**Rejected — stopping at any non-body face without the bracket test.** The JJ
closes a power with the classes that may take it, and that list wraps:
"[Elven Wizard," ends a line and "Nobiran Wizard, Wizard]" begins the next, in
the list's own face, flush left — a heading by every other test. Cutting there
leaves the bracket open, which is worse than not cutting: `stripOwnerList` no
longer recognises the list it exists to remove, so half of it stays on the page.
`def.power.flawlessPrecision` did exactly this until a heading was forbidden
from opening inside an unclosed bracket.

**One printed style, several fonts.** The stop that ends a block at the next
entry matched the anchor's own font, and BTA p98 sets "Firewood:" and "Refined
Oil:" — adjacent entries in one column, identically styled — in two different
aliases, so firewood described the oil beneath it. Matching "not the body font"
instead fixes that and breaks JJ p310, where the see-references ARE set in the
body font: "Alien Senses: See alertness." swallowed the entry after it, its
see-reference stopped parsing, and it silently ceased to be an alias at all —
caught only because the alias count fell by one. A heading is either: the
anchor's font, or not the body's. Neither test alone covers both pages.

**Measured, whole corpus, against all six books:** 34 of 1206 entries changed,
every one shorter, none longer, and 30 of the 33 now end on sentence
punctuation, and every cut lands where the DROPPED text opens a new section
rather than continuing the entry's own sentence — the weaker "ends on a period"
test scores a cut at any heading as clean, including a wrong one, so it was
replaced. Three entries end in table wreckage they ended in before — shorter,
not worse, and owed to their own boxes rather than to this rule. What the rest
shed was another section's: three witch traditions dropped from 5012 characters
to 915 by no longer reciting the whole Additional Class Powers list, and
`refinedOil` from 2561 to 309 by no longer reciting a weapon table.

**Confirmed against the wiki snapshot**, which preserves the paragraph
boundaries PDF extraction destroys: Longeval's page there ends exactly where
this rule now cuts. `flawlessPrecision` is confirmed by the book itself — the
Judges Journal closes a custom power with its class list, and the kept text
ends immediately before `[Elven Wizard, Nobiran Wizard, Wizard]`.

---

### An alias is read from the book its text prints in (2026-08-12)

**Problem.** A field report showed the class power *Ageless* describing itself
with a poison table and the general Proficiency Throws rules, in mangled
spacing, starting mid-word. Not an extraction fault: an alias — a name the books
list whose rules text prints under another entry — carries a pointer to its
target's passage, and that pointer is page geometry. The compiler copied the
geometry, and the citation, onto the alias without moving `book`. Nothing at
runtime could notice: an entry is read from `entry.book` alone, the instruction
set has no cross-document read, and the only correctness gate is the `expect`
probe on the name — which kept passing, because the name was the one field still
pointing at the right book. So 31 Judges Journal powers executed Revised
Rulebook rectangles against the JJ and extracted whatever printed there.

**Ruled:** an alias follows its text. Where the target lives in another book the
alias adopts that book, its pages and its name probe — the probe is what proves
the page, and the alias's own probe points at the listing it is leaving behind.
The ability's own name is a different field and does not move. The citation
already named the target's book, so this makes the entry agree with itself
rather than changing what it claims.

**Rejected — refuse the cross-book pointer.** The textless-alias path already
exists and degrades cleanly, so refusing would have been the smaller change. It
also leaves all 31 permanently unreadable and leaves a reveal button with
nothing behind it. Wrong text is worse than no text; no text is still not the
goal.

**Rejected — a per-field book.** Correct in the long run: it would let a JJ
entry keep its own book and still read a passage from the RR. It needs a second
document at runtime and a change to a frozen instruction set, which is not a
hotfix.

**Cost, accepted:** the book that unlocks these 31 moves from the JJ to the RR.
A seat with only the JJ connected loses their text — it never had their real
text, but it did have something. Worlds that imported them under the old data
hold mechanics scanned from the wrong prose; only a GM re-run of Update
Abilities repairs that, and nothing detects it automatically.

**The gate that was missing.** `expect` proves the name and nothing else, so a
mis-pointed field is invisible to it. `tools/test-cookbook-coherence.mjs` now
asserts over shipped data that an alias is read from its target's book, and that
an entry's citation names the book it is read from — the second is the
user-visible face of the same defect, and it catches all 31.

---

### The class-builder import leaves working examples, not just tables (2026-08-12)

**Problem.** acks-extras grew an advanced mode that derives a class from JJ
build values, consuming an `acks.classBuilder` ruledata doc, race documents
and per-class builder state — none of which ships anywhere (every number is
book content).

**Ruled (user):** the JJ table import produces all three. `table-recipes.mjs`
extracts the raw builder chapter (category ladders, the per-value spell grids
including the delayed-acquisition set, trade-offs, smoothing and post-8
prose, the dwarf/elf sections, the Ready-for-Play build paragraphs);
`builder-binding.mjs` assembles the engine shape into the same ruledata doc,
materializes `acks-extras.race` items stamped `def.race.<key>`, and writes
each Ready-for-Play build onto its class document — scoped, by the same
ruling, to the RR core classes and the demi-humans; the rest of the JJ
roster and races is extras-ROADMAP work. Live-verified: derive reproduces
the printed Fighter and Elven Spellsword spreads exactly.

**Mechanics that earned comments in code, recorded here once:** superscript
ordinal runs interleave mid-sentence ("capped th at 10 level"), so prose
anchors stop at the printed number and parses never assume adjacency; verso
pages sit ~26pt left of recto (the delayed grids), and one verso column
starts at x≈299, under the default 300 column split.

**Rejected: parsing trade-off elections out of the build paragraphs.** Which
sentence maps to which trade-off row is a judgment; the paragraph lands in
`builder.notes` and the Judge elects by hand.

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

### The printed name and the defined name are two different names (2026-08-14)

**Problem.** A class or race spread names a power in the short form its own
paragraph uses; the definition it points at carries the full one. A dwarf's
value-0 rung prints "Hardy" for `def.power.hardyPeople`, and prints "Dwarf
Tongues" and "Elf Tongues" for `def.power.giftOfTongues` — a name no
definition carries at all. Race materialization resolved rung powers by exact
item name, so the misses landed in the rung's note and the rung granted
nothing. In a world that has not yet imported its powers, *every* name misses
and every rung comes up empty.

**Ruled: the source matrix is the alias index.** `register/_refs/powerSource`
already records, per class, the name a spread prints beside the ref it means —
it was built as a provenance matrix, but that pairing is exactly the alias
mapping, and authoring a second list of aliases beside it would give one fact
two owners. Resolution now falls through to it: world item by exact name
first, register second.

**Ruled: a register hit binds even when the world does not hold the power.**
A `def.*` id is a ref in its own right, so the rung points at the definition
and resolves the moment those powers are imported — better than a note naming
a power nothing links to. Only a name the register cannot place stays in the
note.

**Ruled: an ambiguous printed name resolves to nothing.** Nine classes print
a "Renown" of their own, and four print a "Lay on Hands"; binding a rung to
whichever came first would attach another class's power. Five names are
ambiguous today and every one of them is dropped from the index rather than
guessed at.

**Cost, and what it exposed.** `powerSource` was the one reference register
that never declared `registry`, and the compiler keys tables by that field
(`refs[r.registry] = r`) — so it had always compiled into the cookbook as the
literal key `undefined`. Nothing could name it, and a second omission would
have silently overwritten the first. The lint now requires the field and
requires it to equal the file's basename, which is why the file is
`powerSource.json` rather than `power-sources.json`.

### A language is a name and a page, not a description (2026-08-15)

**Problem.** `kind.language` had a folder and a category but no entries. The
obvious authoring — model it on `kind.proficiency` — does not fit what the book
prints. The Auran Empire languages are not descriptor blocks: RR Appendix A
sets all 58 as one indented family tree, each a single cell naming the language
beside its real-world counterpart, and no page anywhere describes an individual
language. There is no run-in heading, no display heading and no prose.

**Ruled: languages compile to their name check alone.** *Superseded same day —
see the entry below: 58 name-only entries turned out to BE the list, and none
ship.* `compileLanguage`
anchors the printed cell (`anchor.label`, matched folded so Argollëan survives
extraction differences) and emits one `expect`. Every other definition kind's
`description` instruction would have nothing to point at. Aiming it at the rows
below the cell — the only text there is — would hand each language its
children's names as its own prose, which is how `def.equip.coat` already fails
(ROADMAP).

**Ruled: the tree stays on the page.** *Superseded same day — see the entry
below: the names do NOT ship, and the tree is read into the world from the
seat's own book.* Names ship, as every entry's name does.
Descent, and which real-world tongue each language stands in for, is the page's
own arrangement — the table IS the content — so the entry ships neither. A
reader follows the citation. This also keeps the register honest about what it
knows: nothing in the module can be wrong about a relationship it never claims.

**Cost.** A language item's description is a citation stub with no reveal. The
`@PdfText` reveal link is now gated on the recipe HAVING a description
instruction rather than on the seat having the book, because otherwise every
language showed a reveal that opened on an empty string.

**Ruled: `def.language.*`, never `def.lang.*`.** `itemShelfFor` keys on an id's
first two segments, and the shelf commit bab3055 added is `def.language` — so
`def.lang.*` ids lint clean, compile clean, and file all 58 languages in the
unsorted root folder. Nothing else in the register or the compiled cookbook
collides: no existing definition's id tail matches a language's, and no
cross-reference in any book resolves to one. The single name collision is
`mm.lizardman`, a monster in a book cookbook, which shares no lookup with a
content-type definition.

**Ruled: languages stay out of the printed-name tokenizers.** A class's
Proficiency List and a template's Proficiencies cell name proficiencies, skills
and powers, never a language. Feeding 58 short common words ("Orc", "Ithean",
"Draconic") to a greedy longest-first matcher only gives them a chance to claim
the head of a cell that belongs to something else.

### The taxonomy is read from the seat's own book, and a list cannot ship (2026-08-15)

Supersedes the first two rulings of the entry above, hours after they shipped.

**Problem.** Fifty-eight register entries whose every field was the same name
— camelCased in the id, plain in `name`, folded in `anchor.label` — passed
both IP gates. `ip-scan` caps string LENGTH and hunts for prose; the register
lint caps a label at sixty characters. Neither counts how MANY name-only
entries a kind ships, and a taxonomy transcribed one cell per entry is not a
way of finding the list, it IS the list. The family's rule is that no value
read off a page ships in any repo, history included; the entries were removed
and the commits that carried them were squashed out of history before the
branch and tags moved.

**Ruled: the recipe carries geometry, never names.** The `languages` table
recipe (`table-recipes.mjs`) holds a section heading, two x-bands and an
indent step. `extractIndentTree` (`table-extract.mjs`) turns cell indentation
into depth and parentage at import time, in the world doing the importing,
against the seat's own Revised Rulebook. What the rows SAY never enters this
repo; a derived id is not shipped content.

**Ruled: extracted languages become shelved ability items.**
`language-binding.mjs` derives `def.language.*` ids — honoring this entry's
own earlier `def.language.*`-never-`def.lang.*` ruling, which the first cut
of the binding violated (it minted `def.lang.*`, which `itemShelfFor` cannot
key, so all 58 items landed loose in the world root). Creation goes through
`ensureItemFolder`, the same shelf machinery every other imported ability
uses. The items do not set the `generated` flag: Prune removes generated items
whose definition no longer resolves, and a language never had a definition to
resolve — flagging them would offer all 58 for deletion on the next prune.

**Ruled: the gate that was missing now exists.** `audit-transcription.mjs`
fails validate when any kind ships more than a dozen name-only entries. It
caught nothing the day it landed only because the list was already gone; it is
the check that would have refused the list on the day it was authored.

**Cost.** A world whose seat never imports the Revised Rulebook has no
language items at all. That is the right failure: the alternative was the
module knowing the answer.

### 2026-08-15 — an imported language is a `language`

The taxonomy imported as `ability` items carrying `system.category:
"language"`. The system has owned a first-class `language` item type all along:
it declares the type, gives it an icon and a details template, files it in its
own section of the character sheet, and reads it in the Polyglot provider it
registers at startup. Minting abilities put all 58 tongues outside every one of
those at once — imported languages showed up in the proficiency list, and no
character speaking one was visible to Polyglot.

**Ruled: the type is the system's.** `LANGUAGE_TYPE` replaces the ability
constant, and the descent record moves from `system` to flags, because the
system's language type carries a description and nothing else and a field it
does not declare is dropped on the way in. Nothing about the IP posture
changes: the names still come from the reader's own book and the ids are still
derived at runtime.

**Ruled: find before minting, in three places.** A tongue is looked for by its
derived id, then by name among the world's languages, then in the system's own
compendium. The first is the old idempotence guard; the second stops the import
laying a twin beside a language a Judge typed themselves; the third means a
world gets the system's furnished document — description and art — rather than
a bare name. An adopted document is stamped with the derived id so the next run
finds it by the fast path.

**Ruled: the retype creates before it deletes.** A document's type cannot be
updated, so an ability minted by an earlier version is replaced rather than
changed. The replacement is committed first and the ability removed only once
its successor exists, so a run that dies halfway leaves a duplicate — which the
next run adopts — never a world that has lost a language.

**Cost.** The name index spans every type, not just `language`, so a world
holding the old abilities is recognised as already having the tongue. Without
that, the release that fixes the type is also the release that doubles
everyone's language list.

### 2026-08-16 — who speaks which: read off the spread, defaulted off the chapter

The roadmap entry of a day earlier said the language lists were "not a
pattern away" — measured against `cookbookProse`, which returns only the
register's description window. Wrong measurement: the spreads DO print the
lists, as a `Tongues:` runin in Racial Traits, and the class binder's `body`
(the full spread, the same read the cleave phrase uses) reaches it.

**Ruled: the runin is the granted list, whole.** It names the racial tongue,
the common one, and the rest, so a demi-human class imports with `granted` =
the parse and `count` = 0; Intellect's slots are the extras module's business
at grant time. The parse keeps only proper-name-shaped items, so a
speak-with-beasts power can never be granted as a language.

**Ruled: a human class is the chargen chapter's rule.** No runin means human:
one open homeland pick beside the common tongue, whose NAME is extracted once
per run from the chapter's own "often called" sentence
(`def.classmeta.startingTongues`, the compiler's new prose-window classMeta
shape). Bookless imports grant nothing rather than a guess.

**Ruled: race documents inherit through the runin's own subject.** "Dwarf
Tongues" names its race; the label, folded, keys the builder's race item, and
only an EMPTY race list is written — a Judge's edit is never replaced.

**Found while shipping, not fixed here: repeated compiles disagree.** Six
from-scratch compiles produced four distinct powers.json hashes, differing in
paragraph box coordinates — so the drift gate flagged different entries on
different runs. UNRESOLVED whether the compiler itself is nondeterministic or
the measurement was contaminated: a concurrent session was hand-editing the
compiler and the bta registers during the same window, and this session's own
compiler edit was overwritten mid-run by that session, so the hashes may have
been comparing different programs. Re-measure on a quiet tree before treating
the compiler as guilty. The committed cookbook is the modal output of six runs, which also
repaired 22 BTA entries whose committed boxes pointed at the WRONG page
column — stale survivors of the margin fix that the in-place compile's
folding behaviour never replaced. The determinism bug is toolchain work and
is recorded in the intake ledger, not patched in a hotfix.

**Ruled: a clause the page interleaves is dropped whole.** The Spellsword's
spread lands its proficiency list mid-sentence in the raw column text,
capitalised exactly like tongues, so no shape test can separate them. The
speak-clause capture is capped at 80 characters — every real list fits in 48
with all its spaces glued out — and a clause that cannot reach its terminator
under the cap is interleaved and dies; the class falls back to the human
default. One class granting fewer languages beats one class granting
Fighting Style Specialization as a tongue.

### 2026-08-16 — a class is its race's whether or not its page reads

The Spellsword fallback shipped in 2.9.3 was the right refusal and the wrong
resting place: the class got the human default, which is not merely less
information but WRONG information — an elf handed a homeland pick it does not
get.

**Ruled: the register declares the race; the book still supplies the list.**
`class.race` on the six demi-human RR entries is a classification, the same
kind of statement as `chassis` or `factored`, and the class's name already
says it. The tongues are then borrowed from a sibling of the same race whose
page parsed, so every name still came off the reader's own book — only the
page it was read from changes.

**Ruled: only a class that read its OWN runin may lend, and only a class that
did not may borrow.** Without that pair of tests a human-default list
propagates itself around a race and the fallback silently becomes the answer.
The borrower also hands back the homeland slot the default had spent, keeping
whatever its own spread granted on top.

**Ruled: Nobirans are their own race and stay on the default.** Their spread
prints no Tongues runin, so there is no sibling to borrow from and nothing is
invented; the declaration is there for the day a page provides one.

**Ruled: bonus languages are picks, never names.** Multilingual and Linguistics
grant languages of the reader's own choosing — the book says so and leaves them
to the campaign's regions — so they land in `count`, not `granted`. The largest
grant found wins rather than the sum, because a spread states its allowance once
and then talks about it.

**Cost, and the shape of the whole feature:** every pattern here is `\s*`
between tokens and explicit in its alternations, because raw body extraction
glues inter-run spaces out. That is not defensive style, it is the measured
behaviour of the source — `ElfTongues:`, `theCommon`, `AncientZaharan`,
`called“Common”`. The last of those cost a release: 2.9.3 shipped with the
common tongue silently unfound, so every human class imported speaking nothing.
