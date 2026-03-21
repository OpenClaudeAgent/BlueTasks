'use strict';
const path = require('node:path');

/** Remplacement du module appPaths pour le bundle image Docker (pas d’import.meta). */
function getAppRoot() {
  return path.resolve('/app');
}

module.exports = {getAppRoot};
