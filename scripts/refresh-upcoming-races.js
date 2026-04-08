#!/usr/bin/env node
/*
 * refresh-upcoming-races.js
 *
 * Applies a new `data/races-upcoming.json` on top of the current one, and
 * preserves any race that "fell off" the upcoming window by copying it into
 * the year-specific archive file (data/races-YYYY.json) before the overwrite.
 *
 * This keeps shareable race.html?id=... URLs alive forever: a race that has
 * happened and is no longer upcoming can still be resolved via its archive.
 *
 * Usage:
 *   node scripts/refresh-upcoming-races.js <path-to-new-upcoming-json>
 *
 * The input file should be the JSON array that came out of the weekly
 * research prompt on claude.ai. The script is idempotent: running it twice
 * with the same input is safe.
 *
 * Exit codes:
 *   0  success
 *   1  usage error / file missing / malformed JSON
 *   2  semantic validation failed (not an array, etc.)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(REPO_ROOT, 'data');
const UPCOMING_PATH = path.join(DATA_DIR, 'races-upcoming.json');

function die(code, msg) {
  process.stderr.write(msg + '\n');
  process.exit(code);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    die(1, 'file not found: ' + filePath);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    die(1, 'invalid JSON in ' + filePath + ': ' + e.message);
  }
}

function writeJson(filePath, data) {
  // Two-space indent, trailing newline — matches the existing data files.
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function yearOf(race) {
  const d = race && race.date;
  if (typeof d !== 'string' || !/^\d{4}-/.test(d)) return null;
  return d.slice(0, 4);
}

function main() {
  const newPath = process.argv[2];
  if (!newPath) {
    die(1, 'usage: node scripts/refresh-upcoming-races.js <new-upcoming-json>');
  }

  const newRaces = readJson(path.resolve(newPath));
  if (!Array.isArray(newRaces)) {
    die(2, 'new upcoming JSON must be a top-level array');
  }
  // Every race needs at least an id and a date so we can diff and archive it.
  for (const r of newRaces) {
    if (!r || typeof r.id !== 'string' || typeof r.date !== 'string') {
      die(2, 'every race must have string `id` and `date` fields');
    }
  }

  const oldRaces = readJson(UPCOMING_PATH, []);
  if (!Array.isArray(oldRaces)) {
    die(2, 'existing ' + UPCOMING_PATH + ' is not an array');
  }

  const newIds = new Set(newRaces.map((r) => r.id));
  const disappeared = oldRaces.filter((r) => !newIds.has(r.id));

  // Group disappeared races by the year embedded in their date. Races whose
  // date can't be parsed (unlikely — they're already in the current file)
  // are reported and skipped rather than silently dropped.
  const byYear = new Map();
  const skipped = [];
  for (const r of disappeared) {
    const y = yearOf(r);
    if (!y) {
      skipped.push(r);
      continue;
    }
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(r);
  }

  // Merge each year's disappeared races into data/races-YYYY.json, deduping
  // by id (so the script is idempotent on re-runs) and sorting by date so
  // the archive stays human-scannable.
  const archiveReport = [];
  for (const [year, races] of byYear) {
    const archivePath = path.join(DATA_DIR, `races-${year}.json`);
    const existing = readJson(archivePath, []);
    if (!Array.isArray(existing)) {
      die(2, archivePath + ' is not an array');
    }

    const byId = new Map();
    for (const r of existing) byId.set(r.id, r);
    let added = 0;
    for (const r of races) {
      if (!byId.has(r.id)) {
        byId.set(r.id, r);
        added += 1;
      }
    }
    const merged = Array.from(byId.values()).sort((a, b) => {
      if (a.date === b.date) return a.id.localeCompare(b.id);
      return a.date < b.date ? -1 : 1;
    });

    writeJson(archivePath, merged);
    archiveReport.push({
      year,
      file: path.relative(REPO_ROOT, archivePath),
      archived_this_run: added,
      total_in_archive: merged.length
    });
  }

  // Only overwrite upcoming once all archive writes have succeeded.
  writeJson(UPCOMING_PATH, newRaces);

  // Human-readable summary.
  process.stdout.write(
    'Upcoming: ' + oldRaces.length + ' -> ' + newRaces.length + ' races\n'
  );
  process.stdout.write('Archived: ' + disappeared.length + ' race(s) dropped from upcoming\n');
  for (const r of archiveReport) {
    process.stdout.write(
      '  ' + r.file + ': +' + r.archived_this_run +
      ' (total ' + r.total_in_archive + ')\n'
    );
  }
  if (skipped.length) {
    process.stdout.write(
      'Warning: ' + skipped.length +
      ' race(s) had unparseable dates and were NOT archived:\n'
    );
    for (const r of skipped) {
      process.stdout.write('  ' + r.id + ' (date=' + r.date + ')\n');
    }
  }
}

main();
