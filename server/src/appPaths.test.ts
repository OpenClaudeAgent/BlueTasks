import {afterEach, describe, expect, it, vi} from 'vitest';
import {getAppRoot, getDataDir} from './appPaths.js';

describe('appPaths', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('getDataDir uses BLUETASKS_DATA_DIR when set', () => {
    vi.stubEnv('BLUETASKS_DATA_DIR', '/tmp/bluetasks-data');
    vi.stubEnv('BLUETASKS_HOME', '/app/bundle');
    expect(getDataDir()).toBe('/tmp/bluetasks-data');
  });

  it('getDataDir falls back to BLUETASKS_HOME/.data', () => {
    vi.stubEnv('BLUETASKS_HOME', '/app/bundle');
    vi.stubEnv('BLUETASKS_DATA_DIR', '');
    expect(getDataDir()).toBe('/app/bundle/.data');
  });

  it('getAppRoot uses BLUETASKS_HOME when set', () => {
    vi.stubEnv('BLUETASKS_HOME', '/custom/root');
    expect(getAppRoot()).toBe('/custom/root');
  });
});
