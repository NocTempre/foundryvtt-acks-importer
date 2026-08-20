/**
 * Importing an AUTHORED OSE book.
 *
 * The registered-source path asks a Judge to find the blocks; an authored book
 * already knows where they are. The cookbook carries a box per creature and an
 * anchor that proves the box still points at it, so this walks the shipped
 * entries, reads each box with the SHIPPING executor, and hands the text to the
 * same grammar and converter the manual and per-page paths use.
 *
 * Nothing about the reading is special-cased here. That is the whole reason a
 * cookbook entry carries geometry rather than a parsed creature: a rule the
 * corpus teaches `ose-statline.mjs` improves these books at the same moment it
 * improves every other, and an authored book can never quietly become a second
 * dialect maintained by hand.
 */
import { MODULE_ID, LANG_PREFIX } from "./constants.mjs";
import { executeEntry } from "./executor.mjs";
import { parseOseStatline, PROFILES, OSE_CANONICAL } from "./ose-statline.mjs";
import { oseActorDataFromFields, moraleBoundsFromSchema } from "./ose-binding.mjs";
import { currentScgConstants } from "./ose-app.mjs";
import {
  createDoc,
  cookbookBookFile,
  cookbookRegisters,
  cookbookSessionDoc,
  cookbookArtImporter,
} from "./cookbook.mjs";
import { BOOKS } from "./books.mjs";
import { progressBar } from "./progress.mjs";

const loc = (k, data) => (data ? game.i18n.format(`${LANG_PREFIX}.${k}`, data) : game.i18n.localize(`${LANG_PREFIX}.${k}`));

/** Book ids that ship an authored OSE cookbook, and are open this session. */
export function authoredOseBooks() {
  const out = [];
  for (const id of Object.keys(BOOKS)) {
    const cb = cookbookBookFile(id);
    if (!cb?.entries) continue;
    const creatures = Object.values(cb.entries).filter((e) => e.kind === "kind.oseMonster");
    if (creatures.length) out.push({ id, label: BOOKS[id].label, count: creatures.length, open: !!cookbookSessionDoc(id) });
  }
  return out;
}

/**
 * Import every creature an authored book ships a box for.
 *
 * @param bookId  an authored book id whose PDF this seat has connected
 * @param opts.folderId  where the actors land
 * @param opts.art       import the page illustration too (default true)
 */
export async function importOseBook(bookId, { folderId = null, art = true } = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn(`${MODULE_ID} | GM only (creates documents).`);
    return 0;
  }
  const cb = cookbookBookFile(bookId);
  const doc = cookbookSessionDoc(bookId);
  if (!cb?.entries) return ui.notifications.warn(`${MODULE_ID} | ${loc("ose.bookNoCookbook", { book: bookId })}`), 0;
  if (!doc) return ui.notifications.warn(`${MODULE_ID} | ${loc("ose.bookNotConnected", { book: BOOKS[bookId]?.label ?? bookId })}`), 0;

  // A shipped book may declare its own dialect and lineage. Both default to
  // OSE, so a book that says nothing is read exactly as before.
  const profile = PROFILES[BOOKS[bookId]?.profile] ?? OSE_CANONICAL;
  const lineage = BOOKS[bookId]?.lineage ?? "ose";

  const registers = cookbookRegisters();
  const constants = await currentScgConstants();
  const bounds = moraleBoundsFromSchema();
  const importArt = art ? cookbookArtImporter() : null;

  const ids = Object.keys(cb.entries).filter((id) => cb.entries[id].kind === "kind.oseMonster");
  const bar = progressBar(loc("ose.bookImporting", { book: BOOKS[bookId]?.label ?? bookId }), ids.length);
  // One page cache for the whole book: a bestiary puts several creatures on a
  // page and re-rendering it per entry is the expensive half of the run.
  const pageCache = new Map();

  let made = 0;
  let refused = 0;
  for (const id of ids) {
    const entry = cb.entries[id];
    bar.step(entry.name ?? id);
    const res = await executeEntry(doc, cb, registers, id, { pageCache });
    // `ok` is the heading anchor. A printing that moved the text fails here
    // rather than importing whatever creature now occupies the box.
    if (!res?.ok || !res.fields?.block) {
      refused++;
      continue;
    }
    const parsed = parseOseStatline(res.fields.block, profile);
    const data = oseActorDataFromFields({
      name: entry.name,
      fields: parsed.fields,
      extra: parsed.extra,
      dialect: parsed.dialect,
      raw: res.fields.block,
      source: { id: bookId, label: BOOKS[bookId]?.label ?? bookId, lineage },
      page: entry.pages?.[0] ?? null,
      box: entry.fields?.block?.box ?? null,
      origin: "page",
      lineage,
      constants,
      moraleBounds: bounds,
      folderId,
    });
    // The description is a lazy tag, exactly as the ACKS books do it — the
    // prose is read from the reader's own copy when the sheet asks for it.
    data.system.details = {
      ...(data.system.details ?? {}),
      biography: `<p>@PdfText[${id}]{${entry.cite || `${BOOKS[bookId]?.short ?? bookId} p.${entry.pages?.[0] ?? "?"}`}}</p>`,
    };

    const actor = await createDoc(Actor, data);
    if (!actor) continue;
    made++;
    if (importArt && entry.fields?.art) {
      await importArt(actor, doc, {
        id,
        page: entry.fields.art.page ?? entry.pages?.[0],
        name: entry.fields.art.name ?? null,
        box: entry.fields.art.box ?? null,
      });
    }
  }
  bar.finish();
  ui.notifications.info(
    `${MODULE_ID} | ${loc(constants ? "ose.bookDone" : "ose.bookDoneUnconverted", {
      n: made,
      book: BOOKS[bookId]?.label ?? bookId,
    })}${refused ? ` ${loc("ose.bookRefused", { n: refused })}` : ""}`,
  );
  return made;
}
