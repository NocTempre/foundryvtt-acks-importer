/**
 * A keyed area becomes a PLACE, not a page of prose.
 *
 * The obvious binding for "1. Abandoned Storefront" is a journal page, and it
 * is the wrong one. In this family a place is an actor — `acks-extras.location`
 * — with a parent it sits inside, a roster of what lives there, contents, and
 * optionally a market. An area imported as prose can never grow any of that;
 * the Judge who later wants the storefront to hold the goods it sells, or to
 * nest under the dungeon it is part of, would have to build a second document
 * and keep the two in step by hand.
 *
 * So the room arrives as the thing a room is, and its TEXT arrives the way all
 * imported text does: read once from the Judge's own copy at import and written
 * into the room, page reference last.
 *
 * The adventure itself becomes a place too, and the rooms nest inside it. That
 * is what makes a keyed dungeon navigable as a dungeon rather than as
 * seventeen unrelated actors sharing a numbering convention.
 */

import { bookText } from "./prose.mjs";

/** The Actor sub-type acks-extras registers for places. */
export const LOCATION_TYPE = "acks-extras.location";

/**
 * Actor data for one keyed area. Pure — no Foundry calls.
 *
 * @param opts.entryId    cookbook id, stamped on the text this import writes
 * @param opts.paragraphs the room's printed text, one string per paragraph
 * @param opts.parentUuid the adventure's own location actor, when it exists
 * @returns Actor creation data of type `acks-extras.location`
 */
export function oseLocationData({
  name,
  entryId,
  paragraphs = [],
  cite = "",
  page = null,
  book = null,
  bookLabel = "",
  areaKey = "",
  parentUuid = "",
  folderId = null,
}) {
  return {
    name,
    type: LOCATION_TYPE,
    folder: folderId,
    system: {
      region: bookLabel,
      notes: bookText(paragraphs, cite || `${book ?? ""} p.${page ?? "?"}`.trim(), { id: entryId }),
      parentUuid,
    },
    flags: {
      "acks-importer": {
        ose: {
          entryId,
          kind: "area",
          areaKey,
          sourceId: book,
          sourceLabel: bookLabel,
          page,
          origin: "page",
          unaudited: true,
        },
      },
    },
  };
}

/**
 * Actor data for the adventure the areas belong to.
 *
 * Created so the rooms have something to nest under. It carries no prose of its
 * own — the book's introduction is not a place — only the identity that makes
 * the nesting mean something on the sheet.
 */
export function oseAdventureData({ book, bookLabel, folderId = null }) {
  return {
    name: bookLabel || book,
    type: LOCATION_TYPE,
    folder: folderId,
    system: { region: bookLabel, notes: "", parentUuid: "" },
    flags: { "acks-importer": { ose: { kind: "adventure", sourceId: book, sourceLabel: bookLabel, origin: "page" } } },
  };
}
