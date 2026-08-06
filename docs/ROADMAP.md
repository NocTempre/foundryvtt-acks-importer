# Roadmap

Designed but not built. Anything here is deliberately absent from the code, not
missing from it.

---

## Cross-book merging beyond the current signals

Families merge today on a shared member id or a shared family suffix. Entries
that are the same creature under different names in two books — with neither
signal — still import as twins. A chef-authored alias would close it; the
question is whether that belongs in the register or in the binding.

---

## Locators for gear values

Cost, weight, weapon damage and armour AC currently fall back to the system's
defaults, with the printed table governing and the entry marked unaudited. No
chef-authored locators ship for them yet.

The pattern is proven — the defence and effect scans already do exactly this, and
`powerValue` was moved onto it — so this is authoring work, not design work.

---

## Gnostic invocations as documents

The Earthforger and Furnacewife casting entries carry the gnosis kind and the
Maximum Invocation Level ladder, but their invocation lists (BTA ch.5) are not
imported as documents — matching the RR classes, whose spell lists are also
empty on the casting entry. When spell-list references land for the vancian
classes, the invocation lists should ride the same mechanism.
