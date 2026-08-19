/**
 * Judge-registered OSE sources.
 *
 * `scripts/books.mjs` is a shipped registry of the handful of ACKS books this
 * module has recipes for, hand-authored against one exact printing. That model
 * cannot hold third-party adventures: there are thousands of them, nobody has
 * authored geometry for any of them, and a module cannot ship a list of other
 * publishers' books anyway. So a source is registered by the Judge, in the
 * world, and nothing about it is ever shipped.
 *
 * The fingerprint is deliberately weaker than a book's, and for a reason. Page
 * count is primary because it survives the per-customer watermarking that
 * makes bytes useless, and because it is the one thing a Judge can read off
 * any PDF. The metadata title is EVIDENCE ONLY: one of the sample books
 * carries its author's word-processor filename there, so a registry that
 * trusted titles would mis-name it. And where a book's identity is refused on
 * ambiguity, a source's is resolved by ASKING — the Judge knows which file
 * they just picked, and two adventures of the same length is an ordinary
 * situation rather than an error.
 */
import { MODULE_ID } from "./constants.mjs";
import { OSE_CANONICAL, resolveProfile } from "./ose-statline.mjs";
import { LINEAGES } from "./ose-convert.mjs";

export const SETTING_OSE_SOURCES = "oseSources";
/** Source ids are namespaced so they can never collide with a shipped book id. */
export const OSE_PREFIX = "ose.";

/** Register the world store. Called from the module's `init` hook. */
export function registerOseSourceSetting() {
  game.settings.register(MODULE_ID, SETTING_OSE_SOURCES, {
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });
}

export const oseSources = () => game.settings.get(MODULE_ID, SETTING_OSE_SOURCES) ?? {};
export const oseSource = (id) => oseSources()[id] ?? null;

/** Slug a Judge-typed label into an `ose.*` id, kept unique against the store. */
export function oseIdFor(label, existing = {}) {
  const base =
    String(label ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "source";
  let id = `${OSE_PREFIX}${base}`;
  let n = 2;
  while (existing[id]) id = `${OSE_PREFIX}${base}-${n++}`;
  return id;
}

/**
 * Evidence that a file is a registered source, strongest first.
 *
 * Returns every candidate with the reason it matched rather than a single
 * answer, because the caller's job is to show the Judge what was found — not
 * to decide on their behalf.
 */
export function matchOseSources(sources, { pages, title, fileName, fileSize }) {
  const rows = Object.values(sources ?? {});
  const out = [];
  for (const s of rows) {
    const why = [];
    if (fileName && s.fileName && s.fileName === fileName) why.push("same file name");
    if (fileSize && s.fileSize && s.fileSize === fileSize) why.push("same size");
    if (Number.isFinite(pages) && s.pages === pages) why.push("same page count");
    if (title && s.metaTitle && s.metaTitle === title) why.push("same document title");
    if (why.length) out.push({ id: s.id, source: s, why, score: why.length });
  }
  return out.sort((a, b) => b.score - a.score);
}

/**
 * The one unambiguous match, or null.
 *
 * A page-count match ALONE is not enough to reopen a source unattended: two
 * adventures of the same length are common, and silently attaching one book's
 * confirmed block boxes to another book would import a different creature at
 * every one of them.
 */
export function identifyOseSource(sources, evidence) {
  const hits = matchOseSources(sources, evidence);
  if (hits.length !== 1) return null;
  return hits[0].score > 1 ? hits[0].id : null;
}

/** A new source record. `profile` and `blocks` start empty — both are learned. */
export function makeOseSource({ id, label, lineage = "ose", pages, metaTitle, fileName, fileSize, addedBy }) {
  return {
    id,
    label: String(label ?? "").trim(),
    lineage,
    pages: Number.isFinite(pages) ? pages : null,
    metaTitle: metaTitle ?? "",
    fileName: fileName ?? "",
    fileSize: Number.isFinite(fileSize) ? fileSize : null,
    profile: { base: id },
    blocks: {},
    addedBy: addedBy ?? "",
    addedAt: new Date().toISOString(),
  };
}

/** Validate a record before it is written. Returns a list of problems. */
export function checkOseSource(rec) {
  const problems = [];
  if (!rec?.id?.startsWith(OSE_PREFIX)) problems.push(`id must start with "${OSE_PREFIX}"`);
  if (!rec?.label) problems.push("a name is required — the file's own title is not reliable");
  if (!LINEAGES[rec?.lineage]) problems.push(`unknown lineage "${rec?.lineage}"`);
  if (rec?.pages != null && !Number.isInteger(rec.pages)) problems.push("page count must be a whole number");
  return problems;
}

export async function saveOseSource(rec) {
  const all = { ...oseSources() };
  all[rec.id] = rec;
  await game.settings.set(MODULE_ID, SETTING_OSE_SOURCES, all);
  return rec;
}

export async function deleteOseSource(id) {
  const all = { ...oseSources() };
  delete all[id];
  await game.settings.set(MODULE_ID, SETTING_OSE_SOURCES, all);
}

/** The resolved grammar profile for a source (canonical + its own overrides). */
export const profileFor = (rec) => resolveProfile(rec?.profile ?? null);

/**
 * Teach one source a label spelling.
 *
 * Confined to a single source ON PURPOSE. Widening the shared grammar because
 * one book heads its hit dice differently would turn one confirmed reading of
 * that book into an unverified claim about every other book — which is the
 * failure this project has recorded against itself more than once. A spelling
 * learned here changes how THAT source parses and nothing else.
 */
export function learnLabel(rec, key, spelling) {
  if (!key || !spelling) return rec;
  if (!Object.hasOwn(OSE_CANONICAL.labels, key)) return rec;
  const profile = { ...(rec.profile ?? { base: rec.id }) };
  const labels = { ...(profile.labels ?? {}) };
  const current = labels[key] ?? OSE_CANONICAL.labels[key] ?? [];
  if (current.some((s) => s.toLowerCase() === String(spelling).toLowerCase())) return rec;
  labels[key] = [...current, String(spelling)];
  profile.labels = labels;
  return { ...rec, profile };
}

/** Record the boxes a Judge confirmed on one page. */
export function rememberBlocks(rec, page, blocks) {
  return { ...rec, blocks: { ...(rec.blocks ?? {}), [String(page)]: blocks } };
}
