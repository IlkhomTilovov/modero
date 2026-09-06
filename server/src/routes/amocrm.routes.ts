import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';
import { createAmoLead, connectAmoCrm } from '../lib/amocrm';

export const amocrmRouter = Router();

amocrmRouter.use(requireAuth, requirePermission('telegram', 'edit'));

amocrmRouter.post(
  '/connect',
  asyncHandler(async (req, res) => {
    const { code, redirect_uri: redirectUri } = req.body;
    if (!code || !redirectUri) throw new ApiError(400, "code va redirect_uri talab qilinadi");
    const result = await connectAmoCrm(code, redirectUri);
    res.json({ success: true, expires_at: result.expiresAt });
  })
);

amocrmRouter.post(
  '/test',
  asyncHandler(async (_req, res) => {
    const result = await createAmoLead('test');
    res.json({ success: true, lead_id: result.leadId });
  })
);
