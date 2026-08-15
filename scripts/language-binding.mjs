/* global game, Item */
/**
 * The language taxonomy, materialized into a world from the seat's own book.
 *
 * READ AND REGISTER, not transcribe. The recipe in `table-recipes.mjs` carries
 * a heading, two x-bands and an indent step — no names — so the taxonomy is
 * extracted from the reader's own Revised Rulebook at import time and turned
 * into ability items here. Nothing about which languages exist, or what each
 * descends from, is in this repo.
 *
 * That is the whole reason a language does not get one register entry apiece
 * like a power or a proficiency. Those entries anchor on a printed name
 * because they have a MECHANIC to bind to and the name is an index into it. A
 * language has no mechanic: its entry would be a name and nothing else, and
 * fifty-eight of those is not a way of finding the list, it is the list.
 *
 * The ids are derived from the extracted names at RUNTIME, in the world doing
 * the importing. A derived id is not shipped content.
 */

const MODULE_ID = "acks-importer";
const ABILITY_TYPE = "ability";

/** The ruledata doc the languages recipe imports into. */
export const LANGUAGES_DOC_ID = "acks.languages";

/**
 * A stable id for one extracted row: `def.lang.` plus the name camelCased.
 *
 * Derived in the seat's own world from the seat's own book, so re-importing
 * lands on the same item rather than minting a twin, and two worlds owning the
 * same book agree without either of them having been told the answer.
 */
export function languageId(name) {
  const slug = String(name ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join("");
  return slug ? `def.lang.${slug}` : null;
}

/**
 * Turn extracted rows into ability items of category `language`.
 *
 * Descent is kept as the PARENT'S ID rather than as an index, because indices
 * are meaningful only inside one extraction and a world may re-import against
 * a differently-paginated printing.
 *
 * @param {{rows: object[]}} table the extracted taxonomy
 * @returns {object[]} item data, ready to create
 */
export function languageItems(table) {
  const rows = table?.rows ?? [];
  const ids = rows.map((r) => languageId(r.name));
  return rows
    .map((row, i) => {
      const id = ids[i];
      if (!id) return null;
      const parentId = row.parent != null ? ids[row.parent] : null;
      return {
        name: row.name,
        type: ABILITY_TYPE,
        system: { category: "language" },
        flags: {
          [MODULE_ID]: {
            cookbook: { id },
            language: {
              // What the book prints beside it, and where it sits in the tree.
              counterpart: row.counterpart ?? "",
              depth: row.depth,
              parent: parentId,
            },
          },
        },
      };
    })
    .filter(Boolean);
}

/**
 * Create (or leave alone) one ability item per extracted language.
 *
 * Idempotent on the derived id, so importing twice does not double the world's
 * languages — the same guard every other importer path uses.
 *
 * @returns {Promise<{created: number, present: number}>}
 */
export async function applyLanguageImport(table) {
  const wanted = languageItems(table);
  if (!wanted.length) return { created: 0, present: 0 };
  const have = new Set(
    game.items
      .filter((i) => i.type === ABILITY_TYPE)
      .map((i) => i.flags?.[MODULE_ID]?.cookbook?.id)
      .filter(Boolean),
  );
  const todo = wanted.filter((d) => !have.has(d.flags[MODULE_ID].cookbook.id));
  if (todo.length) await Item.createDocuments(todo);
  return { created: todo.length, present: wanted.length - todo.length };
}
