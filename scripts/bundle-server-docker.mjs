#!/usr/bin/env node
import * as esbuild from 'esbuild';
import {mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entry = join(root, 'server/dist/index.js');
const outfile = process.argv[2] ?? join(root, '.dockerctx/server/dist/docker-bundle.cjs');
const appPathsStub = fileURLToPath(new URL('./docker-appPaths-stub.cjs', import.meta.url));

mkdirSync(dirname(outfile), {recursive: true});

await esbuild.build({
  absWorkingDir: root,
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile,
  external: ['better-sqlite3'],
  plugins: [
    {
      name: 'docker-app-paths',
      setup(build) {
        build.onResolve({filter: /appPaths\.js$/}, (args) => {
          const dir = args.resolveDir.replace(/\\/g, '/');
          if (dir.endsWith('/server/dist')) {
            return {path: appPathsStub};
          }
        });
      },
    },
  ],
  logLevel: 'info',
});

console.log('docker server bundle ->', outfile);
