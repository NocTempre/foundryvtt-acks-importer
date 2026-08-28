# Importing from the cookbook

The **cookbook** is the shipped database: structure, pointers and extraction
assists, with no prose and no values read from a page. Importing turns an entry
into a real Foundry document, filling in from *your* book what only your book can
supply.

![](../releases/v3.0.0/book-loader.png)

*Connect your books, then import everything the cookbook ships.*

## Import an entry

**ACKS Content → Cookbook**, find the entry, **Import**.

What you get depends on the entry's kind — a monster becomes an Actor with its
weapons and abilities as embedded Items; a proficiency becomes an `ability` Item;
a piece of gear becomes a weapon, armour or item.

The descriptor text is read from your PDF as the document is created and saved
into it, with the book and page as its closing line. Everyone at the table can
read it from then on, and you can edit it like any other description.

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

## Starting equipment on a class template

A template's printed Starting Equipment line becomes one item per piece the book
lists, and two kinds of piece are taken off that list because they are not gear:

- **What a book is packed with.** A cell that names a spellbook or a prayer book
  and then its contents — the shape of "battered grimoire with *one spell*, *another*,
  and *a third*" — is one book and three spells. The book keeps its printed name,
  its contents are preserved on its note, and the spells go to the template's
  **spell list**. The contents are an English list written across commas, so they
  are put back together before anything is read from them; a divine caster's
  prayer book is read exactly as a mage's spellbook is.
- **A choice the player has not made.** A cell that offers a spell of the
  character's choosing names a decision, not a spell. It stays on the book's note
  and nothing is minted for it — see `ROADMAP.md` for turning it into a prompt.

Before 2.13.2 neither separation happened: a three-spell book arrived as the book
welded to its first spell, with the rest of the list beside it as inventory. A
character built then keeps what that run produced — Foundry does not revisit
documents it has already written — so re-import the class and rebuild the
character to pick up the current shape.

### A template's spells have to exist in your world already

The importer has **no spell list of its own** — the spells are book content it
carries no recipe for — so each name on a template's spell list is matched
against the **spell documents your world already holds**, and a name nothing
answers to is reported on the chat card rather than invented. Nothing is created
for it, and nothing is lost: the template still names it.

So a caster can finish generation with an empty repertoire while another caster
in the same world fills hers, and the difference is which spells the world holds
— not which class was applied. If that happens, bring a spell library into the
world and apply the template again. The system's own *Arcane Spells* and *Divine
Spells* compendia answer part of the ACKS II list; most worlds add the rest.

## Where a monster files itself

An imported monster lands in a folder named for the **type its own stat block
declares**, not for the chapter you found it in. A creature whose block types as
a beastman files under *Beastmen* beside the others, however unrelated its entry.

A name that looks misspelled is usually the book's own coinage — the Monstrous
Manual names many creatures unlike their familiar equivalents, and *Hobgholl*
(MM p.188) is a different creature from *Beastman, Hobgoblin* (MM p.53), not a
misreading of it. An entry only imports at all when the heading on your page
matches the one the cookbook expects, so a name that arrived is the name your
book prints. Compare the stat block before assuming a typo.

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

**The page an item cites is two pages past the entry.** Fixed in 4.3.2: a
citation now names the number printed on the page, where before it named the
page's position in the PDF file, which the front matter puts two ahead (one, in
*By This Axe*). Documents already in your world keep the number they were written
with — run **Update Abilities** to rewrite them, or delete and import the entry
again. An item whose description you have edited yourself is left alone by
Update Abilities, so its citation stays as it was.
