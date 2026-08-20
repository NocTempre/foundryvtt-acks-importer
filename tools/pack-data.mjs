/**
 * Module-owned compendium document content, consumed by the synced
 * tools/build-packs.mjs harness.
 *
 * One pack: macros wrapping the acksImporter api, so a GM clicks instead of
 * typing console calls. Ids carry the declared "acksc" prefix and are exactly
 * 16 alphanumerics; _stats timestamps are FIXED so rebuilds are byte-identical
 * (no pack churn).
 *
 * `_id` IS IDENTITY — never change one. A new id on an existing macro gives
 * every world that already imported the pack a duplicate. Rename freely; the id
 * stays. Dropping a macro from the pack is safe the same way: worlds that
 * imported it keep their copy, which keeps working through the api. `sort`
 * orders macros WITHIN their folder and is unique per folder — two equal keys
 * render in load order, which is no order at all.
 */

// Fixed epoch: 2026-07-17T00:00:00Z. Never change casually — churns packs.
const STATS = { coreVersion: "14", createdTime: 1784332800000, modifiedTime: 1784332800000 };

/**
 * Compendium folders. Same identity rule as macros: `_id` is forever (a new id
 * re-imports as a second folder), and it carries the "acksc" prefix the
 * namespacing gate enforces on every pack document.
 */
function folder(id, name, sort) {
  return {
    _id: id,
    _key: `!folders!${id}`,
    name,
    type: "Macro",
    folder: null,
    sorting: "m",
    sort,
    description: "",
    ownership: { default: 0 },
    flags: {},
    _stats: { ...STATS },
  };
}

const FOLDERS = {
  setup: "ackscFldSetup000",
  import: "ackscFldImport00",
  abilities: "ackscFldAbils000",
  tools: "ackscFldTools000",
};

function macro(id, name, img, command, sort = 0, folderId = null) {
  return {
    _id: id,
    _key: `!macros!${id}`,
    name,
    type: "script",
    img,
    scope: "global",
    command,
    folder: folderId,
    sort,
    ownership: { default: 2 },
    flags: {},
    _stats: { ...STATS },
  };
}

/**
 * Every macro command runs one api function behind the same two guards: the
 * module must be ready, and the function must exist on this build. Macros
 * arrive by compendium import and outlive the build that shipped them, so an
 * older module build says "needs a newer build" instead of throwing.
 */
function apiCommand(fn, name, args = "") {
  return `const api = globalThis.acksImporter;
if (!api) return ui.notifications.warn("acks-importer | module not ready (is it enabled?).");
if (typeof api.${fn} !== "function") return ui.notifications.warn("acks-importer | ${name} needs a newer build of this module.");
api.${fn}(${args});`;
}

const apiMacro = (id, name, img, fn, sort, folderId, args = "") => macro(id, name, img, apiCommand(fn, name, args), sort, folderId);

function buildMacros() {
  return [
    /* Folders group the macros into the order a GM actually uses them. Folder
       ids are identity too — renaming a folder is free, re-issuing its id is
       not (every world that imported the pack would gain a second one). */
    folder(FOLDERS.setup, "1 · Your Book", 100),
    folder(FOLDERS.import, "2 · Import Content", 200),
    folder(FOLDERS.abilities, "3 · Abilities & Equipment", 300),
    folder(FOLDERS.tools, "4 · Tools & Maintenance", 400),

    /* --- 1 · Your Book: what a new seat does first. Status and reconnect are
       one surface (the Books dialog), so they are one macro; the old separate
       Reconnect macro was dropped — worlds that imported it keep a working
       copy, and api.reconnectBooks() remains. --- */
    apiMacro("ackscMacGetStart", "Getting Started (this seat)", "icons/svg/light.svg", "gettingStarted", 100, FOLDERS.setup, "{ force: true }"),
    apiMacro("ackscMacConnect0", "Connect Your Book (this seat)", "icons/svg/book.svg", "connectBook", 110, FOLDERS.setup),
    apiMacro("ackscMacStatus00", "Book Status & Reconnect (this seat)", "icons/svg/padlock.svg", "bookStatus", 120, FOLDERS.setup),
    apiMacro("ackscMacClear000", "Forget Books (this seat)", "icons/svg/blind.svg", "forgetBooks", 130, FOLDERS.setup),

    /* --- 2 · Import Content: cookbook -> world documents, in the same
       dependency order the Getting Started chain runs them. --- */
    apiMacro("ackscMacCookbook", "Import Monsters & NPCs — choose from a list (GM)", "icons/svg/mystery-man.svg", "cookbookImport", 200, FOLDERS.import),
    apiMacro("ackscMacMonsAll0", "Import ALL Monsters & NPCs (GM)", "icons/svg/aura.svg", "cookbookImportMonsters", 210, FOLDERS.import),
    apiMacro("ackscMacClassAll", "Import Character Classes (GM)", "icons/svg/cowled.svg", "importClasses", 220, FOLDERS.import),
    // Traps, variations and vehicles each need ACKS Extras for the document
    // type they materialize into; each api says which one is missing rather
    // than failing at Item.create with a validation error.
    apiMacro("ackscMacTraps000", "Import Traps (GM)", "icons/svg/trap.svg", "importTraps", 230, FOLDERS.import),
    apiMacro("ackscMacVariat00", "Import Item Variations (GM)", "icons/svg/upgrade.svg", "importVariations", 240, FOLDERS.import),
    apiMacro("ackscMacVehicl00", "Import Vehicles (GM)", "icons/svg/stone-path.svg", "importVehicles", 250, FOLDERS.import),
    apiMacro("ackscMacAdvJourn", "Import Location Journals (GM)", "icons/svg/village.svg", "cookbookImportJournals", 260, FOLDERS.import),
    apiMacro("ackscMacAdvTable", "Import Adventure Roll Tables (GM)", "icons/svg/d20-grey.svg", "cookbookImportRollTables", 270, FOLDERS.import),
    apiMacro("ackscMacTables00", "Import Rules Tables (GM)", "icons/svg/coins.svg", "cookbookImportTables", 280, FOLDERS.import),
    macro(
      "ackscMacTblDocs0",
      "Create Foundry Tables from Rules Import (GM)",
      "icons/svg/d6-grey.svg",
      `const svc = globalThis.acksExtras?.lib?.services?.get?.("ruledata-import");
if (!svc?.materializeDocs) return ui.notifications.warn("acks-importer | the ruledata provider does not offer materializeDocs — update ACKS Extras.");
const r = await svc.materializeDocs();
ui.notifications.info(\`acks-importer | \${r.exported} table(s) written as Foundry documents, \${r.placeholders} placeholder(s) for expected-but-missing tables.\`);`,
      290,
      FOLDERS.import,
    ),
    apiMacro("ackscMacRemoveAl", "Remove ALL Imports (GM)", "icons/svg/cancel.svg", "cookbookRemoveImports", 299, FOLDERS.import),

    /* --- 3 · Abilities & Equipment: the shared item library. --- */
    apiMacro("ackscMacAbilBrw0", "Browse & Import Abilities (GM)", "icons/svg/book.svg", "cookbookImportAbilitiesDialog", 300, FOLDERS.abilities),
    apiMacro("ackscMacAbilAll0", "Import ALL Abilities (GM)", "icons/svg/upgrade.svg", "cookbookImportAbilities", 310, FOLDERS.abilities),
    macro(
      "ackscMacEquipAll",
      "Import ALL Equipment (GM)",
      "icons/svg/item-bag.svg",
      `const api = globalThis.acksImporter;
if (!api) return ui.notifications.warn("acks-importer | module not ready (is it enabled?).");
if (typeof api.importAllEquipment !== "function") return ui.notifications.warn("acks-importer | Import ALL Equipment needs a newer build of this module.");
const r = await api.importAllEquipment();
ui.notifications.info(\`acks-importer | equipment: \${r.created} created, \${r.total} in the cookbook.\`);`,
      320,
      FOLDERS.abilities,
    ),
    apiMacro("ackscMacAbilUpd0", "Update Abilities in World (GM)", "icons/svg/regen.svg", "cookbookUpdateAbilities", 330, FOLDERS.abilities),
    apiMacro("ackscMacClassUpd", "Update Classes in World (GM)", "icons/svg/regen.svg", "cookbookUpdateClasses", 340, FOLDERS.abilities),
    apiMacro("ackscMacClassTpl", "Build Class Template Packages (GM)", "icons/svg/chest.svg", "importTemplatePackages", 350, FOLDERS.abilities),
    apiMacro("ackscMacAbilCmp0", "Fill Companion Slots (GM)", "icons/svg/pawprint.svg", "cookbookFillCompanions", 360, FOLDERS.abilities),

    /* --- 4 · Tools & Maintenance. --- */
    apiMacro("ackscMacOrganize", "Organize Cookbook Documents (GM)", "icons/svg/direction.svg", "cookbookOrganize", 400, FOLDERS.tools),
    apiMacro("ackscMacBrowse00", "Browse & Load a Page (GM)", "icons/svg/hanging-sign.svg", "browseAndLoad", 410, FOLDERS.tools),
    apiMacro("ackscMacStats000", "Apply Stats from Book (GM)", "icons/svg/combat.svg", "applyStats", 420, FOLDERS.tools),
    apiMacro("ackscMacCkDebug0", "Debug Raw Extraction (GM)", "icons/svg/eye.svg", "cookbookDebug", 430, FOLDERS.tools),
  ];
}

export const packs = {
  macros: buildMacros,
};
