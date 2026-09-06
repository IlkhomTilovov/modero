export interface StorageAdapter {
  save(buffer: Buffer, relativePath: string): Promise<void>;
  getPublicUrl(relativePath: string): string;
  remove(relativePath: string): Promise<void>;
}

export { localFsStorage as storage } from './localFs';
