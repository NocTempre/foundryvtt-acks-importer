/**
 * First-launch "Getting Started" dialog.
 *
 * A new seat lands in a world with no book connected and (often) no content
 * imported, and nothing on screen says what to do about it. This dialog is
 * that missing explanation: it auto-opens on join for a seat with no book
 * open or remembered (until dismissed), walks the player through connecting
 * their own PDFs, and — for the GM — offers the one-click "import everything"
 * chain over the cookbook importers, all of which are idempotent, so the
 * button is safe to press on every world and safe to press twice.
 *
 * All work happens through the public api (game.modules.get(id).api), the
 * same surface the shipped macros use — this file adds no import machinery,
 * only a front door to it.
 */

import { MODULE_ID, LANG_PREFIX } from "./constants.mjs";
import { dialogContent } from "./module.mjs";

const SETTING_DISMISSED = "gettingStartedDismissed";

const t = (key, data) =>
  data ? game.i18n.format(`${LANG_PREFIX}.gs.${key}`, data) : game.i18n.localize(`${LANG_PREFIX}.gs.${key}`);

/** init-time: the dismissal flag is per-seat (client), togglable in settings. */
export function registerGettingStartedSettings() {
  game.settings.register(MODULE_ID, SETTING_DISMISSED, {
    name: `${LANG_PREFIX}.gs.settingName`,
    hint: `${LANG_PREFIX}.gs.settingHint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });
}

/**
 * The GM chain, in dependency order — every importer the module ships, in the
 * order that lands prerequisites first:
 *
 *  1. abilities   — proficiencies, powers and skills; everything below resolves
 *                   its ability tokens against these shared items;
 *  2. equipment   — the shop list, the weapon and armour grids, and the animals;
 *  3. classes     — a class's proficiency awards and starting kit are refs into
 *                   the two above, so a class imported first points at nothing;
 *  4. monsters    — resolve their ability tokens against 1;
 *  5. companions  — an ability's companion slot points at a creature, and
 *                   abilities were imported before any creature existed, so the
 *                   link can only be made once 4 has run;
 *  6. journals + roll tables — reference the creatures imported in 4;
 *  7. rules tables — last (they warn by themselves if the provider is absent).
 *
 * A step missing from this list is a step a GM can only reach by hunting for
 * its macro — which is how the class import came to be run by hand, repeatedly.
 * Each step is idempotent and reports through its own notifications; this only
 * sequences them and narrates which one is running.
 */
const GM_STEPS = [
  ["stepAbilities", (api) => api.cookbookImportAbilities()],
  ["stepEquipment", (api) => api.importAllEquipment()],
  // Variations go ON the gear imported above, so they follow it. Traps and
  // vehicles depend on nothing; each needs ACKS Extras for its document type
  // and says so itself when it is absent.
  ["stepVariations", (api) => api.importVariations()],
  ["stepTraps", (api) => api.importTraps()],
  ["stepVehicles", (api) => api.importVehicles()],
  ["stepClasses", (api) => api.importClasses()],
  // Template packages resolve their gear against the equipment imported above
  // and their rows against the classes just landed — so they follow both.
  // Also the upgrade path for a world whose classes were imported before
  // packages existed (importClasses skips classes already present, so it
  // alone never revisits them).
  ["stepTemplatePackages", (api) => api.importTemplatePackages()],
  ["stepMonsters", (api) => api.cookbookImportMonsters()],
  ["stepCompanions", (api) => api.cookbookFillCompanions()],
  ["stepJournals", (api) => api.cookbookImportJournals()],
  ["stepRollTables", (api) => api.cookbookImportRollTables()],
  ["stepTables", (api) => api.cookbookImportTables()],
];

async function runImportEverything(root) {
  const api = game.modules.get(MODULE_ID)?.api;
  if (!api) return ui.notifications.warn("acks-importer | module not ready.");
  const status = root.querySelector("[data-gs-import-status]");
  const button = root.querySelector("[data-gs-import]");
  if (button) button.disabled = true;
  try {
    for (const [key, run] of GM_STEPS) {
      if (status) status.textContent = t(key);
      // One failed step must not silence the rest — each importer covers a
      // different document type and they share no state beyond the world.
      try {
        await run(api);
      } catch (err) {
        console.error(`${MODULE_ID} | getting started: ${key}`, err);
        ui.notifications.error(`acks-importer | ${t(key)}: ${err.message}`);
      }
    }
    if (status) status.textContent = t("importDone");
  } finally {
    if (button) button.disabled = false;
  }
}

/**
 * Show the dialog. `force` skips the auto-open conditions (macro / settings
 * re-entry); auto callers pass nothing and may get a silent no-op.
 */
export async function showGettingStarted({ force = false } = {}) {
  // The caller (module.mjs ready hook) only auto-calls this for a seat with
  // no book open or remembered — a returning seat gets the reconnect dialog
  // instead, never both. This guard is just the per-seat opt-out.
  if (!force && game.settings.get(MODULE_ID, SETTING_DISMISSED)) return;
  const esc = foundry.utils.escapeHTML ?? ((s) => s);
  const isGM = game.user.isGM;

  const gmSection = isGM
    ? `<h3>${t("gmHead")}</h3>
       <p>${t("gmBody")}</p>
       <div class="acks-importer-gs-action">
         <button type="button" data-gs-import><i class="fa-solid fa-download"></i> ${t("gmGo")}</button>
         <span class="notes" data-gs-import-status></span>
       </div>`
    : "";

  const content = `<div class="acks-importer-gs">
    <p>${t("intro")}</p>
    <h3>${t("connectHead")}</h3>
    <p>${t("connectBody")}</p>
    <div class="acks-importer-gs-action">
      <button type="button" data-gs-connect><i class="fa-solid fa-book-open"></i> ${t("connectGo")}</button>
    </div>
    ${gmSection}
    <p class="notes">${t("later", { folder: esc("ACKS Importer — Macros") })}</p>
    <label class="acks-importer-gs-dismiss">
      <input type="checkbox" name="dismiss"> ${t("dismiss")}
    </label>
  </div>`;

  return foundry.applications.api.DialogV2.prompt({
    window: { title: t("title") },
    classes: ["acks-ui", "acks-importer-dialog"],
    position: { width: 460 },
    content: dialogContent(content),
    rejectClose: false,
    ok: { label: t("ok") },
    render: (event, dialog) => {
      const root = dialog.element ?? dialog;
      root.querySelector("[data-gs-connect]")?.addEventListener("click", () => {
        const a = game.modules.get(MODULE_ID)?.api;
        if (a?.connectBook) a.connectBook();
      });
      root.querySelector("[data-gs-import]")?.addEventListener("click", () => runImportEverything(root));
      // The checkbox persists the moment it is toggled: DialogV2.prompt closed
      // via Escape/X never reads the form, and "don't show this again" must
      // stick however the reader leaves.
      root.querySelector("input[name=dismiss]")?.addEventListener("change", (ev) => {
        game.settings.set(MODULE_ID, SETTING_DISMISSED, ev.currentTarget.checked);
      });
    },
  });
}
