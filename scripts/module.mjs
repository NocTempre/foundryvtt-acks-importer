/**
 * acks-importer — bring-your-own-book content streamer (PoC).
 *
 * POSSESSION MODEL: what persists across sessions is the LOCATION of each
 * seat's book (in IndexedDB, per seat) — never the prose. Every session
 * re-reads descriptions from the actual file; lose the file, lose the prose
 * (stubs + citations remain). Mechanical data (stats, attacks, spoils) is
 * imported into world documents and persists like hand-entered data.
 *
 * Persisted documents carry only @PdfText[recipe-id]{citation} tags, resolved
 * per viewing seat at render time from that seat's in-memory extraction.
 * A location is a file handle, a fetchable path, or — where the browser allows
 * neither — the remembered NAME of the file, which the join-time reconnect
 * dialog offers back with a picker beside it. Same enforcement throughout;
 * only the number of clicks changes.
 *
 * PoC api (globalThis.acksImporter / game.modules.get("acks-importer").api):
 *   connectBook()    pick books + local PDFs, or the folder holding them
 *   reconnectBooks() retry the silent reopen, then the Books dialog
 *   bookStatus()     the same Books dialog: every book's state + controls
 *   browseAndLoad()  GM: pick a page, choose headings, load actors/items
 *   applyStats()     fill monster actors from the connected book
 *   forgetBooks()    drop remembered locations + this session's prose
 */
import { MODULE_ID, LANG_PREFIX, ACTOR_TYPE } from "./constants.mjs";
import { BOOKS, fingerprintWarning, identifyBook } from "./books.mjs";
import { matchFilesToBooks, pairPicks } from "./book-match.mjs";
import { RECIPES, recipeById } from "./recipes.mjs";
import { openBook, pageItems, extractRecipe, extractDisplay, extractRunin, extractSpoils, extractPageArt, extractPageArtRegion, listHeadings, setWorker, setWasmUrl } from "./extract.mjs";
import { extractStatPairs } from "./stats.mjs";
import { mapPairs } from "./stats-map.mjs";
import { createDocFor } from "./poc.mjs";
import { importTables, tableRecipeCount } from "./tables-binding.mjs";
import { applyBuilderImport } from "./builder-binding.mjs";
import { applyLanguageImport, LANGUAGES_DOC_ID } from "./language-binding.mjs";
import { progressBar } from "./progress.mjs";
import {
  initCookbook, loadCookbook, cookbookImport, cookbookImportIds, cookbookImportMonsters, cookbookRemoveImports, cookbookImportAbilities, cookbookImportAbilitiesDialog, cookbookUpdateAbilities,
  cookbookFillCompanions, cookbookPruneAbilities, registerAbilityDirectoryButtons, importAbility, cookbookDebug, cookbookStub,
  cookbookCanReveal, cookbookProse, cookbookCount, refillMonster, resolveAbilities,
  importEquipment, importAllEquipment, cookbookEquipmentIds, repairEquipmentAbilities,
  importWeapons, importArmor, forgetImportedIndex,
  importClasses, cookbookUpdateClasses, importTemplatePackages, importTraps, importVariations, importVehicles,
  cookbookImportJournals, cookbookImportRollTables, cookbookOrganize,
} from "./cookbook.mjs";
import { registerGettingStartedSettings, showGettingStarted } from "./getting-started.mjs";
import { registerOseSourceSetting } from "./ose-source.mjs";
import { registerOseSourceDialog, oseBrowseDialog, oseCalibrateDialog, oseConvertAll } from "./ose-app.mjs";
import { oseManualDialog } from "./ose-manual.mjs";
import { importOseBook, importOseAreas, authoredOseBooks } from "./ose-book.mjs";

const SETTING_DYNAMIC = "dynamicRecipes";
const SETTING_REFRESH_CACHE = "refreshCacheSeconds";
const LEGACY_KEYS = ["acks-importer.proseCache", "acks-importer.contentCache"]; // pre-possession-model storage

/** Open PDFs this session: bookId -> { doc, title }. Memory only. */
const sessionDocs = new Map();
/** Extracted prose this session: bookId -> { recipeId: prose }. Memory only, by design. */
const proseMem = new Map();

/* -------------------------------------------- */
/*  Remembered book locations (IndexedDB)       */
/* -------------------------------------------- */

/**
 * Where each book lives ON THIS SEAT, so the next session can offer to reopen
 * it. The LOCATION persists; the book's text still never does.
 *
 * Three kinds, because the three ways a seat can reach its own PDF have three
 * different reconnect stories:
 *
 *   handle  a FileSystemFileHandle (Chromium on a secure origin). Reopens
 *           itself after the one permission click browsers insist on per page
 *           load — the original, and still the best case.
 *   url     a path this seat can fetch (a copy staged on the host). The only
 *           kind that reconnects with NO gesture at all.
 *   file    the IDENTITY of a file picked through <input type="file"> — name,
 *           size, mtime. No browser will reopen that from storage, so this is
 *           a reminder rather than a location: on join we can name the exact
 *           file and put a picker in front of it, which is the difference
 *           between "reconnect Monstrous Manual.pdf?" and a seat that starts
 *           blank and silent every session.
 *
 * `file` is not a nicety: the File System Access API is absent on any insecure
 * origin, so a GM joining over plain http on the LAN — or anyone on Firefox —
 * had nothing remembered at all.
 */
const IDB_STORE = "bookHandles"; // store name predates the record shape; renaming it would strand every already-remembered book
const IDB_BYTES = "bookBytes"; // refresh bridge only — swept on every join, see below
const IDB_META = "bookMeta"; // the bridge's freshness stamp, kept out of the byte store so the heartbeat is cheap
const IDB_VERSION = 2;
const TOUCH_KEY = "touched";

function idb() {
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open("acks-extras", IDB_VERSION);
    rq.onupgradeneeded = () => {
      const db = rq.result;
      // Additive, and each store guarded: this runs for a fresh seat AND for
      // one upgrading from v1, where bookHandles already exists and must
      // survive untouched — its records are the whole point of the store.
      for (const name of [IDB_STORE, IDB_BYTES, IDB_META]) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      }
    };
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
}

async function idbOp(mode, fn, store = IDB_STORE) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const rq = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(rq?.result);
    tx.onerror = () => reject(tx.error);
  });
}

const locationPut = (bookId, record) => idbOp("readwrite", (s) => s.put(record, bookId));
const locationClear = () => idbOp("readwrite", (s) => s.clear());

/** The record kinds this module writes. Anything else is not ours to read. */
const LOCATION_KINDS = new Set(["handle", "url", "file"]);

/**
 * Records written before the shape existed are the bare handle itself. Read
 * them as the handle they are rather than discarding them — a seat that has
 * had its book remembered for weeks must not lose it to an upgrade.
 *
 * The handle is identified by BEHAVIOUR, and before anything else, because
 * `FileSystemHandle.kind` is a real property whose value is the string "file"
 * — the same word this module uses for a record it cannot reopen. Trusting
 * `kind` first read every legacy handle as "re-pick this by hand", which is
 * precisely the regression the migration exists to prevent.
 */
function asLocation(value) {
  if (!value) return null;
  if (typeof value.getFile === "function") return { kind: "handle", handle: value, name: value.name ?? null };
  return LOCATION_KINDS.has(value.kind) ? value : null;
}

/** Every remembered location on this seat, bookId → record. */
async function locations() {
  let keys = [];
  let values = [];
  try {
    const db = await idb();
    [keys, values] = await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      // One transaction for both, so the two arrays are guaranteed to line up.
      const k = store.getAllKeys();
      const v = store.getAll();
      tx.oncomplete = () => resolve([k.result ?? [], v.result ?? []]);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`${MODULE_ID} | could not read remembered book locations (IndexedDB)`, err);
    return new Map();
  }
  const out = new Map();
  keys.forEach((key, i) => {
    if (key === DIR_KEY) return; // the remembered folder is not a book record
    const record = asLocation(values[i]);
    if (!record) return;
    // A book this build no longer reads (the Judge's Screen inserts, whose
    // tables moved into the JJ and RR in 0.38.0) must not be offered for
    // reconnect: there is nothing left for it to unlock, and every downstream
    // caller would have to defend itself against a book id with no entry in
    // BOOKS. The record is left in place rather than deleted — harmless, and a
    // withdrawn book that ever comes back finds its location still remembered.
    if (!BOOKS[key]) {
      console.log(`${MODULE_ID} | remembered location for "${key}" ignored — this build no longer reads that book.`);
      return;
    }
    out.set(key, record);
  });
  return out;
}

/** What to call a remembered location in front of a reader. */
const describeLocation = (record) =>
  record?.kind === "url" ? record.url : (record?.name ?? game.i18n.localize(`${LANG_PREFIX}.ui.locationUnnamed`));

/** Remember a file picked through the plain input: name only, and say so. */
const rememberFile = (bookId, file) =>
  locationPut(bookId, { kind: "file", name: file.name, size: file.size, lastModified: file.lastModified }).catch((err) =>
    console.warn(`${MODULE_ID} | could not remember ${file.name}`, err),
  );

/**
 * The remembered PARENT FOLDER, under a reserved key in the same store — not a
 * book record, and never surfaced as one. A seat that connected by pointing at
 * the folder holding its PDFs gets the whole shelf back in ONE permission
 * gesture next session: the directory handle re-grants once and every book
 * inside re-reads from it, where per-file handles cost one gesture each.
 * Forget Books clears it with everything else (locationClear sweeps the store).
 */
const DIR_KEY = "__folder__";
const dirPut = (handle) =>
  idbOp("readwrite", (s) => s.put({ kind: "dir", handle, name: handle.name ?? null }, DIR_KEY)).catch((err) =>
    console.warn(`${MODULE_ID} | could not remember the folder`, err),
  );
async function dirGet() {
  const record = await idbOp("readonly", (s) => s.get(DIR_KEY)).catch(() => null);
  return record?.kind === "dir" && record.handle ? record : null;
}

/* -------------------------------------------- */
/*  Refresh bridge (short-lived byte cache)     */
/* -------------------------------------------- */

/**
 * A Foundry client reloads constantly — a module toggled, a macro saved, a
 * dropped connection — and on an insecure origin (any remote seat on plain
 * http, and every Firefox seat) each of those reloads used to cost the reader
 * a fresh trip through the file picker for every book they own. The location
 * was remembered; the FILE could not be reopened from it, because no browser
 * hands a picked file back from storage and the File System Access API that
 * would is absent outside a secure context.
 *
 * So the bytes are bridged across the reload, and ONLY across the reload:
 *
 *   • while a page with books open is alive it stamps the clock every 20s, and
 *     once more as it goes away;
 *   • the next page load compares that stamp against the moment IT started.
 *     Inside the window (60s by default) the cached bytes are reopened with no
 *     gesture at all — that is a refresh;
 *   • outside it, the bytes are deleted before anything else happens, and the
 *     seat goes through the normal reconnect gesture — that is a new session.
 *
 * Two details are load-bearing, and the first release of this got both wrong:
 *
 *   The stamp lives in localStorage, not IndexedDB, because it is written from
 *   `pagehide` and an async IndexedDB transaction started there NEVER COMMITS —
 *   the page is torn down first. localStorage.setItem is synchronous and lands.
 *   With the async write silently lost, the freshest stamp was whatever the 20s
 *   heartbeat had last managed, which quietly ate a third of the window.
 *
 *   The comparison is against `performance.timeOrigin` — when this document
 *   started — and NOT against the time this code happens to run. Foundry takes
 *   20-45s to reach `ready` on a real world, so measuring at `ready` charged
 *   the reader's window for the boot they were sitting through, and a 60s
 *   window bought perhaps fifteen. The question the window has to answer is
 *   "how long was this seat away?", which is exactly timeOrigin minus stamp.
 *
 * This is deliberately NOT a copy of the book. It cannot outlive the window,
 * closing the tab for a minute empties it, and Forget Books empties it now.
 * The possession model is unchanged: a seat still cannot read a book it has
 * not opened from its own file this session, and the prose still never
 * persists anywhere.
 */
const CACHE_HEARTBEAT_MS = 20_000;
const STAMP_KEY = "acks-importer.bridgeTouched";
/** How far ahead of this document a stamp may sit before it means clock drift. */
const CLOCK_TOLERANCE_MS = 5_000;

/** Configured bridge window in ms; 0 (or an unregistered setting) disables it. */
function cacheWindowMs() {
  try {
    return Math.max(0, Number(game.settings.get(MODULE_ID, SETTING_REFRESH_CACHE)) || 0) * 1000;
  } catch {
    return 0; // called before init registered it — treat as off rather than throw
  }
}

const bytesPut = (bookId, blob) => idbOp("readwrite", (s) => s.put(blob, bookId), IDB_BYTES);
const bytesGet = (bookId) => idbOp("readonly", (s) => s.get(bookId), IDB_BYTES);
const bytesClear = () => idbOp("readwrite", (s) => s.clear(), IDB_BYTES);
/**
 * The stamp. Synchronous on purpose — see the note above about `pagehide`.
 * A profile with storage blocked throws on access rather than returning null,
 * and a bridge that cannot stamp simply never hits.
 */
function stampGet() {
  try {
    return Number(localStorage.getItem(STAMP_KEY)) || 0;
  } catch {
    return 0;
  }
}
function stampPut(at) {
  try {
    localStorage.setItem(STAMP_KEY, String(at));
  } catch {
    /* storage blocked or full: the bridge just misses */
  }
}
function stampClear() {
  try {
    localStorage.removeItem(STAMP_KEY);
  } catch {
    /* nothing to do */
  }
  // The 0.61.0 stamp lived here and could not survive pagehide. Clear it so an
  // upgrading seat is not carrying a dead record around forever.
  return idbOp("readwrite", (s) => s.clear(), IDB_META).catch((err) =>
    console.debug(`${MODULE_ID} | refresh-bridge stamp store could not be cleared`, err),
  );
}

/**
 * Stash the bytes this seat just read, so a reload inside the window is free.
 *
 * Takes the File/Blob the caller already holds rather than the ArrayBuffer it
 * passed to the reader: pdf.js takes ownership of that buffer and transfers it
 * to its worker, so by the time a book is open the array is detached and there
 * is nothing left to store. A File also costs no copy on Chromium — IndexedDB
 * keeps a reference to the file already on disk.
 */
async function cacheBytes(bookId, blob) {
  if (!blob || !cacheWindowMs()) return;
  try {
    await bytesPut(bookId, blob);
    stampPut(Date.now());
  } catch (err) {
    // Over quota, private mode, a locked-down profile — the bridge is a
    // convenience and must never take an opened book down with it.
    console.warn(`${MODULE_ID} | refresh bridge unavailable for ${bookId} (books still open this session)`, err);
  }
}

/**
 * Reopen from the bridge. Returns whether it hit — a miss is the ordinary case
 * (a genuinely new session) and says nothing.
 */
async function openCached(bookId) {
  if (!cacheWindowMs()) return false;
  let blob = null;
  try {
    blob = await bytesGet(bookId);
  } catch (err) {
    console.warn(`${MODULE_ID} | could not read the refresh bridge for ${bookId}`, err);
    return false;
  }
  if (!blob) return false;
  try {
    // Re-stash: the buffer below is about to be detached, and a seat that
    // refreshes twice in a row should be bridged both times.
    await ingestBook(bookId, await blob.arrayBuffer(), { silent: true, cache: blob });
    console.log(`${MODULE_ID} | ${BOOKS[bookId]?.label ?? bookId} restored across a page reload — no gesture needed.`);
    return true;
  } catch (err) {
    // The file moved out from under a stored reference, or the blob is gone.
    console.warn(`${MODULE_ID} | refresh bridge for ${bookId} could not be read — falling back to the remembered location`, err);
    return false;
  }
}

/**
 * Drop the bridge unless the last page died inside the window. Runs before
 * anything else on join, so a real session gap can never read stale bytes.
 */
async function sweepCache() {
  const windowMs = cacheWindowMs();
  const stamp = stampGet();
  // How long the seat was AWAY: from the old page going quiet to this document
  // starting. Explicitly not "until now" — `now` is after Foundry's whole boot,
  // which the reader should not be charged for.
  const away = performance.timeOrigin - stamp;
  // A reload records the INCOMING document's timeOrigin before the outgoing
  // page is given `pagehide`, so the gap on an ordinary refresh is a few
  // milliseconds NEGATIVE. Requiring it to be positive rejected every single
  // refresh — the exact thing the bridge exists for. Only a stamp implausibly
  // far ahead means the clock actually moved, and that one is not trustworthy.
  const skewed = away < -CLOCK_TOLERANCE_MS;
  if (windowMs && stamp && !skewed && away <= windowMs) {
    console.log(
      `${MODULE_ID} | page was away ${Math.max(0, away / 1000).toFixed(1)}s (window ${windowMs / 1000}s) — books open at the time are restored without a gesture.`,
    );
    return true;
  }
  if (stamp) {
    console.log(
      `${MODULE_ID} | refresh bridge expired — page was away ${(away / 1000).toFixed(1)}s, window is ${windowMs / 1000}s${skewed ? " (stamp is in the future — clock changed?)" : ""}. Books come back through the reconnect dialog.`,
    );
  }
  await bytesClear().catch((err) =>
    console.debug(`${MODULE_ID} | expired refresh-bridge bytes could not be cleared`, err),
  );
  await stampClear();
  return false;
}

let heartbeat = null;

/**
 * Keep the stamp current while this page is alive and books are open. Without
 * it the window would be measured from the moment a book was connected, so a
 * seat that had played for an hour would find its bridge expired on the very
 * reload it exists to cover.
 */
function startCacheHeartbeat() {
  if (heartbeat) return;
  const touch = () => {
    if (!sessionDocs.size || !cacheWindowMs()) return;
    stampPut(Date.now());
  };
  heartbeat = setInterval(touch, CACHE_HEARTBEAT_MS);
  // pagehide fires on reload, navigation and tab close alike — and unlike
  // unload it also fires when the page goes into the back/forward cache. The
  // write inside it must be synchronous; see the note above.
  window.addEventListener("pagehide", touch);
  // pagehide is not guaranteed on mobile, where a backgrounded tab can be
  // discarded outright; hidden is the last moment such a page is certain to
  // get. Both are cheap and idempotent.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") touch();
  });
  touch();
}

/* -------------------------------------------- */
/*  Recipe resolution (static + dynamic)        */
/* -------------------------------------------- */

const dynamicRecipes = () => game.settings.get(MODULE_ID, SETTING_DYNAMIC) ?? {};
const resolveRecipe = (id) => recipeById(id) ?? dynamicRecipes()[id] ?? null;
const allRecipes = () => [...RECIPES, ...Object.values(dynamicRecipes())];
const recipesForBookAll = (bookId) => allRecipes().filter((r) => r.book === bookId);
const tagHtmlFor = (recipe) => `<p>@PdfText[${recipe.id}]{${recipe.cite}}</p>`;

function stubFor(recipe) {
  if (!recipe.dynamic) return game.i18n.localize(`${LANG_PREFIX}.pdftext.${recipe.id}`);
  return game.i18n.format(`${LANG_PREFIX}.ui.dynamicStub`, {
    name: recipe.name,
    book: BOOKS[recipe.book]?.label ?? recipe.book,
    page: recipe.page,
  });
}

function proseFor(recipeId) {
  const recipe = resolveRecipe(recipeId);
  if (!recipe) return null;
  return proseMem.get(recipe.book)?.[recipeId] ?? null;
}

/* -------------------------------------------- */
/*  Connect / restore books                     */
/* -------------------------------------------- */

/**
 * Re-render open sheets that show a @PdfText tag.
 *
 * The enricher decides AT RENDER TIME whether this seat can reveal the text, so
 * a sheet drawn before the book was connected keeps its "connect your PDF on
 * this seat" stub — and no reveal link — for as long as it stays open. The
 * message then tells the reader to do the thing they have just done. Only apps
 * actually showing a tag are touched; this fires on connect, not per frame.
 */
function rerenderPdfTextApps() {
  const open = [...(foundry.applications?.instances?.values?.() ?? []), ...Object.values(ui.windows ?? {})];
  let n = 0;
  for (const app of open) {
    const el = app?.element instanceof HTMLElement ? app.element : app?.element?.[0];
    if (!el?.querySelector?.(".acks-importer-pdftext")) continue;
    try {
      app.render();
      n++;
    } catch (err) {
      console.warn(`${MODULE_ID} | could not re-render ${app?.constructor?.name ?? "an open sheet"}`, err);
    }
  }
  return n;
}

/**
 * Programmatic connect: read a PDF from a URL this seat can fetch (a file the
 * GM staged under the Foundry data dir, or any served path). The interactive
 * connectBook() stays the normal path; this one serves hosted copies and
 * automated live tests.
 *
 * The prose is session memory as always — what persists is the PATH, so the
 * seat reconnects itself on every future join. Pass `{ remember: false }` for
 * a one-off read that should leave nothing behind.
 */
async function connectBookUrl(bookId, url, { remember = true } = {}) {
  if (!BOOKS[bookId]) return ui.notifications.warn(`acks-importer | unknown book id "${bookId}".`);
  const resp = await fetch(url);
  if (!resp.ok) return ui.notifications.warn(`acks-importer | could not read ${url} (${resp.status}).`);
  // Blob first, buffer from it: pdf.js detaches the array it is handed, and a
  // re-download of a whole book is exactly what the refresh bridge saves.
  const blob = await resp.blob();
  const hits = await ingestBook(bookId, await blob.arrayBuffer(), { cache: blob });
  // A path IS a location, and the one kind that needs no gesture to reopen, so
  // a seat pointed at a staged copy reconnects itself on every future join.
  if (remember) {
    await locationPut(bookId, { kind: "url", url, name: url.split("/").pop() || url }).catch((err) =>
      console.warn(`${MODULE_ID} | could not remember ${url}`, err),
    );
  }
  return hits;
}

/**
 * Read a book into this session.
 *
 * `cache` is the File/Blob the caller read `buffer` from, when it still holds
 * one. It is bridged across page reloads (see the refresh bridge above) and is
 * never a substitute for the file itself.
 */
async function ingestBook(bookId, buffer, { silent = false, cache = null } = {}) {
  const recipes = recipesForBookAll(bookId);
  // Opening a book is the one wait every seat pays, restore included: pdf.js
  // parses the whole file, then each shipped recipe is extracted from it.
  const bar = progressBar(game.i18n.format(`${LANG_PREFIX}.ui.progressReading`, { book: BOOKS[bookId]?.label ?? bookId }), recipes.length);
  try {
    bar.note(game.i18n.localize(`${LANG_PREFIX}.ui.progressOpening`));
    const { doc, numPages, title } = await openBook(buffer);
    // A file that fingerprints as ANOTHER book in the registry is never read
    // into this one. Every recipe this build extracts is a page number, so a
    // book filled from the wrong PDF imports the wrong page's content under the
    // right name, and nothing downstream can tell. Refusing costs a reader one
    // message; proceeding costs them an import they have to find and undo.
    // Edition drift stays a warning — see identifyBook.
    const actualId = identifyBook(numPages, title);
    if (actualId && actualId !== bookId) {
      await doc.destroy?.();
      const err = new Error(
        game.i18n.format(`${LANG_PREFIX}.ui.connectWrongBook`, {
          book: BOOKS[bookId]?.label ?? bookId,
          actual: BOOKS[actualId].label,
        }),
      );
      err.wrongBook = actualId;
      throw err;
    }
    const warning = fingerprintWarning(bookId, numPages, title);
    if (warning && !silent) ui.notifications.warn(`acks-importer | ${warning}`);
    sessionDocs.set(bookId, { doc, title });
    const entries = proseMem.get(bookId) ?? {};
    for (const recipe of recipes) {
      const prose = await extractRecipe(doc, recipe).catch(() => null);
      if (prose) entries[recipe.id] = prose;
      bar.step(recipe.name ?? recipe.id);
    }
    proseMem.set(bookId, entries);
    // Only once the book actually opened: a file that failed the read is not
    // worth bridging, and bridging it would keep re-failing every reload.
    await cacheBytes(bookId, cache);
    const hits = Object.keys(entries).length;
    // Anything already on screen still says "connect your book" until it is drawn
    // again — the tag resolves per render, not per document.
    const redrawn = rerenderPdfTextApps();
    const message = `acks-importer | ${BOOKS[bookId]?.label ?? bookId}: open — ${hits}/${recipes.length} descriptions readable this session (in memory only; never stored).`;
    if (silent) console.log(message);
    else ui.notifications.info(message);
    if (redrawn) console.log(`${MODULE_ID} | re-rendered ${redrawn} open sheet(s) so their page references resolve.`);
    return hits;
  } finally {
    bar.finish();
  }
}

/**
 * Import ACKS rules TABLES (availability, wages, rarity, …) from the connected
 * books into the world, via the acks-lib ruledata-import contract. GM-only
 * (it writes world data). Sibling modules (acks-henchmen) read the result from
 * acksLib.tables; markets, wages and hiring light up as coverage grows.
 */
async function cookbookImportTables() {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize(`${LANG_PREFIX}.tables.gmOnly`));
    return null;
  }
  if (!globalThis.acksExtras?.lib?.services?.get?.("ruledata-import")) {
    ui.notifications.error(game.i18n.localize(`${LANG_PREFIX}.tables.noProvider`));
    return null;
  }
  let report;
  const bar = progressBar(game.i18n.localize(`${LANG_PREFIX}.ui.progressTables`), tableRecipeCount());
  try {
    report = await importTables(sessionDocs, { onProgress: (name) => bar.step(name) });
  } catch (err) {
    ui.notifications.error(`acks-importer | ${err.message}`);
    return null;
  } finally {
    bar.finish();
  }
  const nTables = report.imported.reduce((s, d) => s + d.tables.length, 0);
  if (nTables) {
    ui.notifications.info(
      game.i18n.format(`${LANG_PREFIX}.tables.imported`, {
        tables: nTables,
        docs: report.imported.map((d) => d.docId).join(", "),
      }),
    );
  }
  if (report.missingBooks.length) {
    ui.notifications.warn(
      game.i18n.format(`${LANG_PREFIX}.tables.missingBooks`, { books: report.missingBooks.join(", ") }),
    );
  }
  // The class-builder tables carry world writes of their own: the assembled
  // engine-shaped doc, race Items, and builder state on the imported classes.
  if (report.imported.some((d) => d.docId === "acks.classBuilder")) {
    try {
      const built = await applyBuilderImport();
      if (built.races.length || built.builds.length) {
        ui.notifications.info(
          game.i18n.format(`${LANG_PREFIX}.tables.builderApplied`, {
            races: built.races.length,
            builds: built.builds.length,
          }),
        );
      }
      console.log(`${MODULE_ID} | class-builder binding`, built);
    } catch (err) {
      console.error(`${MODULE_ID} | class-builder binding failed`, err);
      ui.notifications.warn(`acks-importer | class builder: ${err.message}`);
    }
  }
  // The taxonomy is read, not shipped, so the items exist only once a seat has
  // imported it from their own book.
  if (report.imported.some((d) => d.docId === LANGUAGES_DOC_ID)) {
    try {
      const lib = globalThis.acksExtras?.lib;
      const table = lib?.tables?.getDoc?.(LANGUAGES_DOC_ID)?.tables?.tree;
      const made = table ? await applyLanguageImport(table) : { created: 0, present: 0, adopted: 0, retyped: 0 };
      // Adoptions and retypes are work the seat should hear about too: a run
      // that creates nothing — because every tongue was already there under a
      // Judge's own name, or was minted as an ability by an older version —
      // has still changed the world.
      const landed = made.created + made.adopted + made.retyped;
      if (landed) {
        ui.notifications.info(game.i18n.format(`${LANG_PREFIX}.tables.languagesApplied`, { created: landed }));
      }
      console.log(`${MODULE_ID} | language binding`, made);
    } catch (err) {
      console.error(`${MODULE_ID} | language binding failed`, err);
      ui.notifications.warn(`acks-importer | languages: ${err.message}`);
    }
  }
  console.log(`${MODULE_ID} | table import`, report);
  return report;
}

const fsaAvailable = () => typeof window.showOpenFilePicker === "function";

/* -------------------------------------------- */
/*  Dialog markup                               */
/* -------------------------------------------- */

/**
 * Hand DialogV2 markup it will not rewrite.
 *
 * A STRING `content` goes through `foundry.utils.cleanHTML`, which rebuilds
 * every element and copies only allowlisted attributes: `accept` is on no list
 * at all, and `multiple` is allowed on `<select>` but NOT on `<input>`. A
 * multi-file picker therefore arrives as a single-file one, and every branch
 * behind it becomes unreachable — silently, since the markup is never wrong,
 * only rewritten. An attribute-less `<div>` is treated as trusted and its
 * innerHTML used verbatim (DialogV2 rejects any other tag, and rejects the div
 * if it carries a single attribute).
 *
 * Every DialogV2 in this module is built through here, whether or not its
 * current markup happens to survive cleaning — otherwise the next attribute
 * added to a dialog decides for itself whether the dialog still works.
 *
 * Declared as a function rather than a const so getting-started.mjs can import
 * it across the module cycle without meeting it in its temporal dead zone.
 */
export function dialogContent(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div;
}

/* -------------------------------------------- */
/*  One dialog of a kind at a time              */
/* -------------------------------------------- */

const openDialogs = new Map();

/**
 * Reuse the dialog that is already open instead of stacking another.
 *
 * Every entry point here can be reached twice over: the Getting Started button
 * calls connectBook() on every click and nothing was stopping a second one,
 * the macro calls it too, and the reconnect pass runs both from the join hook
 * and from its own macro. Each of those opened ANOTHER identical window, so a
 * reader who clicked twice got two book pickers stacked on top of each other —
 * two dropdowns listing the same books, two chances to read the same PDF into
 * the same slot, and no way to tell which one was in front.
 *
 * The key is registered synchronously, before the dialog's content is built,
 * because the build is async (it reads remembered locations first) and two
 * fast clicks would otherwise both get past that await before either had
 * claimed the slot.
 */
function singleton(key, open) {
  const existing = openDialogs.get(key);
  if (existing) {
    existing.app?.bringToFront?.();
    return existing.promise;
  }
  const entry = { app: null };
  entry.promise = Promise.resolve(open((app) => (entry.app = app))).finally(() => openDialogs.delete(key));
  openDialogs.set(key, entry);
  return entry.promise;
}

const connectBook = () => singleton("connect", connectBookDialog);

async function connectBookDialog(capture) {
  // Say which books this seat already has, and which it merely remembers the
  // location of. Without this the list is identical before and after connecting
  // and the only way to find out is to connect again and see what happens.
  const remembered = await locations();
  const mark = (id) =>
    sessionDocs.has(id)
      ? ` — ${game.i18n.localize(`${LANG_PREFIX}.ui.connectOpen`)}`
      : remembered.has(id)
        ? ` — ${game.i18n.format(`${LANG_PREFIX}.ui.connectRemembered`, { where: describeLocation(remembered.get(id)) })}`
        : "";
  const options = Object.entries(BOOKS)
    .map(([id, b]) => `<option value="${id}">${b.label}${mark(id)}</option>`)
    .join("");
  const fsa = fsaAvailable();
  // The folder route needs no book selection at all: the folder is a group,
  // and the group self-identifies (see connectFolderPicks). It is offered on
  // every seat — as a picker button where the File System Access API exists
  // (which also remembers the folder for one-gesture reconnects), as a
  // directory input everywhere else.
  const folderRow = `
    <hr>
    <div class="form-group"><label>${game.i18n.localize(`${LANG_PREFIX}.ui.connectFolderLabel`)}</label>
      ${
        fsa
          ? `<button type="button" data-connect-folder>${game.i18n.localize(`${LANG_PREFIX}.ui.connectFolderGo`)}</button>`
          : `<input type="file" name="pdfdir" webkitdirectory>`
      }</div>
    <p class="notes">${game.i18n.localize(`${LANG_PREFIX}.ui.${fsa ? "connectFolderNote" : "connectFolderNoteFile"}`)}</p>`;
  const fileRow = fsa
    ? `<p class="notes">${game.i18n.localize(`${LANG_PREFIX}.ui.connectNoteFsa`)}</p>`
    : `<div class="form-group"><label>${game.i18n.localize(`${LANG_PREFIX}.ui.connectFile`)}</label>
         <input type="file" name="pdf" accept="application/pdf" multiple></div>
       <p class="notes">${game.i18n.localize(`${LANG_PREFIX}.ui.connectNote`)}</p>`;
  // The list is multi-select because one trip through the dialog can connect
  // several books, and the reader naming them is the only pairing that cannot
  // be wrong. `size` alone does not make it a list: core CSS pins every select
  // to one input-height row and stretches its line-height to match, so the
  // height and line-height are released here too — inline, because a squashed
  // list reads as the single-choice dropdown it used to be and the control has
  // to work whatever the stylesheet says.
  const content = `
    <div class="form-group"><label>${game.i18n.localize(`${LANG_PREFIX}.ui.connectBook`)}</label>
      <select class="acks-importer-book-select" name="book" multiple size="${Math.min(Object.keys(BOOKS).length, 6)}">${options}</select></div>
    <p class="notes">${game.i18n.localize(`${LANG_PREFIX}.ui.connectBulkNote`)}</p>
    ${fileRow}
    ${folderRow}`;
  return foundry.applications.api.DialogV2.prompt({
    // Resizable because the book list grows with the shipped book count: the
    // dialog class gives the content a scroll region, and the handle is how a
    // short screen gets more of it into view.
    window: { title: game.i18n.localize(`${LANG_PREFIX}.ui.connectTitle`), resizable: true },
    classes: ["acks-ui", "acks-importer-dialog"],
    content: dialogContent(content),
    render: (event, dialog) => {
      capture(dialog);
      const root = dialog.element ?? dialog;
      // Folder connect acts the moment it is answered, then gets the dialog
      // out of the way — the group needs no book selection, so leaving the
      // form up would only invite a second, conflicting gesture.
      root.querySelector("[data-connect-folder]")?.addEventListener("click", async () => {
        let dir;
        try {
          // First await after the click: the picker spends the gesture.
          dir = await window.showDirectoryPicker();
        } catch (err) {
          if (err?.name !== "AbortError") throw err;
          return; // dismissing the OS picker is an answer, not a failure
        }
        dialog.close();
        const handles = await pdfHandlesIn(dir);
        if (!handles.length) return ui.notifications.warn(game.i18n.localize(`${LANG_PREFIX}.ui.folderNoPdfs`));
        const picks = [];
        for (const handle of handles) picks.push({ handle, file: await handle.getFile() });
        return connectFolderPicks(picks, { remember: dir });
      });
      root.querySelector("input[name=pdfdir]")?.addEventListener("change", async (ev) => {
        const files = [...(ev.currentTarget.files ?? [])].filter((f) => /\.pdf$/i.test(f.name));
        if (!files.length) return ui.notifications.warn(game.i18n.localize(`${LANG_PREFIX}.ui.folderNoPdfs`));
        dialog.close();
        return connectFolderPicks(files.map((file) => ({ file })));
      });
    },
    ok: {
      label: game.i18n.localize(`${LANG_PREFIX}.ui.connectGo`),
      callback: async (event, button) => {
        const form = button.form;
        // Reading the form and guarding it stays synchronous, and the picker is
        // the first thing awaited: the click's transient user activation is
        // spent by any await before it, and a picker asked for afterwards never
        // opens and never says why.
        const bookIds = [...form.elements.book.selectedOptions].map((option) => option.value);
        if (!bookIds.length) return ui.notifications.warn(game.i18n.localize(`${LANG_PREFIX}.ui.connectNoBook`));
        if (fsa) {
          let handles;
          try {
            handles = await window.showOpenFilePicker({
              multiple: true,
              types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
            });
          } catch (err) {
            // Dismissing the OS picker is an answer, not a failure.
            if (err?.name !== "AbortError") throw err;
            return;
          }
          const picks = [];
          for (const handle of handles) picks.push({ handle, file: await handle.getFile() });
          return connectPicks(bookIds, picks);
        }
        const files = [...(form.elements.pdf.files ?? [])];
        if (!files.length) return ui.notifications.warn("acks-importer | no file chosen — nothing read.");
        return connectPicks(bookIds, files.map((file) => ({ file })));
      },
    },
  });
}

/**
 * Read each paired file into its book and remember where it came from.
 *
 * Each book is remembered in the strongest form this seat supports: the FSA
 * handle when the pick came through `showOpenFilePicker` (one-click reopen next
 * session), name-only otherwise — all a browser without the File System Access
 * API will let us keep, and still worth keeping, since next session says the
 * name and offers the picker instead of leaving the seat to work it out.
 *
 * Reads are sequential: several ACKS PDFs parsed at once is hundreds of
 * megabytes in flight. One file that fails to open is reported against its own
 * book and costs the others nothing, and a file refused for being another book
 * says so instead of reading as a failed read.
 *
 * @param {Map<string, File>} matched  bookId → the file that answers it
 * @param {Map<File, {file: File, handle?: FileSystemFileHandle}>} byFile  each file's pick, for its handle
 * @param {object} [options]
 * @param {boolean} [options.announce]  say where each book was remembered, one message per book
 * @returns {Promise<string[]>} labels of the books now open
 */
async function ingestPairs(matched, byFile, { announce = true } = {}) {
  const done = [];
  for (const [bookId, file] of matched) {
    const handle = byFile.get(file)?.handle ?? null;
    try {
      await ingestBook(bookId, await file.arrayBuffer(), { cache: file });
    } catch (err) {
      console.error(`${MODULE_ID} | connect ${bookId} from ${file.name}`, err);
      ui.notifications.error(
        err.wrongBook
          ? `acks-importer | ${err.message}`
          : `${BOOKS[bookId].label}: ${game.i18n.localize(`${LANG_PREFIX}.ui.reconnectFailed`)}`,
      );
      continue;
    }
    done.push(BOOKS[bookId].label);
    // Remembering is a separate outcome from reading, and reported as one: the
    // book is open either way, and saying "could not be opened" over a storage
    // failure describes a book the reader can see working.
    try {
      if (handle) {
        await locationPut(bookId, { kind: "handle", handle, name: handle.name ?? null, size: file.size });
        if (announce) ui.notifications.info(game.i18n.format(`${LANG_PREFIX}.ui.locationSaved`, { book: BOOKS[bookId].label }));
      } else {
        await rememberFile(bookId, file);
        if (announce) {
          ui.notifications.info(
            game.i18n.format(`${LANG_PREFIX}.ui.locationNameOnly`, { book: BOOKS[bookId].label, name: file.name }),
          );
        }
      }
    } catch (err) {
      console.warn(`${MODULE_ID} | ${bookId} opened but its location could not be remembered`, err);
      ui.notifications.warn(game.i18n.format(`${LANG_PREFIX}.ui.locationNotSaved`, { book: BOOKS[bookId].label }));
    }
  }
  return done;
}

/**
 * Read the picked files into the books the reader named.
 *
 * Which books is the reader's to say; WHICH FILE IS WHICH is not something the
 * dialog can ask them (see `pairPicks`), so it is worked out from the files
 * themselves. Surplus files — more PDFs than books named — go to
 * `connectSeveral`, which may only compete for the books that were NOT named;
 * a hand-named book is never re-read from a file the matcher preferred.
 *
 * @param {string[]} bookIds  the book ids the reader selected
 * @param {{file: File, handle?: FileSystemFileHandle}[]} picks  the files they picked
 */
async function connectPicks(bookIds, picks) {
  const byFile = new Map(picks.map((pick) => [pick.file, pick]));
  const { matched, unfilled, surplus } = pairPicks(bookIds, [...byFile.keys()], await locations());
  await ingestPairs(matched, byFile);
  // Fewer files than books named: say which books are still closed, or the
  // reader is left to notice for themselves that two of the three they asked
  // for never opened.
  if (unfilled.length) {
    ui.notifications.warn(
      game.i18n.format(`${LANG_PREFIX}.ui.connectUnfilled`, {
        books: unfilled.map((id) => BOOKS[id]?.label ?? id).join(", "),
      }),
    );
  }
  if (!surplus.length) return;
  const named = new Set(bookIds);
  return connectSeveral(
    surplus.map((file) => byFile.get(file)),
    Object.keys(BOOKS).filter((id) => !named.has(id)),
  );
}

/**
 * Reopen ONE remembered book. Returns whether this seat can now read it.
 *
 * Each kind fails differently and each failure is logged as itself — "it did
 * not reconnect" and "there was nothing to reconnect" used to be indis-
 * tinguishable from the outside, and they are not the same problem.
 *
 * `interactive` is the caller promising it holds a fresh user gesture, which
 * is the only state in which a browser will re-grant file permission.
 */
async function openRemembered(bookId, record, { interactive = false } = {}) {
  if (sessionDocs.has(bookId)) return true;
  const label = BOOKS[bookId]?.label ?? bookId;

  // Was this page just reloaded? Then the bytes are still bridged and every
  // kind reopens for free — including the `file` kind, which has no other way
  // back and is what every remote seat on plain http gets.
  if (await openCached(bookId)) return true;

  // A served path needs no permission and no gesture: this is the one kind
  // that puts a seat back exactly where it was, silently, on every join.
  if (record?.kind === "url") {
    try {
      const resp = await fetch(record.url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      await ingestBook(bookId, await blob.arrayBuffer(), { silent: !interactive, cache: blob });
      return true;
    } catch (err) {
      console.warn(`${MODULE_ID} | remembered ${label}: ${record.url} could not be read`, err);
      return false;
    }
  }

  // Identity only — no browser hands a picked file back from storage. The
  // dialog names it and offers the picker; there is nothing to try here.
  if (record?.kind === "file") {
    console.log(`${MODULE_ID} | remembered ${label}: "${record.name}" must be re-picked (this browser cannot reopen it by itself).`);
    return false;
  }

  if (!fsaAvailable() || !record?.handle?.queryPermission) {
    console.warn(
      `${MODULE_ID} | remembered ${label}: this browser cannot reopen a stored file location (insecure origin, or no File System Access API) — re-pick the file.`,
    );
    return false;
  }
  try {
    let perm = await record.handle.queryPermission({ mode: "read" });
    // Expected on every reload: browsers drop file permission when the page
    // goes away, so a remembered book is "prompt" until a user gesture
    // re-grants it. That gesture is the reconnect dialog — this is the normal
    // path, not a failure, and saying so stops it reading like one.
    if (perm === "prompt" && interactive) perm = await record.handle.requestPermission({ mode: "read" });
    if (perm !== "granted") {
      console.log(`${MODULE_ID} | remembered ${label}: permission "${perm}" — needs the unlock gesture this session.`);
      return false;
    }
    const file = await record.handle.getFile();
    await ingestBook(bookId, await file.arrayBuffer(), { silent: !interactive, cache: file });
    return true;
  } catch (err) {
    console.warn(`${MODULE_ID} | remembered ${label} could not be opened (moved/deleted?)`, err);
    return false;
  }
}

/**
 * Reopen everything this seat remembers, silently. Runs on join: whatever can
 * be opened without asking is opened, and the rest comes back as `pending` for
 * the reconnect dialog.
 */
async function restoreBooks() {
  const records = await locations();
  if (!records.size) {
    console.log(`${MODULE_ID} | no book locations remembered on this seat yet — connect one to have it offered next session.`);
    return [];
  }
  const pending = [];
  for (const [bookId, record] of records) {
    if (!(await openRemembered(bookId, record))) pending.push(bookId);
  }
  return pending;
}

/**
 * First-time linking by filename, for the files left over after the books the
 * reader named have been paired off (see `connectPicks`).
 *
 * `candidates` is what those files may still be claimed by — every book this
 * build reads, less anything already spoken for. First-time linking is the
 * whole point, so there may be no remembered record to lean on and the
 * title-in-filename pass does most of the work. Anything unmatched is named,
 * never guessed: the remedy is the same dialog again, with those books selected
 * in the list so no guessing is needed.
 *
 * @param {{file: File, handle?: FileSystemFileHandle}[]} picks  files, each with its handle where there is one
 * @param {string[]} [candidates]  book ids these files may fill
 */
async function connectSeveral(picks, candidates = Object.keys(BOOKS)) {
  const byFile = new Map(picks.map((pick) => [pick.file, pick]));
  const { matched, unmatched } = matchFilesToBooks([...byFile.keys()], candidates, await locations());
  // One summary rather than a message per book: this path can be handed the
  // whole shelf at once, and the summary already names every book it opened.
  const done = await ingestPairs(matched, byFile, { announce: false });
  if (done.length) {
    ui.notifications.info(game.i18n.format(`${LANG_PREFIX}.ui.connectBulkDone`, { count: done.length, books: done.join(", ") }));
  }
  if (unmatched.length) {
    ui.notifications.warn(
      game.i18n.format(`${LANG_PREFIX}.ui.connectBulkUnmatched`, { files: unmatched.map((f) => f.name).join(", ") }),
    );
  }
}

/**
 * Every PDF file handle under a directory handle, one level of subfolders deep
 * — enough for a shelf sorted into "Core"/"Adventures", shallow enough that
 * pointing at a whole drive does not become a filesystem crawl. Capped for the
 * same reason; the cap is far above any real shelf.
 */
async function pdfHandlesIn(dirHandle, depth = 1) {
  const out = [];
  for await (const entry of dirHandle.values()) {
    if (out.length >= 200) break;
    if (entry.kind === "file" && /\.pdf$/i.test(entry.name)) out.push(entry);
    else if (entry.kind === "directory" && depth > 0) out.push(...(await pdfHandlesIn(entry, depth - 1)));
  }
  return out;
}

/**
 * Connect every recognised book among a folder's PDFs.
 *
 * A folder is a GROUP, so only evidence places a file — remembered name, byte
 * size, or the book's title in the filename — and the positional fallback the
 * connect dialog uses for hand-named books never runs here: a folder full of
 * adventures must not have one dealt into an empty slot. Unrecognised PDFs are
 * NORMAL in a folder (that is where the rest of a collection lives), so they
 * are counted in the toast and named only on the console, not warned about.
 *
 * @param {{file: File, handle?: FileSystemFileHandle}[]} picks  the folder's PDFs
 * @param {object} [options]
 * @param {FileSystemDirectoryHandle} [options.remember]  the folder itself, for one-gesture group reconnects
 */
async function connectFolderPicks(picks, { remember = null } = {}) {
  const candidates = Object.keys(BOOKS).filter((id) => !sessionDocs.has(id));
  if (!candidates.length) {
    return ui.notifications.info(
      game.i18n.format(`${LANG_PREFIX}.ui.reconnectAllOpen`, {
        books: [...sessionDocs.keys()].map((id) => BOOKS[id]?.label ?? id).join(", "),
      }),
    );
  }
  const byFile = new Map(picks.map((pick) => [pick.file, pick]));
  const { matched, unmatched } = matchFilesToBooks([...byFile.keys()], candidates, await locations());
  // The folder is worth remembering even when nothing matched yet — the books
  // may land in it later, and the group reconnect re-scans on every use.
  if (remember) await dirPut(remember);
  if (unmatched.length) {
    console.log(`${MODULE_ID} | folder scan: ${unmatched.length} PDF(s) matched no book — ${unmatched.map((f) => f.name).join(", ")}`);
  }
  if (!matched.size) {
    return ui.notifications.warn(game.i18n.localize(`${LANG_PREFIX}.ui.folderNone`));
  }
  const done = await ingestPairs(matched, byFile, { announce: false });
  if (done.length) {
    ui.notifications.info(
      game.i18n.format(`${LANG_PREFIX}.ui.folderDone`, { count: done.length, books: done.join(", ") }) +
        (unmatched.length ? ` ${game.i18n.format(`${LANG_PREFIX}.ui.folderSkipped`, { skipped: unmatched.length })}` : ""),
    );
  }
  return done;
}

/**
 * The one "Your Books" surface: every book this build reads, its state on this
 * seat, and the control that changes that state. Status, the join-time
 * reconnect offer, and the on-demand reconnect all open THIS dialog — they
 * used to be three surfaces (a row dialog, a toast, and a console dump), and a
 * reader could not tell from the macro list which one would show them anything.
 *
 * One control PER BOOK, not one button for the lot, because re-granting file
 * permission consumes the user gesture that authorized it — a single click can
 * only ever unlock the first book, which is exactly how a three-book seat used
 * to end up with one book open and no explanation. A row therefore carries its
 * own Unlock (handle), Retry (path) or file picker, acts the moment it is
 * used, and says what happened; the dialog closes itself once no remembered
 * book is left waiting.
 *
 * Two controls CAN answer for several books at once. A plain file picker
 * grants no persistent permission and so consumes nothing: any seat with two
 * or more books waiting gets a "choose them all" row above the per-book ones —
 * handle seats included, whose remembered handles are kept so next session
 * still offers the one-click Unlock. And a remembered parent FOLDER re-grants
 * as a directory in one gesture, after which every book inside re-reads from
 * it with no further asking — the group case the per-file rules cannot reach.
 */
const openBooksDialog = () => singleton("books", (capture) => booksDialog(capture));

async function booksDialog(capture) {
  const records = await locations();
  const dir = fsaAvailable() ? await dirGet() : null;
  const pending = Object.keys(BOOKS).filter((id) => records.has(id) && !sessionDocs.has(id));
  const esc = foundry.utils.escapeHTML ?? ((s) => s);
  // What a connection unlocks — the scope figures Book Status used to print to
  // the console, now on the row they describe.
  const scopeOf = (id) => {
    const entries = cookbookCount(id);
    const recipes = allRecipes().filter((r) => r.book === id).length;
    return [entries ? `${entries} cookbook entr${entries === 1 ? "y" : "ies"}` : "", recipes ? `${recipes} recipe(s)` : ""]
      .filter(Boolean)
      .join(" + ");
  };
  const control = (id, record) => {
    if (record?.kind === "file") {
      return `<input type="file" name="pdf-${esc(id)}" data-book="${esc(id)}" accept="application/pdf">`;
    }
    const key = record?.kind === "url" ? "reconnectRetry" : "reconnectGo";
    return `<button type="button" data-book="${esc(id)}">${game.i18n.localize(`${LANG_PREFIX}.ui.${key}`)}</button>`;
  };
  const why = (record) => {
    if (record?.kind === "file") return game.i18n.format(`${LANG_PREFIX}.ui.reconnectFile`, { name: esc(record.name ?? "") });
    if (record?.kind === "url") return game.i18n.format(`${LANG_PREFIX}.ui.reconnectUrlFailed`, { where: esc(record.url) });
    return game.i18n.format(`${LANG_PREFIX}.ui.reconnectHandle`, { where: esc(describeLocation(record)) });
  };
  const rows = Object.entries(BOOKS)
    .map(([id, book]) => {
      const record = records.get(id);
      const scope = scopeOf(id);
      if (sessionDocs.has(id)) {
        return `<div class="acks-importer-reconnect-row acks-importer-reconnect-done" data-row="${esc(id)}">
          <div class="acks-importer-reconnect-head"><strong>${esc(book.label)}</strong></div>
          <p class="notes" data-status="${esc(id)}">${game.i18n.format(`${LANG_PREFIX}.ui.booksOpen`, {
            scope: scope || game.i18n.localize(`${LANG_PREFIX}.ui.booksNoScope`),
          })}${record ? ` [${esc(describeLocation(record))}]` : ""}</p>
        </div>`;
      }
      if (record) {
        return `<div class="acks-importer-reconnect-row" data-row="${esc(id)}">
          <div class="acks-importer-reconnect-head">
            <strong>${esc(book.label)}</strong>
            ${control(id, record)}
          </div>
          <p class="notes" data-status="${esc(id)}">${why(record)}</p>
        </div>`;
      }
      // Never connected on this seat: the row says what connecting would
      // unlock and hands over to the Connect dialog, where books are named.
      return `<div class="acks-importer-reconnect-row" data-row="${esc(id)}">
        <div class="acks-importer-reconnect-head">
          <strong>${esc(book.label)}</strong>
          <button type="button" data-open-connect>${game.i18n.localize(`${LANG_PREFIX}.ui.booksConnectGo`)}</button>
        </div>
        <p class="notes" data-status="${esc(id)}">${game.i18n.format(`${LANG_PREFIX}.ui.booksAbsent`, {
          scope: scope || game.i18n.localize(`${LANG_PREFIX}.ui.booksNoScope`),
        })}</p>
      </div>`;
    })
    .join("");

  // Only worth showing when it actually saves a trip: two or more books a
  // picker can answer — every kind but `url`, whose Retry needs no picker.
  // Handle seats qualify too: a plain multi-file input grants no persistent
  // permission and so consumes no gesture, so the one-gesture-per-book rule
  // that forces their per-row Unlock buttons does not bind it. Their handle
  // records are kept (see the ingest loop) — bulk is a faster way in, not a
  // downgrade of what the seat remembers.
  const pickable = pending.filter((id) => records.get(id)?.kind !== "url");
  const bulk =
    pickable.length > 1
      ? `<div class="acks-importer-reconnect-row acks-importer-reconnect-bulk">
           <div class="acks-importer-reconnect-head">
             <strong>${game.i18n.format(`${LANG_PREFIX}.ui.reconnectAllHead`, { count: pickable.length })}</strong>
             <input type="file" name="pdf-all" data-bulk accept="application/pdf" multiple>
           </div>
           <p class="notes" data-status-bulk>${game.i18n.localize(`${LANG_PREFIX}.ui.reconnectAllNote`)}</p>
         </div>`
      : "";
  // The remembered folder beats every per-file control when it exists: one
  // permission gesture on the directory, and everything inside re-reads.
  const folderUnlock =
    dir && pending.length
      ? `<div class="acks-importer-reconnect-row acks-importer-reconnect-bulk">
           <div class="acks-importer-reconnect-head">
             <strong>${game.i18n.format(`${LANG_PREFIX}.ui.reconnectFolderHead`, { name: esc(dir.name ?? "") })}</strong>
             <button type="button" data-unlock-folder>${game.i18n.localize(`${LANG_PREFIX}.ui.reconnectFolderGo`)}</button>
           </div>
           <p class="notes" data-status-folder>${game.i18n.localize(`${LANG_PREFIX}.ui.reconnectFolderNote`)}</p>
         </div>`
      : "";

  // The refresh bridge is invisible when it works, which makes "why did that
  // reload cost me a picker?" unanswerable without saying its state out loud.
  // The dialog carries the short form; the console keeps the full detail.
  const windowMs = cacheWindowMs();
  const stamp = stampGet();
  const cached = await idbOp("readonly", (s) => s.getAllKeys(), IDB_BYTES).catch(() => []);
  const bridge = !windowMs
    ? "refresh bridge: off — every page reload re-picks"
    : `refresh bridge: ${windowMs / 1000}s window, ${cached?.length ?? 0} book(s) bridged` +
      (stamp ? `, stamped ${Math.round((Date.now() - stamp) / 1000)}s ago` : ", not stamped yet") +
      `; this page was away ${((performance.timeOrigin - stamp) / 1000).toFixed(1)}s before starting`;
  const stateOf = (id) =>
    sessionDocs.has(id) ? "OPEN this session" : records.has(id) ? `remembered [${describeLocation(records.get(id))}]` : "not connected";
  console.log(
    `${MODULE_ID} | book status (this seat):\n${Object.entries(BOOKS)
      .map(([id, b]) => `${b.label}: ${stateOf(id)}${scopeOf(id) ? ` — ${scopeOf(id)}` : ""}`)
      .join("\n")}\n${bridge}`,
  );

  return foundry.applications.api.DialogV2.prompt({
    // One row per book, so the height is the reader's library, not a
    // constant: scroll region from the dialog class, handle from `resizable`.
    window: { title: game.i18n.localize(`${LANG_PREFIX}.ui.booksTitle`), resizable: true },
    classes: ["acks-ui", "acks-importer-dialog"],
    position: { width: 480 },
    content: dialogContent(
      `<p>${game.i18n.localize(`${LANG_PREFIX}.ui.booksBody`)}</p>${folderUnlock}${bulk}${rows}
       <p class="notes">${esc(bridge)} · ${game.i18n.localize(`${LANG_PREFIX}.ui.statusNote`)}</p>`,
    ),
    // Dismissing this is a legitimate answer ("not tonight"), not an error to
    // throw out of the ready hook.
    rejectClose: false,
    render: (event, dialog) => {
      capture(dialog);
      const root = dialog.element ?? dialog;
      const left = new Set(pending);
      const settle = (bookId, ok, message) => {
        const status = root.querySelector(`[data-status="${bookId}"]`);
        if (status) status.textContent = message;
        if (!ok) return;
        left.delete(bookId);
        root.querySelector(`[data-row="${bookId}"]`)?.classList.add("acks-importer-reconnect-done");
        // Nothing left to ask for: get out of the way rather than making the
        // reader dismiss a dialog that has finished its job.
        if (!left.size) dialog.close();
      };

      for (const button of root.querySelectorAll("button[data-book]")) {
        button.addEventListener("click", async () => {
          const bookId = button.dataset.book;
          button.disabled = true;
          // This click is the fresh gesture the browser was holding out for.
          const ok = await openRemembered(bookId, records.get(bookId), { interactive: true }).catch((err) => {
            console.error(`${MODULE_ID} | reconnect ${bookId}`, err);
            return false;
          });
          button.disabled = ok;
          settle(
            bookId,
            ok,
            ok
              ? game.i18n.localize(`${LANG_PREFIX}.ui.reconnectOpened`)
              : game.i18n.localize(`${LANG_PREFIX}.ui.reconnectFailed`),
          );
        });
      }

      const bulkInput = root.querySelector("input[type=file][data-bulk]");
      bulkInput?.addEventListener("change", async () => {
        const files = [...(bulkInput.files ?? [])];
        if (!files.length) return;
        const status = root.querySelector("[data-status-bulk]");
        const say = (text) => {
          if (status) status.textContent = text;
        };
        bulkInput.disabled = true;
        // Match against what is STILL waiting: a book opened from its own row
        // while this dialog was up must not be re-read from a picked file.
        const { matched, unmatched } = matchFilesToBooks(files, [...left], records);
        let opened = 0;
        // Sequentially: three ACKS PDFs read at once is hundreds of megabytes
        // of parsed page content in flight, on the seat least likely to have
        // the headroom for it.
        for (const [bookId, file] of matched) {
          try {
            await ingestBook(bookId, await file.arrayBuffer(), { cache: file });
            const record = records.get(bookId);
            if (record?.kind === "handle") {
              // Never downgrade a handle to a name-only record: the handle
              // still reopens with one click next session, which a re-picked
              // name never will. Refresh the size so a renamed copy can still
              // be matched by pass 2 next time.
              await locationPut(bookId, { ...record, size: file.size }).catch((err) =>
                console.warn(`${MODULE_ID} | could not update remembered location for ${bookId}`, err),
              );
            } else {
              await rememberFile(bookId, file);
            }
            opened++;
            settle(bookId, true, game.i18n.localize(`${LANG_PREFIX}.ui.reconnectOpened`));
          } catch (err) {
            console.error(`${MODULE_ID} | reconnect ${bookId} from ${file.name}`, err);
            settle(bookId, false, game.i18n.localize(`${LANG_PREFIX}.ui.reconnectFailed`));
          }
        }
        bulkInput.disabled = false;
        bulkInput.value = "";
        // Naming what went unused is the difference between "it half worked"
        // and knowing the seat picked the wrong file, or one book too few.
        if (unmatched.length) {
          say(game.i18n.format(`${LANG_PREFIX}.ui.reconnectAllUnmatched`, { files: unmatched.map((f) => f.name).join(", ") }));
        } else {
          say(game.i18n.format(`${LANG_PREFIX}.ui.reconnectAllDone`, { count: opened }));
        }
      });

      for (const input of root.querySelectorAll("input[type=file][data-book]")) {
        input.addEventListener("change", async () => {
          const bookId = input.dataset.book;
          const file = input.files?.[0];
          if (!file) return;
          input.disabled = true;
          try {
            // Bridged like every other read: this row exists for the seat that
            // cannot reopen a file by itself, which is the seat the refresh
            // bridge is for — dropping the cache here costs it the file picker
            // again on the very next reload.
            await ingestBook(bookId, await file.arrayBuffer(), { cache: file });
            await rememberFile(bookId, file); // may be a different copy than last time
            settle(bookId, true, game.i18n.localize(`${LANG_PREFIX}.ui.reconnectOpened`));
          } catch (err) {
            console.error(`${MODULE_ID} | reconnect ${bookId}`, err);
            input.disabled = false;
            settle(bookId, false, game.i18n.localize(`${LANG_PREFIX}.ui.reconnectFailed`));
          }
        });
      }

      // Never-connected rows hand over to the Connect dialog, where books are
      // named; this dialog closes first, because its rows are a snapshot that
      // a connection would immediately date.
      for (const button of root.querySelectorAll("button[data-open-connect]")) {
        button.addEventListener("click", () => {
          dialog.close();
          connectBook();
        });
      }

      // The folder route: one permission gesture on the remembered directory,
      // then every book found inside re-reads with no further asking. Matches
      // run against every book not open — a folder can reconnect what was
      // waiting AND connect a book this seat never named.
      const folderBtn = root.querySelector("[data-unlock-folder]");
      folderBtn?.addEventListener("click", async () => {
        const status = root.querySelector("[data-status-folder]");
        const say = (text) => {
          if (status) status.textContent = text;
        };
        folderBtn.disabled = true;
        try {
          let perm = await dir.handle.queryPermission({ mode: "read" });
          if (perm === "prompt") perm = await dir.handle.requestPermission({ mode: "read" });
          if (perm !== "granted") {
            say(game.i18n.localize(`${LANG_PREFIX}.ui.reconnectFolderDenied`));
            folderBtn.disabled = false;
            return;
          }
          const handles = await pdfHandlesIn(dir.handle);
          const byFile = new Map();
          for (const handle of handles) byFile.set(await handle.getFile(), handle);
          const candidates = Object.keys(BOOKS).filter((id) => !sessionDocs.has(id));
          const { matched } = matchFilesToBooks([...byFile.keys()], candidates, records);
          if (!matched.size) {
            say(game.i18n.localize(`${LANG_PREFIX}.ui.folderNone`));
            folderBtn.disabled = false;
            return;
          }
          let opened = 0;
          // Sequentially — several ACKS PDFs parsed at once is hundreds of
          // megabytes in flight.
          for (const [bookId, file] of matched) {
            try {
              await ingestBook(bookId, await file.arrayBuffer(), { cache: file });
              const handle = byFile.get(file);
              // The per-file handle is remembered too, so the per-row Unlock
              // still works next session even if the folder record is lost.
              await locationPut(bookId, { kind: "handle", handle, name: handle.name ?? null, size: file.size }).catch((err) =>
                console.warn(`${MODULE_ID} | could not remember ${bookId} from the folder`, err),
              );
              opened++;
              settle(bookId, true, game.i18n.localize(`${LANG_PREFIX}.ui.reconnectOpened`));
            } catch (err) {
              console.error(`${MODULE_ID} | folder reconnect ${bookId} from ${file.name}`, err);
              settle(bookId, false, game.i18n.localize(`${LANG_PREFIX}.ui.reconnectFailed`));
            }
          }
          say(game.i18n.format(`${LANG_PREFIX}.ui.reconnectAllDone`, { count: opened }));
        } catch (err) {
          console.error(`${MODULE_ID} | folder reconnect`, err);
          say(game.i18n.localize(`${LANG_PREFIX}.ui.reconnectFailed`));
        }
        folderBtn.disabled = false;
      });
    },
    ok: {
      label: game.i18n.localize(`${LANG_PREFIX}.ui.reconnectDone`),
      callback: () => {
        const still = pending.filter((id) => !sessionDocs.has(id));
        if (still.length) {
          ui.notifications.warn(
            game.i18n.format(`${LANG_PREFIX}.ui.reconnectIncomplete`, {
              books: still.map((id) => BOOKS[id]?.label ?? id).join(", "),
            }),
          );
        }
      },
    },
  });
}

/**
 * Reconnect on demand — retry the silent pass that runs on join (a plugged-in
 * drive or restored network may answer it now), then open the Books dialog,
 * whatever the outcome: a dialog that shows every book open IS the "all open"
 * report, where the old toast left nothing on screen to check it against.
 */
async function reconnectBooks() {
  await restoreBooks();
  return openBooksDialog();
}

/**
 * Which books this seat can read, and how much of each — the same Books
 * dialog reconnect opens, because state and the control that changes it
 * belong on one surface. The console keeps the per-book detail line and the
 * refresh-bridge state (see booksDialog); the scope figures count SHIPPED
 * cookbook entries, not extracted prose — prose is lazy and a count of it
 * measures nothing a reader asked about.
 */
async function bookStatus() {
  return openBooksDialog();
}

async function forgetBooks() {
  // The success toast is a claim about the clears, so each clear reports its
  // outcome instead of being swallowed — a failed IndexedDB clear must not
  // tell the GM the forget succeeded.
  let allCleared = true;
  const attempt = async (label, clear) => {
    try {
      await clear();
    } catch (err) {
      allCleared = false;
      console.warn(`${MODULE_ID} | forget books: ${label} could not be cleared`, err);
    }
  };
  await attempt("remembered locations", locationClear);
  // Forget means forget: the refresh bridge goes with the locations, or the
  // next reload would quietly reopen the very books that were just dropped.
  await attempt("bridged book bytes", bytesClear);
  await stampClear();
  proseMem.clear();
  sessionDocs.clear();
  if (allCleared) {
    ui.notifications.info("acks-importer | remembered book locations dropped; in-memory prose cleared. Sheets show stubs until books reconnect.");
  } else {
    ui.notifications.warn("acks-importer | some remembered book data could not be cleared — see the console. In-memory prose was cleared.");
  }
}

/* -------------------------------------------- */
/*  Browse & load: pick a page, choose headings */
/* -------------------------------------------- */

const slug = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

function guessKind(bookId, mode) {
  if (mode === "runin") return "item";
  return bookId === "mm" ? "monster" : "ability";
}

async function browseAndLoad() {
  if (!game.user.isGM) return ui.notifications.warn("acks-importer | GM only (creates documents and world recipes).");

  const options = Object.entries(BOOKS)
    .map(([id, b]) => `<option value="${id}">${b.label}${sessionDocs.has(id) ? " ✓ open" : ""}</option>`)
    .join("");
  const step1 = `
    <div class="form-group"><label>${game.i18n.localize(`${LANG_PREFIX}.ui.connectBook`)}</label>
      <select name="book">${options}</select></div>
    <div class="form-group"><label>${game.i18n.localize(`${LANG_PREFIX}.ui.browsePage`)}</label>
      <input type="number" name="page" min="1" step="1" placeholder="PDF page #"></div>
    <p class="notes">${game.i18n.localize(`${LANG_PREFIX}.ui.browseNote`)}</p>`;

  await foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.localize(`${LANG_PREFIX}.ui.browseTitle`) },
    classes: ["acks-ui", "acks-importer-dialog"],
    content: dialogContent(step1),
    ok: {
      label: game.i18n.localize(`${LANG_PREFIX}.ui.browseGo`),
      callback: async (event, button) => {
        const form = button.form;
        const bookId = form.elements.book.value;
        const page = parseInt(form.elements.page.value, 10);
        if (!Number.isFinite(page) || page < 1) return ui.notifications.warn("acks-importer | enter a PDF page number.");
        if (!sessionDocs.has(bookId)) {
          return ui.notifications.warn(
            `acks-importer | ${BOOKS[bookId].label} is not open this session — connect it first (PoC 2 / unlock dialog).`,
          );
        }
        return pickHeadings(bookId, page);
      },
    },
  });
}

async function pickHeadings(bookId, page) {
  const { doc, title } = sessionDocs.get(bookId);
  if (page > doc.numPages) return ui.notifications.warn(`acks-importer | page ${page} > ${doc.numPages}.`);
  const pageData = await pageItems(doc, page);
  const heads = listHeadings(pageData);
  if (!heads.length) return ui.notifications.warn(`acks-importer | no extraction anchors detected on PDF p. ${page}.`);

  const esc = foundry.utils.escapeHTML ?? ((s) => s);
  const rows = heads
    .map(
      (h, i) => `<label class="acks-importer-browse-row">
        <input type="checkbox" name="sel" value="${i}">
        <span>${esc(h.text)}</span>
        <span class="acks-importer-cite">${h.mode === "display" ? game.i18n.localize(`${LANG_PREFIX}.ui.modeDisplay`) : game.i18n.localize(`${LANG_PREFIX}.ui.modeRunin`)}</span>
      </label>`,
    )
    .join("");
  const kinds = ["auto", "monster", "ability", "item"]
    .map((k) => `<option value="${k}">${game.i18n.localize(`${LANG_PREFIX}.ui.kind.${k}`)}</option>`)
    .join("");
  const content = `
    <p class="notes">${game.i18n.format(`${LANG_PREFIX}.ui.browseFound`, { n: heads.length, book: BOOKS[bookId].label, page })}</p>
    <div class="acks-importer-browse-list">${rows}</div>
    <div class="form-group"><label>${game.i18n.localize(`${LANG_PREFIX}.ui.kindLabel`)}</label>
      <select name="kind">${kinds}</select></div>`;

  return foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.format(`${LANG_PREFIX}.ui.browsePick`, { book: BOOKS[bookId].label, page }), resizable: true },
    classes: ["acks-ui", "acks-importer-dialog"],
    position: { width: 480 },
    content: dialogContent(content),
    ok: {
      label: game.i18n.localize(`${LANG_PREFIX}.ui.browseLoad`),
      callback: async (event, button) => {
        const form = button.form;
        const kindChoice = form.elements.kind.value;
        const picked = [...form.querySelectorAll('input[name="sel"]:checked')].map((el) => heads[+el.value]);
        if (!picked.length) return ui.notifications.warn("acks-importer | nothing selected.");
        return loadHeadings(bookId, page, pageData, picked, kindChoice, title);
      },
    },
  });
}

async function loadHeadings(bookId, page, pageData, picked, kindChoice) {
  const dyn = foundry.utils.deepClone(dynamicRecipes());
  const mem = proseMem.get(bookId) ?? {};
  let created = 0;
  for (const head of picked) {
    const prose = head.mode === "runin" ? extractRunin(pageData, head.text) : extractDisplay(pageData, head.text);
    if (!prose) {
      ui.notifications.warn(`acks-importer | "${head.text}" extracted nothing — skipped.`);
      continue;
    }
    const name = head.text.replace(/:$/, "");
    const recipe = {
      id: `dyn.${bookId}.${page}.${slug(name)}`,
      book: bookId,
      page,
      mode: head.mode,
      heading: head.text,
      cite: `${bookId.toUpperCase()} PDF p. ${page}`,
      kind: kindChoice === "auto" ? guessKind(bookId, head.mode) : kindChoice,
      name,
      dynamic: true,
    };
    dyn[recipe.id] = recipe;
    mem[recipe.id] = prose; // this seat's session memory — other seats resolve via their own book
    const created0 = await createDocFor(recipe);
    if (recipe.kind === "monster") await applyStatsToActor(created0, sessionDocs.get(bookId).doc, pageData, recipe);
    created++;
  }
  if (!created) return;
  proseMem.set(bookId, mem);
  await game.settings.set(MODULE_ID, SETTING_DYNAMIC, dyn);
  ui.notifications.info(game.i18n.format(`${LANG_PREFIX}.ui.browseDone`, { n: created, book: BOOKS[bookId].label, page }));
}

/* -------------------------------------------- */
/*  Stat setup (numbers → world actor data)     */
/* -------------------------------------------- */

/** Extract the page illustration from the GM's book and set it as actor+token
 *  art. NOTE the deliberate asymmetry with prose: art must render on every
 *  client's canvas, so it uploads into world data (acks-importer-art/) — a
 *  world asset sourced from the GM's own book, like a scan the GM saved. */
/**
 * Extract + upload a page illustration WITHOUT touching an actor — returns
 * `{path, width, height}` or null. The path-only half exists for the family
 * importer, whose art belongs to a template OPTION rather than the actor.
 * Name-first: with the wasm decoders shipped, the placed XObject itself
 * extracts cleanly (the AX books' art is JPEG2000). The placement-box
 * page-render crop stays as a fallback for a seat whose decoders fail.
 */
const ART_DIR = "acks-importer-art";

/**
 * Filename → full path for everything already in the art directory, listed
 * ONCE per session.
 *
 * The reuse check used to browse the whole directory per actor. That is a
 * server round trip whose response grows with every import, taken hundreds of
 * times in a bulk run and serialized behind the other three import workers —
 * so a world whose art was entirely cached still spent minutes proving it. The
 * listing changes only when this seat uploads, and every upload updates the
 * map, so one listing is the whole truth for the run.
 */
let artListing = null;
function artIndex(FP) {
  // The PROMISE is cached, not the map: four import workers start together and
  // would otherwise each fire the listing this exists to fire once.
  artListing ??= (async () => {
    const map = new Map();
    try {
      const listing = await FP.browse("data", ART_DIR);
      for (const f of listing?.files ?? []) map.set(f.split("/").pop(), f);
    } catch {
      /* directory does not exist yet — an empty map, not a failure */
    }
    return map;
  })();
  return artListing;
}

async function uploadPageArt(doc, recipe) {
  const FP = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  const dir = ART_DIR;
  const filename = `${recipe.id.replaceAll(".", "-")}.png`;
  // Already imported? Reuse it — decode + upload is the expensive half of a
  // re-import. A tiny file is a corrupt/aborted upload and is redone.
  const index = await artIndex(FP);
  const existing = index.get(filename);
  if (existing) {
    // A tiny file is a corrupt/aborted upload, and an unanswerable one is a
    // file deleted since the listing was taken — both are re-extracted rather
    // than handed to an actor as an image path that renders nothing.
    const head = await fetch(existing, { method: "HEAD" }).catch(() => null);
    const size = parseInt(head?.headers?.get("content-length") ?? "0", 10);
    if (head?.ok && size >= 1024) return { path: existing, width: 0, height: 0, cached: true };
    index.delete(filename);
  }
  const art =
    (await extractPageArt(doc, recipe.page, recipe.name ?? null)) ??
    (recipe.box ? await extractPageArtRegion(doc, recipe.page, recipe.box) : null);
  if (!art) return null;
  await FP.createDirectory("data", dir).catch((err) =>
    console.debug(`${MODULE_ID} | art directory "${dir}" not created (it usually already exists)`, err),
  );
  const file = new File([art.blob], filename, { type: "image/png" });
  const res = await FP.upload("data", dir, file, {}, { notify: false });
  if (!res?.path) return null;
  index.set(filename, res.path); // the listing stays true without re-browsing
  return { path: res.path, width: art.width, height: art.height };
}

async function importArt(actor, doc, recipe) {
  try {
    const up = await uploadPageArt(doc, recipe);
    if (!up) {
      console.log(`${MODULE_ID} | ${actor.name}: no suitable illustration found on PDF p. ${recipe.page}.`);
      return false;
    }
    await actor.update({ img: up.path, "prototypeToken.texture.src": up.path });
    console.log(`${MODULE_ID} | ${actor.name}: art ${up.cached ? "reused" : `imported (${up.width}x${up.height})`} -> ${up.path}`);
    return true;
  } catch (err) {
    console.warn(`${MODULE_ID} | ${actor.name}: art import failed`, err);
    return false;
  }
}

async function applyStatsToActor(actor, doc, pageData, recipe) {
  const pairs = extractStatPairs(pageData);
  if (!pairs.length) return ui.notifications.warn(`acks-importer | ${recipe.name}: no stat rows found on PDF p. ${recipe.page}.`);
  const { system, extras, items, applied, unmapped } = mapPairs(pairs);

  // Stream the entry prose where the sheet the seat is using will ENRICH it,
  // so the @PdfText tag resolves per seat (stub for a bookless seat, "show book
  // text" reveal for one with the book):
  //   • Full Monster Sheet active → the visible APPEARANCE field
  //     (extras.description.appearance). FMS v0.x enriches its description
  //     fields, so the tag renders there — the first field on the Description
  //     tab, which is where the reader looks.
  //   • otherwise → the core biography ({{{enriched.biography}}}).
  // Each target is written as ONE object/path — never a parent object plus a
  // dotted leaf of it in the same update() (that ambiguity clobbered the write).
  const update = { [`flags.${MODULE_ID}.statPairs`]: pairs };
  // The Full Monster Sheet is a feature of acks-extras, which this module hard-
  // requires, so the stat-block channel is always available. The old fallback
  // wrote the same prose to system.details.biography instead; it can no longer
  // be reached, and two possible homes for one description is exactly what the
  // channel split existed to prevent.
  extras.description = { ...(extras.description ?? {}), appearance: tagHtmlFor(recipe) };
  update["flags.acks-extras.extras"] = extras;
  update.system = system;
  await actor.update(update);
  // Truthful diagnostics: verify the streamed description actually landed.
  const back = actor.getFlag("acks-extras", "extras")?.description?.appearance;
  console.log(`${MODULE_ID} | ${actor.name}: description ${back ? "VERIFIED on actor" : "MISSING after write (!)"}`);

  // Spoils subsection -> spoil-flagged items (Full Monster Sheet Spoils tab).
  // Book weights are authoritative as printed (stored in 1/6-stone units).
  const spoils = extractSpoils(pageData).map((s) => ({
    name: s.name.charAt(0).toUpperCase() + s.name.slice(1),
    type: "item",
    img: "icons/svg/item-bag.svg",
    system: { description: "", subtype: "item", quantity: { value: 1, max: 0 }, cost: s.cost, weight: 0, weight6: s.weight6 },
    flags: { "acks-extras": { spoil: true, component: true, researchEffects: s.effects } },
  }));

  // Embedded attacks/abilities/spoils: replace previously generated ones (idempotent re-apply).
  const stale = actor.items.filter((i) => i.getFlag(MODULE_ID, "generated")).map((i) => i.id);
  if (stale.length) await actor.deleteEmbeddedDocuments("Item", stale);
  const embed = [...items, ...spoils];
  if (embed.length) {
    await actor.createEmbeddedDocuments(
      "Item",
      embed.map((i) => ({ ...i, flags: { ...(i.flags ?? {}), [MODULE_ID]: { ...(i.flags?.[MODULE_ID] ?? {}), generated: true } } })),
    );
  }

  const gotArt = await importArt(actor, doc, recipe);

  console.log(
    `${MODULE_ID} | ${actor.name}: stats [${applied.join(", ")}]; ${spoils.length} spoils${unmapped.length ? `; unmapped: ${unmapped.join(", ")}` : ""}`,
  );
  ui.notifications.info(
    `acks-importer | ${actor.name}: ${applied.length} stat fields, ${items.length} attack/ability items, ${spoils.length} spoils${gotArt ? ", art imported" : ""}, ${unmapped.length} labels stored raw (console has details).`,
  );
}

/** The monster recipe whose name matches an actor ("Griffon" or "Griffon (PoC)"). */
function monsterRecipeForActor(actor) {
  return (
    allRecipes().find(
      (r) =>
        r.kind === "monster" &&
        (actor.name === r.name || actor.name === `${r.name} (PoC)`),
    ) ?? null
  );
}

/** Fill one monster actor from its recipe's book (must be open this session). */
async function fillMonster(actor, recipe) {
  const session = sessionDocs.get(recipe.book);
  if (!session) {
    ui.notifications.warn(
      `acks-importer | ${BOOKS[recipe.book]?.label ?? recipe.book} is not open this session — connect it (PoC 2 / unlock) to fill ${actor.name}.`,
    );
    return false;
  }
  const pageData = await pageItems(session.doc, recipe.page);
  await applyStatsToActor(actor, session.doc, pageData, recipe);
  return true;
}

/**
 * Which monsters Apply Stats should act on.
 *
 * Selected tokens, plus any monster whose SHEET is open. A monster that has
 * never been placed on a scene has no token to select, which made the whole
 * feature unreachable for it — and an imported bestiary is mostly actors
 * nobody has dragged out yet. Opening the sheet is the natural way to say
 * "this one". Deduped, because an open sheet for a selected token is one
 * monster, not two.
 */
function applyStatsTargets() {
  const fromTokens = (canvas.tokens?.controlled ?? []).map((t) => t.actor);
  const open = [...(foundry.applications?.instances?.values?.() ?? []), ...Object.values(ui.windows ?? {})];
  const fromSheets = open.map((app) => app?.document ?? app?.object).filter((d) => d instanceof Actor);
  return [...new Set([...fromTokens, ...fromSheets].filter((a) => a?.type === ACTOR_TYPE.MONSTER))];
}

/**
 * Re-read stats from the connected book for the selected/open monsters.
 *
 * Never every monster in the world: this rewrites system data, so it acts on
 * what the GM pointed at and nothing else.
 */
async function applyStats() {
  if (!game.user.isGM) return ui.notifications.warn("acks-importer | GM only.");
  const selected = applyStatsTargets();
  if (!selected.length) {
    return ui.notifications.warn(
      "acks-importer | select a monster token or open its sheet first — Apply Stats targets only what you point at, never every monster.",
    );
  }
  let touched = 0;
  const closed = new Set();
  const unknown = [];
  for (const actor of selected) {
    // A cookbook-imported monster knows exactly which entry it came from, so
    // ask it rather than guessing from its name. Before this, Apply Stats
    // resolved names against allRecipes() alone — the dozen hand-written PoC
    // recipes — so it could not touch ANY of the hundreds of monsters the
    // cookbook imports, with or without a token.
    const refilled = await refillMonster(actor).catch((err) => {
      console.error(`${MODULE_ID} | refill ${actor.name}`, err);
      return { ok: false, reason: "error" };
    });
    if (refilled?.ok) {
      touched++;
      continue;
    }
    if (refilled?.reason === "book-closed") {
      closed.add(BOOKS[refilled.book]?.label ?? refilled.book);
      continue;
    }
    if (refilled) continue; // ours, but this printing did not match — already logged
    const recipe = monsterRecipeForActor(actor);
    if (!recipe) {
      unknown.push(actor.name);
      continue;
    }
    if (await fillMonster(actor, recipe)) touched++;
  }
  if (closed.size) {
    ui.notifications.warn(`acks-importer | not open this session: ${[...closed].join(", ")} — connect to refill from it.`);
  }
  if (unknown.length) {
    ui.notifications.warn(
      `acks-importer | not from the cookbook and no recipe matches: ${unknown.slice(0, 5).join(", ")}${unknown.length > 5 ? ` (+${unknown.length - 5})` : ""}.`,
    );
  }
  if (touched) ui.notifications.info(`acks-importer | refilled ${touched} monster${touched === 1 ? "" : "s"} from your book.`);
}

/* -------------------------------------------- */
/*  @PdfText enricher (per-client resolution)   */
/* -------------------------------------------- */

/**
 * Last-resort stub for an id nothing can look up.
 *
 * The weapon and armour TABLE binders mint their own ids (`def.weapon.staff`,
 * `def.armor.plate`) from each row's printed name. Those ids are not cookbook
 * entries and never will be — a table is materialized from the seat's own book
 * rather than shipped — so both lookups above answer null, and the fall-through
 * used to localize `ACKS-IMPORTER.pdftext.<id>`: a key that exists only for the
 * handful of static PoC recipes. Every table-bound item therefore printed its
 * own i18n key where its description should be.
 *
 * Nothing extra has to be stored to say something useful instead. The tag
 * already carries the citation as its label, and the id carries the printed
 * name that minted it.
 */
function fallbackStub(recipeId, label) {
  const tail = String(recipeId).split("#")[0].split(".").pop() ?? "";
  const name = tail
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
  if (!name) return label ?? "";
  return label
    ? game.i18n.format(`${LANG_PREFIX}.ui.cookbookStub`, { name, cite: label })
    : game.i18n.format(`${LANG_PREFIX}.ui.namelessStub`, { name });
}

function enrichPdfText(recipeId, label) {
  const recipe = resolveRecipe(recipeId);
  const holder = document.createElement("span");
  holder.classList.add("acks-importer-pdftext");
  const stubEl = document.createElement("span");
  stubEl.classList.add("acks-importer-stub");
  stubEl.textContent = (recipe ? stubFor(recipe) : cookbookStub(recipeId)) ?? fallbackStub(recipeId, label);
  holder.append(stubEl);
  if (proseFor(recipeId) || cookbookCanReveal(recipeId)) {
    const reveal = document.createElement("a");
    reveal.classList.add("acks-importer-reveal");
    reveal.dataset.acksImporterId = recipeId;
    reveal.textContent = `📖 ${game.i18n.localize(`${LANG_PREFIX}.ui.reveal`)}${label ? ` (${label})` : ""}`;
    holder.append(" ", reveal);
  }
  return holder;
}

async function onRevealClick(event) {
  const link = event.target.closest?.(".acks-importer-reveal");
  if (!link) return;
  event.preventDefault();
  const holder = link.closest(".acks-importer-pdftext");
  const open = holder?.querySelector(".acks-importer-prose");
  if (open) return open.remove(); // toggle off — reproduction stays on-demand
  // Session memory first; else a cookbook id executes lazily from this seat's book.
  const id = link.dataset.acksImporterId;
  const prose = proseFor(id) ?? (cookbookCanReveal(id) ? await cookbookProse(id) : null);
  if (!prose) return;
  const block = document.createElement("span");
  block.classList.add("acks-importer-prose");
  block.textContent = prose; // textContent: extracted text is never parsed as HTML
  holder.append(block);
}

/* -------------------------------------------- */
/*  Boot                                        */
/* -------------------------------------------- */

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_DYNAMIC, { scope: "world", config: false, type: Object, default: {} });
  // Judge-registered OSE sources. World-scoped rather than shipped: these are
  // other publishers' books, fingerprinted against the copy the Judge owns.
  registerOseSourceSetting();
  // Where imports land. A world compendium keeps hundreds of imported monsters
  // out of the sidebar and makes them drag-and-droppable reference material;
  // the world-document default stays for GMs who edit imports in place.
  // Changing it affects the NEXT import, never what is already there.
  game.settings.register(MODULE_ID, "importToCompendium", {
    name: "Import into compendiums",
    hint: "Imported monsters, abilities, journals and tables are created in world compendiums (\"ACKS Cookbook — …\") instead of the sidebar directories.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    // Flipping this changes WHERE an already-imported item lives, so the dedup
    // index built against the old target is stale the moment it changes.
    onChange: () => forgetImportedIndex(),
  });
  // The refresh bridge (see above). Client scope: how long a seat's own bytes
  // may survive its own reload is that seat's business, and the answer differs
  // between a GM on the host and a player on a phone tether.
  game.settings.register(MODULE_ID, SETTING_REFRESH_CACHE, {
    name: `${LANG_PREFIX}.cache.settingName`,
    hint: `${LANG_PREFIX}.cache.settingHint`,
    scope: "client",
    config: true,
    type: Number,
    range: { min: 0, max: 300, step: 10 },
    default: 60,
    onChange: (value) => {
      // Turning it off must take effect now, not at the next join — a reader
      // who changes their mind about bytes on disk means it.
      if (!Number(value)) {
        bytesClear().catch((err) =>
          console.warn(`${MODULE_ID} | bridged book bytes could not be cleared after disabling the refresh bridge`, err),
        );
        stampClear();
      }
    },
  });
  registerGettingStartedSettings();
  setWorker(`modules/${MODULE_ID}/vendor/pdf.worker.mjs`);
  setWasmUrl(`modules/${MODULE_ID}/vendor/wasm/`);
  CONFIG.TextEditor.enrichers.push({
    // id may carry a "#section" suffix (cookbook description sections).
    pattern: /@PdfText\[([\w.#-]+)\](?:\{([^}]+)\})?/g,
    enricher: async (match) => enrichPdfText(match[1], match[2]),
  });
});

Hooks.once("ready", async () => {
  // Possession model: purge any prose persisted by earlier PoC builds.
  for (const key of LEGACY_KEYS) {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      console.log(`${MODULE_ID} | purged legacy persisted prose (${key}) — prose is session-memory only now.`);
    }
  }

  document.body.addEventListener("click", onRevealClick);
  initCookbook({ sessionDocs, proseMem, importArtForPage: importArt, uploadPageArt });
  registerAbilityDirectoryButtons();
  await loadCookbook();
  const api = {
    connectBook, connectBookUrl, reconnectBooks, browseAndLoad, applyStats, bookStatus, forgetBooks,
    proseFor, cookbookImport, cookbookImportIds, cookbookImportMonsters, cookbookRemoveImports, cookbookImportAbilities, cookbookImportAbilitiesDialog, cookbookUpdateAbilities, cookbookFillCompanions, cookbookPruneAbilities,
    importAbility, cookbookDebug, cookbookProse, cookbookCount,
    cookbookImportTables,
    cookbookImportJournals, cookbookImportRollTables, cookbookOrganize,
    importEquipment, importAllEquipment, cookbookEquipmentIds, repairEquipmentAbilities,
    importWeapons, importArmor,
    importClasses, cookbookUpdateClasses, importTemplatePackages, importTraps, importVariations, importVehicles,
    gettingStarted: showGettingStarted,
    // Importing another game's books (docs/OSE.md). Separate entry points
    // because a third-party source is registered by the Judge rather than
    // shipped, so it never appears in the book list the rest of these use.
    oseRegister: registerOseSourceDialog,
    oseImport: oseBrowseDialog,
    oseCalibrate: oseCalibrateDialog,
    oseConvertAll,
    oseManual: oseManualDialog,
    oseImportBook: importOseBook,
    oseImportAreas: importOseAreas,
    oseAuthoredBooks: authoredOseBooks,
    RECIPES, BOOKS,
  };
  globalThis.acksImporter = api;

  // Provide the ability-resolution contract (acks-lib docs/API.md): sibling
  // modules embed proficiency packages on hired actors through this, without
  // naming this module.
  if (globalThis.acksExtras?.lib?.services) {
    globalThis.acksExtras?.lib.services.register("ability-provider", { resolve: resolveAbilities });
  }
  const module = game.modules.get(MODULE_ID);
  if (module) module.api = api;
  console.log(
    `${MODULE_ID} | ready. Macros in the "ACKS Importer — Macros" compendium (folders "1 · Your Book" through "4 · Tools & Maintenance"), or: acksImporter.connectBook() · acksImporter.cookbookImport() · acksImporter.cookbookImportAbilitiesDialog() · acksImporter.cookbookUpdateAbilities() · acksImporter.importClasses() · acksImporter.cookbookUpdateClasses() · acksImporter.browseAndLoad().`,
  );

  // Before anything reads bytes: decide whether this page load is a reload
  // inside the bridge window or a genuinely new session, and empty the bridge
  // if it is the latter. Nothing below may see stale bytes.
  await sweepCache();
  startCacheHeartbeat();

  // Reopen remembered books; offer the reconnect gesture for the rest. A seat
  // with nothing remembered at all is (probably) brand new — that seat gets
  // the Getting Started walkthrough instead, never both dialogs.
  const pending = await restoreBooks();
  if (pending.length) await openBooksDialog();
  else if (!sessionDocs.size && !(await locations()).size) await showGettingStarted();
});
