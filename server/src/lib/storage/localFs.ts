import fs from 'fs/promises';
import path from 'path';
import { env } from '../../env';
import type { StorageAdapter } from './index';

const UPLOADS_ROOT = path.join(__dirname, '..', '..', '..', 'uploads');

export const localFsStorage: StorageAdapter = {
  async save(buffer, relativePath) {
    const fullPath = path.join(UPLOADS_ROOT, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
  },

  getPublicUrl(relativePath) {
    return `${env.PUBLIC_ASSET_BASE_URL}/uploads/${relativePath}`;
  },

  async remove(relativePath) {
    const fullPath = path.join(UPLOADS_ROOT, relativePath);
    await fs.rm(fullPath, { force: true });
  },
};
