import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';
import { storage } from '../lib/storage';
import { getImageFolderConfig, isOptimizableRaster, optimizeImage, toWebpPath } from '../lib/imageOptimizer';

export const uploadsRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

uploadsRouter.use(requireAuth);

uploadsRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const relativePath = req.body.path as string | undefined;
    if (!req.file || !relativePath) throw new ApiError(400, "Fayl va 'path' talab qilinadi");

    // Prevent path traversal outside the uploads root.
    const normalized = relativePath.replace(/^\/+/, '').replace(/\.\.+/g, '');

    const folderConfig = getImageFolderConfig(normalized);
    if (!folderConfig || !isOptimizableRaster(req.file.mimetype)) {
      await storage.save(req.file.buffer, normalized);
      return res.status(201).json({ url: storage.getPublicUrl(normalized) });
    }

    // Keep the untouched upload as a safety-net backup, then serve the
    // resized/recompressed WebP as the actual public file.
    const finalPath = toWebpPath(normalized);
    const optimized = await optimizeImage(req.file.buffer, folderConfig);
    await Promise.all([
      storage.save(optimized, finalPath),
      storage.save(req.file.buffer, `originals/${normalized}`),
    ]);

    res.status(201).json({ url: storage.getPublicUrl(finalPath) });
  })
);

uploadsRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const relativePath = req.query.path as string | undefined;
    if (!relativePath) throw new ApiError(400, "'path' talab qilinadi");
    const normalized = relativePath.replace(/^\/+/, '').replace(/\.\.+/g, '');
    await Promise.all([
      storage.remove(normalized),
      storage.remove(`originals/${normalized}`),
      storage.remove(`originals/${toWebpPath(normalized)}`),
    ]);
    res.status(204).end();
  })
);
