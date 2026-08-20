# Connecting a book

The importer reads **your own PDFs**, on your own machine. Nothing is uploaded,
and no book text is stored in the world — a passage resolves per seat, at render
time, from that seat's own copy.

![](../releases/v1.0.0/book-loader.png)

*The book loader, with three books already open on this seat.*

## Connect

Open **ACKS Content** (settings, or the module's macro) → **Connect a book** →
pick the PDF.

The module identifies the edition by **page count plus metadata title**, never by
file hash: DriveThruRPG watermarks each customer's copy, so the bytes differ from
person to person and a hash would only ever match one buyer's file.

Once connected, the count beside the book tells you how many shipped cookbook
entries that connection unlocks.

## Several books in one trip

Select as many books as you like in the list, then pick all their PDFs in one go.
**The order does not matter.** Each file goes to the book it belongs to, worked
out from the name this seat used for it last time, its size, or the book's title
in the filename — the stock DriveThruRPG filenames all carry one.

Pick more files than books and the extras are offered to the books you did not
select. Anything that cannot be placed is named rather than guessed at, so you
can connect it on its own.

## Or the whole shelf: connect a folder

Point **Connect a folder…** at the folder holding your PDFs (one level of
subfolders is scanned too). Every book recognised inside connects itself, by
the same evidence rules; other PDFs living there are left alone and named only
in the console — in a folder they are the normal case, not a mistake.

On a Chromium browser over a secure origin the folder itself is remembered:
next session, **one** permission click on the folder reopens everything in it,
where per-file permissions cost one click per book. Elsewhere the folder scan
still works; the books fall back to being remembered by name.

## Every seat connects its own

A connection belongs to the browser that made it. A player who has the book
connects it themselves and sees the prose; a player who does not sees the
mechanics with the passage left unresolved.

That is the point of the design, not a limitation: the module ships structure and
pointers, never the publisher's words.

## Status and reconnecting: the Books dialog

**Book Status & Reconnect** opens one dialog that lists every book with its
state on this seat — open, remembered, or not connected — and what connecting
it unlocks. The same dialog opens on join when remembered books are waiting.

Browsers do not keep file permission across a reload without a fresh user
gesture, so each remembered book carries its own unlock control; when several
wait, the all-at-once picker (or the remembered folder's single click) takes
them in one trip.

Each failure is reported as itself — "it did not reconnect" and "there was
nothing to reconnect" are different problems.

## Common problems

**"That is not the edition I expected."** The page count or metadata title does
not match any known printing. A different printing is not necessarily wrong; the
book is read anyway, and some passages may not be found where they are expected.

**"That file is X, not Y."** The file you picked is a book the module knows, and
it is not the one it was about to fill. It is not read: a book filled from the
wrong PDF imports the wrong pages under the right names, which is far harder to
undo than connecting again. Connect that book on its own, or pick the right file.

**The count says 0.** The book connected but ships no cookbook entries yet, or
you connected a book the current cookbook does not cover.

**It forgot my book after a reload.** Expected — reconnect from the panel. The
browser will not re-grant file access without a click.
