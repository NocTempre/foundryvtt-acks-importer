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
import { isRangedCreature, oseTemplateDataFromFields, oseTemplateFromGroup } from "./ose-template.mjs";
import { oseLocationData, oseAdventureData } from "./ose-location.mjs";
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
    const areas = Object.values(cb.entries).filter((e) => e.kind === "kind.oseLocation");
    if (creatures.length || areas.length) {
      out.push({ id, label: BOOKS[id].label, count: creatures.length, areas: areas.length, open: !!cookbookSessionDoc(id) });
    }
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
  let templates = 0;
  /** Entries that are steps of one creature, gathered by their group key. */
  const groups = {};
  // Where the entry says it came from, for the lazy prose tag.
  const citeOf = (e) => e.cite || `${BOOKS[bookId]?.short ?? bookId} p.${e.pages?.[0] ?? "?"}`;
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
    // One step of a creature the book prints a block per step for. Held back,
    // and built as a single generator once every step has been read.
    if (entry.meta?.templateGroup) {
      const g = (groups[entry.meta.templateGroup] ??= {
        name: entry.meta.templateName ?? entry.name,
        axisKey: entry.meta.templateAxis ?? "level",
        members: [],
      });
      g.members.push({
        key: entry.meta.templateKey ?? String(g.members.length + 1),
        label: entry.meta.templateLabel ?? entry.name,
        fields: parsed.fields,
        raw: res.fields.block,
        page: entry.pages?.[0] ?? null,
        box: entry.fields?.block?.box ?? null,
        entryId: id,
      });
      continue;
    }
    // A block that prints a RANGE of hit dice is not one creature. It becomes a
    // generator actor whose axis carries the printed figures, rather than a
    // single monster frozen at the bottom of its own range.
    if (isRangedCreature(parsed.fields)) {
      const tpl = oseTemplateDataFromFields({
        name: entry.name,
        fields: parsed.fields,
        extra: parsed.extra,
        raw: res.fields.block,
        source: { id: bookId, label: BOOKS[bookId]?.label ?? bookId, lineage },
        page: entry.pages?.[0] ?? null,
        box: entry.fields?.block?.box ?? null,
        lineage,
        constants,
        moraleBounds: bounds,
        folderId,
        cite: entry.cite ?? "",
      });
      tpl.system.details = { biography: `<p>@PdfText[${id}]{${citeOf(entry)}}</p>` };
      const generator = await createDoc(Actor, tpl);
      if (generator) {
        templates++;
        if (importArt && entry.fields?.art) {
          await importArt(generator, doc, {
            id,
            page: entry.fields.art.page ?? entry.pages?.[0],
            name: entry.fields.art.name ?? null,
            box: entry.fields.art.box ?? null,
          });
        }
      }
      continue;
    }
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
      biography: `<p>@PdfText[${id}]{${citeOf(entry)}}</p>`,
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
  // Each gathered group is one generator. Its options are complete printed
  // blocks, so this converts nothing the single-creature path would not.
  for (const g of Object.values(groups)) {
    if (!g.members.length) continue;
    g.members.sort((a, b) => Number(a.key) - Number(b.key) || String(a.key).localeCompare(String(b.key)));
    const made2 = await createDoc(
      Actor,
      oseTemplateFromGroup({
        name: g.name,
        axisKey: g.axisKey,
        axisLabel: g.axisKey === "level" ? "Level" : g.axisKey,
        members: g.members,
        source: { id: bookId, label: BOOKS[bookId]?.label ?? bookId, lineage },
        lineage,
        constants,
        moraleBounds: bounds,
        folderId,
      }),
    );
    if (made2) templates++;
  }

  bar.finish();
  ui.notifications.info(
    `${MODULE_ID} | ${loc(constants ? "ose.bookDone" : "ose.bookDoneUnconverted", {
      n: made,
      book: BOOKS[bookId]?.label ?? bookId,
    })}${templates ? ` ${loc("ose.bookTemplates", { n: templates })}` : ""}${refused ? ` ${loc("ose.bookRefused", { n: refused })}` : ""}`,
  );
  return made + templates;
}

/**
 * Import an authored adventure's KEYED AREAS as places.
 *
 * The adventure becomes a location of its own and the rooms nest inside it, so
 * a keyed dungeon arrives as a dungeon rather than as seventeen unrelated
 * actors sharing a numbering convention. Each room's text is a lazy tag, read
 * from the reader's copy when the sheet asks — the same contract the creatures
 * and the ACKS books use.
 *
 * @param bookId  an authored book id whose PDF this seat has connected
 * @param opts.folderId  where the places land
 */
export async function importOseAreas(bookId, { folderId = null } = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn(`${MODULE_ID} | GM only (creates documents).`);
    return 0;
  }
  const cb = cookbookBookFile(bookId);
  if (!cb?.entries) return ui.notifications.warn(`${MODULE_ID} | ${loc("ose.bookNoCookbook", { book: bookId })}`), 0;

  const label = BOOKS[bookId]?.label ?? bookId;
  const short = BOOKS[bookId]?.short ?? bookId;
  const ids = Object.keys(cb.entries).filter((id) => cb.entries[id].kind === "kind.oseLocation");
  // Asked BEFORE the book is required. An adventure that ships no keyed areas
  // needs no PDF to say so, and answering "connect your book first" to a
  // question the cookbook already settles sends a Judge to find a file that
  // would not have changed the answer.
  if (!ids.length) return ui.notifications.info(`${MODULE_ID} | ${loc("ose.areasNone", { book: label })}`), 0;

  const doc = cookbookSessionDoc(bookId);
  if (!doc) return ui.notifications.warn(`${MODULE_ID} | ${loc("ose.bookNotConnected", { book: label })}`), 0;
  const registers = cookbookRegisters();

  // The adventure first, so every room has something to sit inside.
  const adventure = await createDoc(Actor, oseAdventureData({ book: bookId, bookLabel: label, folderId }));
  const bar = progressBar(loc("ose.areasImporting", { book: label }), ids.length);
  const pageCache = new Map();

  let made = 0;
  let refused = 0;
  for (const id of ids) {
    const entry = cb.entries[id];
    bar.step(entry.name ?? id);
    // The anchor proves the heading still titles this room. A printing that
    // moved the text fails here rather than importing whatever now occupies
    // those coordinates.
    const res = await executeEntry(doc, cb, registers, id, { pageCache });
    if (!res?.ok) {
      refused++;
      continue;
    }
    const place = await createDoc(
      Actor,
      oseLocationData({
        name: entry.name,
        entryId: id,
        cite: entry.cite || `${short} p.${entry.pages?.[0] ?? "?"}`,
        page: entry.pages?.[0] ?? null,
        book: bookId,
        bookLabel: label,
        areaKey: entry.meta?.areaKey ?? "",
        parentUuid: adventure?.uuid ?? "",
        folderId,
      }),
    );
    if (place) made++;
  }
  bar.finish();
  ui.notifications.info(
    `${MODULE_ID} | ${loc("ose.areasDone", { n: made, book: label })}${refused ? ` ${loc("ose.bookRefused", { n: refused })}` : ""}`,
  );
  return made;
}
