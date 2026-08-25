# Connecting a book

The importer reads **your own PDFs**. A passage resolves at render time from a
copy the reading seat can reach — your own disk, or a book the GM has staged on
the server for the table.

![](../releases/v3.0.0/book-loader.png)

*The book loader, with three books already open on this seat.*

## Connect

Open **Your ACKS Books** (the macro in "1 · Your Book") and use the control on
the book's own row. One window covers all of it: the walkthrough, the server's
books, the controls that answer for several books at once, and a row per book.

The module identifies the edition by **page count plus metadata title**, never by
file hash: DriveThruRPG watermarks each customer's copy, so the bytes differ from
person to person and a hash would only ever match one buyer's file.

Once connected, the count beside the book tells you how many shipped cookbook
entries that connection unlocks.

## Several books in one trip

Use **Pick PDFs…** and choose all of them at once. **The order does not
matter.** Each file goes to the book it belongs to, worked out from the name
this seat used for it last time, its size, or the book's title in the filename
— the stock DriveThruRPG filenames all carry one.

Anything that cannot be placed is **named rather than guessed at**: a book
filled from the wrong PDF is far worse than a book left closed. Connect those
from their own row, where the book is already named and nothing has to be
inferred.

## Connect a folder

Point **Connect a folder…** at the folder holding your PDFs (one level of
subfolders is scanned too). Every book recognised inside connects itself, by
the same evidence rules; other PDFs living there are left alone and named only
in the console — in a folder they are the normal case, not a mistake.

On a Chromium browser over a secure origin the folder itself is remembered:
next session, **one** permission click on the folder reopens everything in it,
where per-file permissions cost one click per book. Elsewhere the folder scan
still works; the books fall back to being remembered by name.

## Books on the server

Browsers will not hand a file back after a reload without a fresh click, which
is why a book connected from your own disk asks for a gesture every session.
A book the **server** holds asks for nothing.

There are three ways in, and none of them asks you to connect the book on this
computer first:

- in the Books window's **On the server** band, **pick your PDFs** — as many as
  you like at once. Each one is read here, identified, and uploaded into
  `acks-importer-books/` under the Foundry data folder. Anything that names no
  book is listed back to you and left alone;
- press **Add to server** on any book's own row. The row names the book, so
  the file you hand it needs no guessing at all;
- copy your PDFs into that folder yourself (drag, FTP, host panel) and press
  **Scan the folder**.

Every route **opens and checks the file before anything is staged**, and the
first two check it before anything is uploaded: a PDF is only recorded as a
book once it proves to be that book, so a misnamed file is refused rather than
staged wrong. From then on every GM seat, on any machine, reads it
automatically at launch — no picker, no permission click, nothing to remember.

If the server already holds a file under that book's name, nothing is uploaded
a second time: the copy already there is read and staged if it is that book,
and named to you if it is not.

Removing a book from the server only stops the module reading it; the file
stays where it was put, and the window tells you where.

One thing to be clear about: a file under the Foundry data folder can be
fetched by anyone signed in to your world who knows the path. Staging a book
makes it undiscoverable, not inaccessible. If that matters for your table, keep
your books on your own disk and connect them per seat.

## Status and reconnecting

The Books window lists every book with its state — open, waiting, or not
connected — and what connecting it would unlock. It opens on join when
remembered books are waiting, and from the **Your ACKS Books** macro any time.

**Reconnect all** does everything that needs no permission first — the server's
books, served paths, and anything the browser will still open by itself — and
then spends its single click on the remembered folder, which re-reads every
book inside. Whatever is left is named, because one click can only ever
re-grant one file's permission; those books keep their own button.

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

**It forgot my book after a reload.** Expected for a book on your own disk —
the browser will not re-grant file access without a click. Reconnect from the
window, or put the book on the server and stop being asked.
