# Importing from the cookbook

The **cookbook** is the shipped database: structure, pointers and extraction
assists, with no prose and no values read from a page. Importing turns an entry
into a real Foundry document, filling in from *your* book what only your book can
supply.

> *Screenshot pending — captured at the next release.*

## Import an entry

**ACKS Content → Cookbook**, find the entry, **Import**.

What you get depends on the entry's kind — a monster becomes an Actor with its
weapons and abilities as embedded Items; a proficiency becomes an `ability` Item;
a piece of gear becomes a weapon, armour or item.

The descriptor text stays a lazy `@PdfText` tag rather than stored prose, so it
resolves per seat from that seat's own extraction.

## What is filled in, and what is not

**Name and citation, always.** Everything else depends on what a chef-authored
locator was able to read from your book.

Absent a locator, an item is created with the system's defaults and the printed
table governs — and the entry says so with an **unaudited** marker. What the type
buys even with nothing extracted is *behaviour*: a weapon can be equipped,
attacks and takes a fighting style; armour can be worn and counts toward AC.
A plain `item` could do none of that.

## Gear typing

With **acks-extras** installed, gear names route through its equipment root, so a
torch imports as a carried light stack and a flask of holy water as a thrown
splash weapon rather than both being generic items. Without it, the register's
own type stands.

## Cross-book merging

The same conceptual family imported from a second book gains that book's new
variants rather than becoming a twin. Two signals identify it: a shared member id
and a shared family suffix.

## Rules tables

**Import tables** materializes the rules tables as Foundry documents in your
world. In acks-extras, those register into the shared tables registry and the
henchmen and location features read them.

## Common problems

**"Missing book."** The entry cites a book this seat has not connected. Connect
it, or import anyway and accept the unresolved passage.

**Everything reports as a missing book.** No books are connected on this seat.

**An imported ability shows a ladder, not a number.** Correct — ladders travel
whole and resolve against the character who owns the item.

**I imported twice and got a duplicate.** Import checks for an entry already
present; a duplicate usually means the first copy was renamed or moved out of the
folder it was created in.
