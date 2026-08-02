# Browsing, auditing and fixing entries

What the cookbook claims, what your book actually says, and what to do when they
disagree.

> *Screenshot pending — captured at the next release.*

## Browse

**ACKS Content → Cookbook** lists every shipped entry with its book, its
citation, and whether this seat can currently read it.

Reveal an entry to extract its passage from your own PDF. Extraction is lazy and
per-entry — nothing is pulled eagerly on connect.

## Unaudited entries

An entry marked **unaudited** carries mechanics that have not been read against
the printed page. It is a parse, not an interpretation: probably right, genuinely
offered, and not asserted as the book's ruling.

Treat it as a suggestion. If it disagrees with your book, your book wins.

## When an entry points at nothing

A definition can be withdrawn — some have been, once it turned out a harvest had
read the tail of a spaceless heading as an ability of its own. Items already
created in your world stay behind, pointing at nothing.

They are unambiguously this module's (generated, with a cookbook id that no
longer resolves), which is what makes them safe to offer for removal.
**Cleanup** finds and lists them before touching anything.

## What never ships

Worth knowing when you are judging whether something is a bug:

- No prose. Passages resolve from your PDF, per seat.
- No values read from a page. Costs, damage, AC and build costs are matched
  against your own extracted text at runtime by a shipped *pattern* — the
  pattern ships, the number it finds never does.
- No book tables. They are imported from your copy into your world.

## Common problems

**The passage came out garbled.** A printed heading can carry glyph artifacts —
a detached superscript, a decomposed accent. Matching folds both forms and falls
back to a prefix, so a stray glyph does not zero the entry's mechanics. If it
still misses, the entry is worth reporting with the book and printing.

**An entry says it needs a book I own.** Check the edition: identification is
page count plus metadata title, and a different printing may not match.

**The art did not come through.** Art is resolved geometrically and only for
entries carrying an authored placement box. No box, no art — quietly, by design.
