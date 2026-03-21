import os from 'node:os';
import {randomUUID} from 'node:crypto';
import type {NextFunction, Request, Response} from 'express';
import multer from 'multer';

export const uploadImport = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (_req, _file, cb) => {
      cb(null, `bluetasks-import-${randomUUID()}.sqlite`);
    },
  }),
  limits: {fileSize: 80 * 1024 * 1024},
});

export function handleImportUpload(req: Request, res: Response, next: NextFunction): void {
  uploadImport.single('database')(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large (max 80 MB)'
          : err instanceof Error
            ? err.message
            : 'Upload failed';
      res.status(400).json({message});
      return;
    }
    next();
  });
}
