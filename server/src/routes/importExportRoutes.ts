import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import type Database from 'better-sqlite3';
import {Router} from 'express';
import type {DatabaseContext, CreateAppOptions} from '../appTypes.js';
import {assertBluetasksDatabase, openAndMigrateDatabase, removeSqliteSidecars} from '../dbSetup.js';
import {handleImportUpload} from '../importUpload.js';

type ImportExportDeps = {
  getDb: () => Database.Database;
  dbCtx: DatabaseContext;
  options: CreateAppOptions;
};

export function createImportExportRouter({getDb, dbCtx, options}: ImportExportDeps): Router {
  const r = Router();

  r.post(
    '/import/database',
    (req, res, next) => {
      if (!options.dbFilePath) {
        res.status(501).json({message: 'Database import requires a file-backed database'});
        return;
      }
      next();
    },
    handleImportUpload,
    (req, res) => {
      const dbPath = options.dbFilePath!;
      const file = req.file;
      if (!file?.path) {
        res.status(400).json({message: 'No file uploaded (use form field "database")'});
        return;
      }
      const uploadedPath = file.path;
      let trial: Database.Database | undefined;
      try {
        trial = openAndMigrateDatabase(uploadedPath);
        assertBluetasksDatabase(trial);
        trial.close();
        trial = undefined;
      } catch {
        try {
          trial?.close();
        } catch {
          /* ignore */
        }
        try {
          fs.unlinkSync(uploadedPath);
        } catch {
          /* ignore */
        }
        res.status(400).json({message: 'Invalid or incompatible SQLite file'});
        return;
      }

      try {
        getDb().close();
      } catch (closeErr) {
        console.error('[import] close previous db', closeErr);
      }

      removeSqliteSidecars(dbPath);
      const staging = `${dbPath}.import-${randomUUID()}`;
      try {
        fs.copyFileSync(uploadedPath, staging);
        fs.renameSync(staging, dbPath);
      } catch (copyErr) {
        console.error('[import] replace file', copyErr);
        try {
          fs.unlinkSync(staging);
        } catch {
          /* ignore */
        }
        try {
          fs.unlinkSync(uploadedPath);
        } catch {
          /* ignore */
        }
        try {
          dbCtx.current = openAndMigrateDatabase(dbPath);
        } catch (reopenErr) {
          console.error('[import] reopen after failure', reopenErr);
        }
        res.status(500).json({message: 'Failed to replace database file'});
        return;
      }
      try {
        fs.unlinkSync(uploadedPath);
      } catch {
        /* ignore */
      }

      try {
        dbCtx.current = openAndMigrateDatabase(dbPath);
      } catch (reopenErr) {
        console.error('[import] reopen', reopenErr);
        res.status(500).json({message: 'Failed to open imported database'});
        return;
      }

      res.status(204).send();
    },
  );

  r.get('/export/database', (_req, res) => {
    const tmpPath = path.join(os.tmpdir(), `bluetasks-export-${randomUUID()}.sqlite`);
    try {
      const escaped = tmpPath.replace(/'/g, "''");
      getDb().exec(`VACUUM INTO '${escaped}'`);
    } catch (error) {
      console.error('[export]', error);
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
      res.status(500).type('text/plain').send('Database export failed');
      return;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="bluetasks-${stamp}.sqlite"`);

    const stream = fs.createReadStream(tmpPath);
    stream.on('error', (err) => {
      console.error('[export stream]', err);
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
      if (!res.headersSent) {
        res.status(500).type('text/plain').send('Database export failed');
      } else {
        res.destroy();
      }
    });
    res.on('close', () => {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
    });
    stream.pipe(res);
  });

  return r;
}
