#!/usr/bin/env node
/*
  Replaces Tailwind gray text utilities with black in target directories.
  Targets: text-gray-900, text-gray-800, text-gray-700, text-gray-600, text-gray-500, text-gray-400
*/
const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  path.join(__dirname, '..', 'app', '(dashboard)')
];

const FILE_EXTS = new Set(['.tsx', '.ts', '.jsx', '.js']);

const REPLACEMENTS = [
  /text-gray-900/g,
  /text-gray-800/g,
  /text-gray-700/g,
  /text-gray-600/g,
  /text-gray-500/g,
  /text-gray-400/g,
];

let changedFiles = 0;
let changedOccurrences = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (FILE_EXTS.has(path.extname(entry.name))) {
      let content = fs.readFileSync(full, 'utf8');
      let modified = content;
      REPLACEMENTS.forEach((regex) => {
        modified = modified.replace(regex, 'text-black');
      });
      if (modified !== content) {
        fs.writeFileSync(full, modified, 'utf8');
        changedFiles += 1;
        // crude count: differences in length not accurate; count via matches
        REPLACEMENTS.forEach((regex) => {
          const matches = content.match(regex);
          if (matches) changedOccurrences += matches.length;
        });
      }
    }
  }
}

for (const dir of TARGET_DIRS) {
  if (fs.existsSync(dir)) walk(dir);
}