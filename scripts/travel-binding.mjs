/**
 * Travel-table assembly: the raw RR reads → the engine-shaped `travel`
 * ruledata tables acks-extras reads (its vehicle-speed derivations declare
 * them via `expectTables`). The raw tables keep the page's own grouping;
 * this step fans the terrain groups out to the terrain keys, splits the road
 * cell into its two rates, and strips the throw markers — judgments the
 * recipes must not make and the reader must not repeat. Like every binding
 * here, no value ships: everything is read live from the seat's own book and
 * persists only in their world.
 */
import { MODULE_ID } from "./constants.mjs";

/** The engine doc both halves agree on (acks-extras `expectTables`). */
export const TRAVEL_DOC_ID = "travel";

/**
 * Which terrain keys each printed GROUP row stands for. The grouping is the
 * page's; the key list is the engine's own terrain vocabulary — matching one
 * to the other is exactly the judgment a binder owns.
 */
export const TERRAIN_GROUP_KEYS = Object.freeze({
  grasslandScrubland: ["grassland", "scrubland"],
  barrensDesertHillsForest: ["barrens", "desert", "hills", "forest"],
  jungleMountainSwamp: ["jungle", "mountains", "swamp"],
  mudSnow: ["mud", "snow"],
});

/** "×2/3" → 2/3; "×1" → 1; junk → null — never a silent zero. */
export function parseMultiplier(cell) {
  const s = String(cell ?? "");
  const frac = /×?\s*(\d+)\s*\/\s*(\d+)/.exec(s);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const whole = /×?\s*(\d+(?:\.\d+)?)/.exec(s);
  return whole ? Number(whole[1]) : null;
}

/** The road cell carries both rates: a base one, and a driver's in parens. */
export function parseRoadCell(cell) {
  const s = String(cell ?? "");
  const paren = /\(([^)]*)\)/.exec(s);
  return {
    multiplier: parseMultiplier(paren ? s.slice(0, paren.index) : s),
    drivingMultiplier: paren ? parseMultiplier(paren[1]) : null,
  };
}

/** "11+" → 11; junk → null. */
export function parseThrow(cell) {
  const m = /(\d+)\s*\+/.exec(String(cell ?? ""));
  return m ? Number(m[1]) : null;
}

/**
 * A frequency cell onto the engine's cadence kinds (acks-extras'
 * ANCILLARY_ACTIVITIES vocabulary): "once per 6-mile hex" → perHex,
 * "once per hour" → perHour, "once per attempt" / "once per 6 traps" →
 * perAttempt, "once per 12 hours" / "once per 7 nights" → perPeriod with its
 * count, "none" → null. Junk → undefined, so a cell that did not read is
 * omitted rather than silently quiet.
 */
export function parseFrequencyCell(cell) {
  // Small-caps runs weld unpredictably ("o" + "nce per attempt"), so the
  // match runs on the cell's characters alone.
  const s = String(cell ?? "").toLowerCase().replace(/\s+/g, "");
  if (!s) return undefined;
  if (s === "none") return null;
  let m = /onceper(\d+)-?milehex/.exec(s);
  if (m) return { kind: "perHex", mileHex: Number(m[1]) };
  if (/onceperhour/.test(s)) return { kind: "perHour" };
  m = /onceper(\d+)traps/.exec(s);
  if (m) return { kind: "perAttempt", per: Number(m[1]) };
  if (/onceperattempt/.test(s)) return { kind: "perAttempt" };
  m = /onceper(\d+)hours/.exec(s);
  if (m) return { kind: "perPeriod", hours: Number(m[1]) };
  m = /onceper(\d+)nights/.exec(s);
  if (m) return { kind: "perPeriod", nights: Number(m[1]) };
  return undefined;
}

/**
 * The engine tables from the raw ones. Pure — the committed tests feed it
 * invented cells.
 *
 * `roads`: RR prints ONE road rate; the earthen-road-in-rain washout is
 * ch. 6 prose, so the earth row alone carries `ineffectiveIf: ["raining"]`.
 * The Judge's screen refines roads per kind (gravel, paved, their own null
 * conditions); that recipe REPLACES this whole table when it lands, which is
 * exactly how the registry's per-table merge behaves.
 */
export function assembleTravelTables(raw = {}) {
  const out = {};
  const groups = raw.terrainGroups;
  if (groups) {
    const terrainMultipliers = {};
    for (const [groupKey, keys] of Object.entries(TERRAIN_GROUP_KEYS)) {
      const v = parseMultiplier(groups[groupKey]?.multiplier);
      if (v != null) for (const k of keys) terrainMultipliers[k] = v;
    }
    if (Object.keys(terrainMultipliers).length) out.terrainMultipliers = terrainMultipliers;
    const road = parseRoadCell(groups.road?.multiplier);
    if (road.multiplier != null) {
      const row = (ineffectiveIf) => ({
        multiplier: road.multiplier,
        ...(road.drivingMultiplier != null ? { drivingMultiplier: road.drivingMultiplier } : {}),
        ineffectiveIf,
      });
      out.roads = { earth: row(["raining"]), gravel: row([]), paved: row([]) };
    }
  }
  const lost = raw.gettingLostRaw;
  if (lost) {
    const gettingLost = {};
    for (const [key, rowValue] of Object.entries(lost)) {
      const v = parseThrow(rowValue?.navigation);
      if (v != null) gettingLost[key] = v;
    }
    if (Object.keys(gettingLost).length) out.gettingLost = gettingLost;
  }
  const freq = raw.encounterFrequencyRaw;
  if (freq) {
    const encounterFrequency = {};
    for (const [activity, cells] of Object.entries(freq)) {
      const row = {};
      for (const territory of ["civilized", "borderlands", "outlands", "unsettled"]) {
        const v = parseFrequencyCell(cells?.[territory]);
        if (v !== undefined) row[territory] = v;
      }
      if (Object.keys(row).length) encounterFrequency[activity] = row;
    }
    if (Object.keys(encounterFrequency).length) out.encounterFrequency = encounterFrequency;
  }
  return out;
}

/**
 * Merge the engine-shaped tables into the imported `travel` doc — the
 * builder-binding pattern: raw tables stay beside the assembled ones, so a
 * re-import or a later recipe grows the doc instead of replacing it.
 */
export async function applyTravelImport() {
  const lib = globalThis.acksExtras?.lib;
  const svc = lib?.services?.get?.("ruledata-import");
  if (!svc || !lib.tables.hasDoc(TRAVEL_DOC_ID)) return { assembled: [] };
  const doc = lib.tables.getDoc(TRAVEL_DOC_ID);
  const engine = assembleTravelTables(doc.tables ?? {});
  if (!Object.keys(engine).length) return { assembled: [] };
  await svc.importDoc(
    { id: TRAVEL_DOC_ID, source: doc.source, tables: { ...(doc.tables ?? {}), ...engine } },
    { priority: lib.tables.PRIORITY.WORLD, source: MODULE_ID },
  );
  return { assembled: Object.keys(engine) };
}
