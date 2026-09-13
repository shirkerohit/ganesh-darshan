#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const CORE_PATH = join(ROOT, "js", "data", "core.json");
const CONTRIB_DIR = join(ROOT, "js", "data", "contributions");
const MANDALS_JS_PATH = join(ROOT, "js", "data", "mandals.js");
const INDEX_PATH = join(ROOT, "index.html");

const CATEGORIES = new Set([
  "Most Famous",
  "South Indian Traditional",
  "Heritage & Oldest",
  "Suburban Favourite",
  "Biggest Idol",
  "City & Periphery",
]);

const REQUIRED_FIELDS = [
  "name",
  "area",
  "category",
  "established",
  "lat",
  "lng",
  "approx",
  "address",
];

const RECOMMENDED_FIELDS = ["idol", "darshan", "aarti", "tips", "history", "highlights"];

const USAGE = `Usage: node scripts/data.mjs <check|probe|build>`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function validateEntry(entry, source, coreNames, errors, warnings) {
  const label = source + (entry.name ? ` (${entry.name})` : "");

  // No id in contributions
  if (source.startsWith("contributions/") && entry.id !== undefined) {
    errors.push(`${label}: must not contain "id" (assigned at merge)`);
  }

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (entry[field] === undefined || entry[field] === null) {
      errors.push(`${label}: missing required field "${field}"`);
      continue;
    }
  }

  // name: non-empty string
  if (typeof entry.name !== "string" || entry.name.trim() === "") {
    errors.push(`${label}: "name" must be a non-empty string`);
  } else if (coreNames.has(entry.name.trim())) {
    if (source.startsWith("contributions/")) {
      warnings.push(`${label}: duplicate name, skipping (already in core)`);
    } else {
      errors.push(`${label}: duplicate name within core`);
    }
  } else {
    coreNames.add(entry.name.trim());
  }

  // area: non-empty string
  if (typeof entry.area !== "string" || entry.area.trim() === "") {
    errors.push(`${label}: "area" must be a non-empty string`);
  }

  // category: string in allowlist
  if (typeof entry.category !== "string") {
    errors.push(`${label}: "category" must be a string`);
  } else if (!CATEGORIES.has(entry.category)) {
    errors.push(`${label}: "category" "${entry.category}" not in allowlist [${[...CATEGORIES].join(", ")}]`);
  }

  // established: integer 1800-2026
  if (typeof entry.established !== "number" || !Number.isInteger(entry.established)) {
    errors.push(`${label}: "established" must be an integer`);
  } else if (entry.established < 1800 || entry.established > 2026) {
    errors.push(`${label}: "established" must be between 1800 and 2026 (got ${entry.established})`);
  }

  // lat: number 18.9-19.3
  if (typeof entry.lat !== "number") {
    errors.push(`${label}: "lat" must be a number`);
  } else if (entry.lat < 18.9 || entry.lat > 19.3) {
    errors.push(`${label}: "lat" must be between 18.9 and 19.3 (got ${entry.lat})`);
  }

  // lng: number 72.8-73.2
  if (typeof entry.lng !== "number") {
    errors.push(`${label}: "lng" must be a number`);
  } else if (entry.lng < 72.8 || entry.lng > 73.2) {
    errors.push(`${label}: "lng" must be between 72.8 and 73.2 (got ${entry.lng})`);
  }

  // approx: boolean
  if (typeof entry.approx !== "boolean") {
    errors.push(`${label}: "approx" must be a boolean`);
  }

  // address: non-empty string
  if (typeof entry.address !== "string" || entry.address.trim() === "") {
    errors.push(`${label}: "address" must be a non-empty string`);
  }

  // image: string or array of strings (each http(s) URL or empty)
  if (entry.image !== undefined && entry.image !== "") {
    const isValidUrl = (v) => typeof v === "string" && (v === "" || /^https?:\/\//.test(v));
    if (Array.isArray(entry.image)) {
      for (const u of entry.image) {
        if (!isValidUrl(u)) {
          errors.push(`${label}: "image" array entry must be an http(s) URL or empty string (got "${u}")`);
          break;
        }
      }
    } else if (typeof entry.image !== "string") {
      errors.push(`${label}: "image" must be a string or array of strings`);
    } else if (!isValidUrl(entry.image)) {
      errors.push(`${label}: "image" must be an http(s) URL or empty string`);
    }
  }

  // Optional rich-recommended fields
  for (const field of RECOMMENDED_FIELDS) {
    if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
      warnings.push(`${label}: missing recommended field "${field}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdCheck() {
  console.log("check: reading core.json...");
  const core = readJSON(CORE_PATH);
  console.log(`check: core.json loaded (${core.length} mandals).`);
  console.log("check: OK (use probe for full validation).");
}

function cmdProbe() {
  const errors = [];
  const warnings = [];
  const coreNames = new Set();

  // Read core
  const core = readJSON(CORE_PATH);
  console.log(`probe: core.json loaded (${core.length} mandals).`);

  // Validate core
  for (const entry of core) {
    validateEntry(entry, "core.json", coreNames, errors, warnings);
  }

  // Read contributions
  let contribCount = 0;
  let skipped = 0;
  const newEntries = [];

  try {
    const files = readdirSync(CONTRIB_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const filePath = join(CONTRIB_DIR, file);
      let entries;
      try {
        entries = readJSON(filePath);
      } catch (err) {
        errors.push(`${file}: invalid JSON — ${err.message}`);
        continue;
      }
      if (!Array.isArray(entries)) {
        errors.push(`${file}: expected JSON array`);
        continue;
      }
      for (const entry of entries) {
        contribCount++;
        const nameCount = coreNames.size;
        validateEntry(entry, `contributions/${file}`, coreNames, errors, warnings);
        if (coreNames.size > nameCount) {
          newEntries.push(entry);
        } else {
          skipped++;
        }
      }
    }
  } catch {
    // contributions dir may not exist or be empty
  }

  // Build merged array in memory
  const merged = [
    ...core.map((e, i) => ({ ...e, id: i + 1 })),
    ...newEntries.map((e, i) => ({ ...e, id: core.length + i + 1 })),
  ];

  // Verify merged array is valid JSON
  const jsonStr = JSON.stringify(merged, null, 2);
  JSON.parse(jsonStr);

  // Print warnings
  for (const w of warnings) {
    console.warn(`  WARN: ${w}`);
  }

  // Print errors
  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`  ERROR: ${e}`);
    }
    console.error(`\nprobe: FAILED — ${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(1);
  }

  console.log(`\nprobe: PASSED`);
  console.log(`  Core mandals:        ${core.length}`);
  console.log(`  Contribution files:  ${contribCount > 0 ? contribCount : 0} entries`);
  console.log(`  Skipped (dupes):     ${skipped}`);
  console.log(`  New contributions:   ${newEntries.length}`);
  console.log(`  Merged total:        ${merged.length}`);
  console.log(`  JSON valid:          yes`);
  if (warnings.length > 0) {
    console.log(`  Warnings:            ${warnings.length}`);
  }
  process.exit(0);
}

function cmdBuild() {
  const errors = [];
  const warnings = [];
  const coreNames = new Set();

  // Read core
  const core = readJSON(CORE_PATH);
  console.log(`build: core.json loaded (${core.length} mandals).`);

  // Validate core
  for (const entry of core) {
    validateEntry(entry, "core.json", coreNames, errors, warnings);
  }

  // Read contributions
  let contribCount = 0;
  let skipped = 0;
  const newEntries = [];

  try {
    const files = readdirSync(CONTRIB_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const filePath = join(CONTRIB_DIR, file);
      let entries;
      try {
        entries = readJSON(filePath);
      } catch (err) {
        errors.push(`${file}: invalid JSON — ${err.message}`);
        continue;
      }
      if (!Array.isArray(entries)) {
        errors.push(`${file}: expected JSON array`);
        continue;
      }
      for (const entry of entries) {
        contribCount++;
        const nameCount = coreNames.size;
        validateEntry(entry, `contributions/${file}`, coreNames, errors, warnings);
        if (coreNames.size > nameCount) {
          newEntries.push(entry);
        } else {
          skipped++;
        }
      }
    }
  } catch {
    // contributions dir may not exist or be empty
  }

  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`  ERROR: ${e}`);
    }
    console.error(`\nbuild: FAILED — ${errors.length} error(s)`);
    process.exit(1);
  }

  // Build merged array
  const merged = [
    ...core.map((e, i) => ({ ...e, id: i + 1 })),
    ...newEntries.map((e, i) => ({ ...e, id: core.length + i + 1 })),
  ];

  // Verify valid JSON
  const jsonStr = JSON.stringify(merged, null, 2);
  JSON.parse(jsonStr);

  // ---- Write mandals.js ----
  const mandalsJs = `window.MANDALS = ${jsonStr};\n`;
  writeFileSync(MANDALS_JS_PATH, mandalsJs, "utf8");
  console.log(`build: wrote ${MANDALS_JS_PATH} (${merged.length} mandals)`);

  // ---- Regenerate JSON-LD in index.html ----
  const ldItems = merged.map((m, idx) => {
    const desc = (m.idol || "").slice(0, 160);
    return {
      "@type": "ListItem",
      position: idx + 1,
      name: m.name,
      item: {
        "@type": "TouristAttraction",
        name: m.name,
        description: desc,
        category: m.category,
        address: m.address,
        geo: {
          "@type": "GeoCoordinates",
          latitude: m.lat,
          longitude: m.lng,
        },
      },
    };
  });

  const ldJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Ganpati Darshan",
        alternateName: "Mumbai Ganesh Mandal Guide",
        url: "https://shirkerohit.github.io/ganapati-darshan/",
        inLanguage: "en",
        description:
          "Interactive guide to the top Ganesh (Ganpati) mandals of Mumbai and MMR with darshan timings, aarti schedules, idol details, visiting tips and directions.",
      },
      {
        "@type": "ItemList",
        name: "Top Ganesh Mandals of Mumbai & MMR",
        itemListElement: ldItems,
      },
    ],
  };

  const ldScript = `<script type="application/ld+json">\n${JSON.stringify(ldJson, null, 2)}\n  </script>`;

  let html = readFileSync(INDEX_PATH, "utf8");
  const ldRegex = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
  if (ldRegex.test(html)) {
    html = html.replace(ldRegex, ldScript);
    console.log("build: replaced JSON-LD block in index.html");
  } else {
    console.warn("build: WARNING — could not find JSON-LD block in index.html");
  }

  // ---- Regenerate noscript SEO list ----
  const noscriptOlRegex = /(<ol>\s*\n)([\s\S]*?)(\s*<\/ol>)/;
  if (noscriptOlRegex.test(html)) {
    const olContent = merged
      .map(
        (m) =>
          `        <li><strong>${escapeHtml(m.name)}</strong> — ${escapeHtml(m.area)}, ${escapeHtml(m.category)}</li>`
      )
      .join("\n");
    html = html.replace(noscriptOlRegex, `$1${olContent}\n$3`);
    console.log("build: replaced noscript <ol> in index.html");
  } else {
    console.warn("build: WARNING — could not find noscript <ol> in index.html");
  }

  writeFileSync(INDEX_PATH, html, "utf8");
  console.log(`build: wrote ${INDEX_PATH}`);

  // Print warnings
  for (const w of warnings) {
    console.warn(`  WARN: ${w}`);
  }

  console.log(`\nbuild: DONE`);
  console.log(`  Core mandals:        ${core.length}`);
  console.log(`  Contribution entries: ${contribCount}`);
  console.log(`  Skipped (dupes):     ${skipped}`);
  console.log(`  New contributions:   ${newEntries.length}`);
  console.log(`  Merged total:        ${merged.length}`);
  if (warnings.length > 0) {
    console.log(`  Warnings:            ${warnings.length}`);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const cmd = process.argv[2];

switch (cmd) {
  case "check":
    cmdCheck();
    break;
  case "probe":
    cmdProbe();
    break;
  case "build":
    cmdBuild();
    break;
  default:
    console.error(USAGE);
    process.exit(1);
}
