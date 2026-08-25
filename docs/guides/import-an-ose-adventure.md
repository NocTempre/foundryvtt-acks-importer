# Importing an OSE adventure

Turn a stat block in an Old-School Essentials (or B/X, BECMI, Labyrinth Lord,
LOTFP) adventure you own into an ACKS II monster, using ACKS II's own published
conversion.

Your PDF is read in your browser and nowhere else. Nothing about it is uploaded,
and nothing from it is stored except the creatures you choose to import.

## Before you start

You need the adventure PDF. You do **not** need anything else to begin — but the
**ACKS II System Compatibility Guide** is what carries the conversion
arithmetic, so armour class and attack throw are left blank until you connect
it. You can import first and fill those in later; see the last section.

## 1. Register the adventure

```
game.modules.get("acks-importer").api.oseRegister()
```

Pick the file, **give it a name yourself**, say which **series or publisher** it
belongs to, and say which rules it was written for. The name matters: a PDF's
own title is often just the file it was exported from, so the importer will not
guess one for you.

The series is what decides which compendiums this book's creatures go into.
Books sharing a series share a set, so type the same thing for the next
adventure from the same line — the field suggests the ones you have already
used. Leave it blank and the book lands on a shared shelf with your other books.

If you register the same book twice, it recognises it and reopens it instead.

## Where your creatures go

Nothing you import from another game's book is mixed in with the ACKS ones. Each
series gets its own compendiums, named after it:

| Compendium | Holds |
|---|---|
| `ACKS Cookbook — Actor` | your ACKS books |
| `ACKS Cookbook — Dolmenwood — Actor` | the Dolmenwood books |
| `ACKS Cookbook — Your Books — Actor` | anything you registered without a series |

Inside, there is a folder per book, and inside that: **Creatures**, **Templates**
for the ones that come in several sizes, and **Areas** for numbered rooms.

They are ordinary world compendiums — unlocked, so you can edit and drag from
them — and sharing a whole book with your players is one setting on the pack
rather than a folder at a time.

## 2. Choose a page

Any page with stat blocks on it. Blocks are found by their own labels, so you do
not need a contents page or a particular section.

## 3. Read what it found

Each block is shown three ways at once:

- **as printed** — the text exactly as it came off the page,
- **what converted** — every field, what it said, which rule was applied, and
  what it became in ACKS II,
- **what was left alone** — and why.

Check these against the page before ticking anything. That is what the step is
for.

Some things are deliberately never filled in:

| Left alone | Because |
|---|---|
| Experience | ACKS II awards experience on its own schedule |
| Treasure type | the two games' letters do not mean the same hoards |
| A single printed saving throw | one number is one number; the other four are not invented |
| A class ACKS II does not have | no equivalent to convert to |

The printed value is kept in every case — you can see it on the creature's
**Source** tab afterwards, and type it in yourself if you want it.

### Blocks you cannot tick

Two warnings disable a block:

- **"from a different game"** — the block has an ascending armour class and
  ability modifiers rather than scores. Read as OSE its armour class would come
  out inverted, so it is refused rather than converted. (Some books print two
  systems' stat blocks side by side; this is how the wrong half is caught.)
- **"two blocks may have been read as one"** — the armour class appears twice,
  which means two creatures were gathered together. This happens where a narrow
  stat block is set inside a column of prose.

In both cases, import the creature by hand.

## 4. If the page uses unfamiliar labels

Some publishers head their hit dice `HIT DICE` rather than `HD`, and so on. When
the importer sees a word standing where a label should stand, it says so, and:

```
game.modules.get("acks-importer").api.oseCalibrate(sourceId, page)
```

lets you say what each one means. **What you teach applies to that adventure
only** — one book's wording never changes how another book is read.

## 5. Filling in what needed the guide

If you imported without the Compatibility Guide, each creature carries a note
saying armour class and attack throw are still missing. Connect the guide, then:

```
game.modules.get("acks-importer").api.oseConvertAll()
```

It fills those in on everything waiting, and tells you how many. Running it
again does nothing — it only ever touches creatures that were waiting.

## When there is no PDF to read

Some blocks the automatic path cannot take: a scanned adventure with no text in
it, a block it refused because it could not tell two creatures apart, a monster
from a blog post, or one you invented. For those:

```
game.modules.get("acks-importer").api.oseManual()
```

Paste the block and press **Read it**, and the fields fill in. Correct anything
it got wrong — each field takes the clause the way your own game writes it, so
`SV` holds `D13 W14 P13 B16 S15 (Magic-user 1)` and `HD` holds `1** (4hp)`.
Then **Convert**, check what it produced, and create the creature.

You can also ignore the paste box entirely and just fill the fields in. Nothing
requires a book at any point.

Two things worth knowing:

- It uses the **same reader** as the PDF path, so anything the importer learns
  about reading stat blocks applies here too, automatically.
- It uses **every wording you have calibrated** on any adventure you have
  registered — teach one book that it says `HIT DICE` and every block you paste
  afterwards understands it. The editor tells you when that happened and which
  book taught it.

Anything it could not place is listed as not recognised, and goes nowhere unless
you move it into a field. That is deliberate: it is better to see that a clause
was ignored than to find out later that a creature is missing something.

## Checking a conversion later

Every converted creature — imported or hand-entered — has a **Source** tab on its sheet with the original
block, the rule behind each converted value, and everything left alone. If a
number ever looks wrong at the table, that tab is where you check it against
your book.
