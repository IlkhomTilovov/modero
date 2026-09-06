import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';
import { storage } from '../lib/storage';

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

    await storage.save(req.file.buffer, normalized);
    res.status(201).json({ url: storage.getPublicUrl(normalized) });
  })
);

uploadsRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const relativePath = req.query.path as string | undefined;
    if (!relativePath) throw new ApiError(400, "'path' talab qilinadi");
    const normalized = relativePath.replace(/^\/+/, '').replace(/\.\.+/g, '');
    await storage.remove(normalized);
    res.status(204).end();
  })
);
