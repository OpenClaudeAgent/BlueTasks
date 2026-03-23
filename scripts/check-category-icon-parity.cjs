#!/usr/bin/env node
/**
 * Ensures mobile category icon ids stay aligned with server/data/category-icon-ids.json
 * and that CategoryIconVector.kt maps every canonical id (run from repo root: npm run check:category-icon-parity).
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'server/data/category-icon-ids.json');
const ktIdsPath = path.join(
  root,
  'mobile/shared/src/commonMain/kotlin/com/bluetasks/mobile/shared/domain/CategoryIconIds.kt',
);
const ktVecPath = path.join(
  root,
  'mobile/composeApp/src/commonMain/kotlin/com/bluetasks/mobile/ui/components/CategoryIconVector.kt',
);

const jsonIds = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
if (!Array.isArray(jsonIds) || jsonIds.some((id) => typeof id !== 'string')) {
  console.error('Invalid category-icon-ids.json');
  process.exit(1);
}

const ktIdsSrc = fs.readFileSync(ktIdsPath, 'utf8');
const listMatch = ktIdsSrc.match(/listOf\(\s*([\s\S]*?)\s*\)\s*$/m);
if (!listMatch) {
  console.error('Could not parse listOf in CategoryIconIds.kt');
  process.exit(1);
}
const ktIds = [...listMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

function sameOrder(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((v, i) => v === b[i]);
}

if (!sameOrder(jsonIds, ktIds)) {
  console.error(
    'Mismatch: server/data/category-icon-ids.json vs CategoryIconIds.kt (order and contents must match).',
  );
  console.error('JSON:', jsonIds.join(', '));
  console.error('KT:  ', ktIds.join(', '));
  process.exit(1);
}

const vecSrc = fs.readFileSync(ktVecPath, 'utf8');
const branchIds = [...vecSrc.matchAll(/"([^"]+)"\s*->/g)]
  .map((m) => m[1])
  .filter((id) => id !== 'else');
const branchSet = new Set(branchIds);
const missing = jsonIds.filter((id) => !branchSet.has(id));
if (missing.length) {
  console.error('CategoryIconVector.kt is missing when-branches for:', missing.join(', '));
  process.exit(1);
}

console.log('Category icon parity OK (%d ids).', jsonIds.length);
