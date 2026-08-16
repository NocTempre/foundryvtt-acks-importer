/**
 * Module-owned extra validation, auto-run by the canonical tools/validate.mjs
 * (section 9) so `npm run validate` also enforces the checks specific to
 * acks-importer. Inline checks first, then the delegated tools. Exit non-zero
 * on failure.
 *
 *   stale identity      The repo was created from acks-content and the rename
 *                       was once id-and-title only; every acks-content /
 *                       acksContent / ACKS-CONTENT survivor in code is a
 *                       silent no-op (a lang key that resolves to nothing, a
 *                       CSS class no selector matches, a global that does not
 *                       exist). History files may narrate the old name.
 *   icon existence      img/icon path literals must resolve — module paths
 *                       in-repo, core/system paths against a discoverable
 *                       install/checkout, with a skip notice when absent.
 *   lint-register       IP + schema lint of register/ and cookbook/. No PDFs,
 *                       runs everywhere including CI (`npm run lint:register`).
 *   check-prose-boxes    Does each definition's description come from the
 *                       column its own heading starts? Pure geometry, no PDFs.
 *   check-cookbook-drift  Is the committed cookbook/ what register/ compiles
 *                       to? Needs the local reference PDFs and skips cleanly
 *                       without them, so it gates the authoring machines only.
 *
 * Cheapest and most universal first: a register that fails its lint should say
 * so in a second, not after a 40s recompile.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
let failed = false;
const fail = (msg) => {
  console.error(`FAIL validate-extra: ${msg}`);
  failed = true;
};
const walk = (d) =>
  fs.existsSync(d)
    ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
      )
    : [];
const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");

/* 1. No stale pre-rename identity in code. Self-exempt (this regex), and
 * CHANGELOG/docs may narrate the old name as history. */
{
  const STALE = /acks-content|acksContent|ACKS-CONTENT/;
  const SELF = new Set(["tools/validate-extra.mjs"]);
  for (const dir of ["scripts", "styles", "lang", "tools", "register", "cookbook", "packs/_source"]) {
    for (const f of walk(path.join(ROOT, dir))) {
      if (!/\.(mjs|css|json|hbs)$/.test(f)) continue;
      if (SELF.has(rel(f))) continue;
      fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        if (STALE.test(line)) fail(`${rel(f)}:${i + 1} still carries the pre-rename identity — ${line.trim().slice(0, 90)}`);
      });
    }
  }
}

/* 2. Icon paths resolve (same contract as acks-extras' validate-extra §6). */
{
  const FOUNDRY_PUBLIC = [
    "C:/Program Files/Foundry Virtual Tabletop/resources/app/public",
  ].find((p) => fs.existsSync(path.join(p, "icons")));
  const SYSTEM_SRC = [path.join(ROOT, "..", "foundryvtt-acks-core", "src")].find((p) =>
    fs.existsSync(path.join(p, "assets"))
  );
  const skipped = new Set();
  const seen = new Set();
  for (const dir of ["tools", "scripts", "register"]) {
    for (const f of walk(path.join(ROOT, dir))) {
      if (!/\.(mjs|json)$/.test(f)) continue;
      const text = fs.readFileSync(f, "utf8");
      for (const m of text.matchAll(/["'`]((?:icons|systems|modules)\/[^"'`\n${]+\.(?:svg|webp|png|jpg|jpeg))["'`]/g)) {
        const p = m[1];
        if (seen.has(p)) continue;
        seen.add(p);
        let resolved;
        if (p.startsWith("modules/acks-importer/")) resolved = path.join(ROOT, p.replace("modules/acks-importer/", ""));
        else if (p.startsWith("icons/")) resolved = FOUNDRY_PUBLIC ? path.join(FOUNDRY_PUBLIC, p) : null;
        else if (p.startsWith("systems/acks/")) resolved = SYSTEM_SRC ? path.join(SYSTEM_SRC, p.replace("systems/acks/", "")) : null;
        else continue; // another module's path (e.g. game-icons-net) — optional by design
        if (resolved === null) {
          skipped.add(p.split("/")[0]);
          continue;
        }
        if (!fs.existsSync(resolved)) fail(`${rel(f)}: icon path does not exist — ${p}`);
      }
    }
  }
  if (skipped.size) console.log(`validate-extra: icon check skipped for ${[...skipped].join(", ")} paths (no install/checkout found)`);
}

if (failed) {
  console.error("validate-extra: inline guards FAILED");
  process.exit(1);
}

// Re-exec so each check's own output surfaces and its non-zero exit propagates
// (execFileSync throws, this process exits non-zero). Sequential and
// fail-fast: a drift report is noise while the register itself is broken.
for (const tool of ["lint-register.mjs", "audit-transcription.mjs", "check-prose-boxes.mjs", "check-cookbook-drift.mjs"]) {
  execFileSync(process.execPath, [path.join(ROOT, "tools", tool)], { stdio: "inherit" });
}
