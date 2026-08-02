export const MODULE_ID = "acks-importer";
export const LANG_PREFIX = "ACKS-IMPORTER";

/**
 * Namespacing (see acks-module-template docs/TOOLCHAIN.md — enforced by
 * tools/validate.mjs): identifiers in shared registries carry the module key.
 * MODULE_KEY prefixes pack document _ids (declared in module.json
 * flags["acks-importer"].idPrefix). It stays "acksc" — _id IS identity, and
 * renaming it would duplicate every already-imported macro.
 */
export const MODULE_KEY = "acksc";
