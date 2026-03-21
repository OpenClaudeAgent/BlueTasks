import path from 'node:path';
import fs from 'node:fs';
import {getAppRoot} from './appPaths.js';
import {createApp} from './createApp.js';
import {openAndMigrateDatabase} from './dbSetup.js';

const rootDir = getAppRoot();
const dbDir = path.join(rootDir, '.data');
const dbPath = path.join(dbDir, 'bluetasks.sqlite');
const appDistDir = path.join(rootDir, 'web', 'app', 'dist');

if (!fs.existsSync(appDistDir)) {
  console.warn(`[server] App dist not found at ${appDistDir} — run "npm run build" first`);
}

const dbCtx = {current: openAndMigrateDatabase(dbPath)};
const app = createApp(dbCtx, {
  staticDir: fs.existsSync(appDistDir) ? appDistDir : null,
  dbFilePath: dbPath,
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST?.trim();
if (host) {
  app.listen(port, host, () => {
    console.log(`BlueTasks local server running on http://${host}:${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`BlueTasks local server running on http://localhost:${port}`);
  });
}
