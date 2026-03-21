#!/usr/bin/env node
/**
 * Insert a new release section above the first ## [x.y.z] entry, and refresh compare links.
 * Usage: node scripts/changelog-release.mjs <semver> <prevGitTag> [note]
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const version = process.argv[2];
const prevTag = process.argv[3];
const note = process.argv[4] || `Release v${version}.`;

if (!version || !prevTag) {
  console.error('Usage: node scripts/changelog-release.mjs <semver> <prevGitTag> [note]');
  process.exit(1);
}

const newTag = `v${version}`;
const repo = process.env.GITHUB_REPOSITORY || 'OpenClaudeAgent/BlueTasks';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const path = join(root, 'CHANGELOG.md');
let md = readFileSync(path, 'utf8');

if (md.includes(`## [${version}]`)) {
  console.error(`CHANGELOG already has [${version}]`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const block = `\n## [${version}] - ${today}\n\n- ${note}\n`;

const firstVersion = /\n## \[\d+\.\d+\.\d+\]/;
const m = md.match(firstVersion);
if (!m || m.index === undefined) {
  console.error('CHANGELOG.md: no ## [x.y.z] section found to anchor insert');
  process.exit(1);
}
const insertAt = m.index;
md = md.slice(0, insertAt) + block + md.slice(insertAt);

md = md.replace(
  /(\[Unreleased\]: https:\/\/github\.com\/[^/]+\/[^/]+\/compare\/)v[^\s/]+\.\.\.HEAD/,
  `$1${newTag}...HEAD`,
);

const unreleasedLink = md.match(/\[Unreleased\]:[^\n]+\n/);
if (!unreleasedLink) {
  console.error('Could not find [Unreleased] link line');
  process.exit(1);
}
const linkLine = `[${version}]: https://github.com/${repo}/compare/${prevTag}...${newTag}\n`;
md = md.replace(unreleasedLink[0], `${unreleasedLink[0]}${linkLine}`);

writeFileSync(path, md, 'utf8');
console.log(`CHANGELOG.md: added [${version}] and updated compare links.`);
