import fs from 'node:fs';
import path from 'node:path';
import type {Application} from 'express';
import express from 'express';
import cors from 'cors';
import type {DatabaseContext, CreateAppOptions} from './appTypes.js';
export type {DatabaseContext, CreateAppOptions} from './appTypes.js';
import {createAreasRouter} from './routes/areasRoutes.js';
import {createImportExportRouter} from './routes/importExportRoutes.js';
import {createTasksRouter} from './routes/tasksRoutes.js';

export function createApp(dbCtx: DatabaseContext, options: CreateAppOptions = {}): Application {
  const getDb = () => dbCtx.current;
  const app = express();
  app.use(cors());
  app.use(express.json({limit: '2mb'}));

  app.use('/api/tasks', createTasksRouter(getDb));
  app.use('/api/areas', createAreasRouter(getDb));
  app.use('/api', createImportExportRouter({getDb, dbCtx, options}));

  const staticDir = options.staticDir;
  if (staticDir && fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  return app;
}
