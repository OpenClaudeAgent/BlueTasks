'use strict';
const path = require('node:path');

/** Replaces `appPaths` in CJS bundles (Docker / desktop); no `import.meta`. */
function getAppRoot() {
  const env = process.env.BLUETASKS_HOME?.trim();
  if (env) {
    return path.resolve(env);
  }
  return path.resolve('/app');
}

function getDataDir() {
  const env = process.env.BLUETASKS_DATA_DIR?.trim();
  if (env) {
    return path.resolve(env);
  }
  return path.join(getAppRoot(), '.data');
}

module.exports = {getAppRoot, getDataDir};
