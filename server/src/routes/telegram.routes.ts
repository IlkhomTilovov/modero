import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';
import { sendTestMessage, setupWebApp, postChannelButton } from '../lib/telegram';
import { getSettings } from '../lib/settingsStore';

export const telegramRouter = Router();

// Any authenticated staff member (not just admins/managers) needs to know whether
// Telegram notifications are on, e.g. the Orders page's "send to Telegram" button —
// without ever exposing the bot token itself to the browser.
telegramRouter.get(
  '/status',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const s = await getSettings(['telegram_enabled']);
    res.json({ enabled: s.telegram_enabled === 'true' });
  })
);

telegramRouter.use(requireAuth, requirePermission('telegram', 'edit'));

telegramRouter.post(
  '/test',
  asyncHandler(async (_req, res) => {
    await sendTestMessage();
    res.json({ success: true, message: 'Xabar yuborildi' });
  })
);

telegramRouter.post(
  '/setup-webapp',
  asyncHandler(async (req, res) => {
    const { webapp_url, webapp_button_text, webapp_short_name } = req.body;
    const result = await setupWebApp(webapp_url, webapp_button_text, webapp_short_name);
    res.json({ success: true, bot: result.bot, webapp_url: result.webappUrl, webapp_short_name: result.webappShortName });
  })
);

telegramRouter.post(
  '/post-channel-button',
  asyncHandler(async (req, res) => {
    const { webapp_url, webapp_button_text, webapp_short_name, post_text, pin } = req.body;
    const result = await postChannelButton({
      webappUrl: webapp_url,
      buttonText: webapp_button_text,
      shortName: webapp_short_name,
      postText: post_text,
      pin,
    });
    res.json({ success: true, message_id: result.messageId, pinned: result.pinned });
  })
);
