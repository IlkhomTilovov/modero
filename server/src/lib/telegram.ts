import { getSettings } from './settingsStore';
import { ApiError } from './ApiError';

export interface TelegramOrderData {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_message?: string;
  total_price: number;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    selected_options?: { size?: string; color?: string };
  }>;
}

async function tgApi(botToken: string, method: string, payload: unknown) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data: any = await res.json();
  if (!data.ok) throw new ApiError(400, data.description || `Telegram ${method} xatoligi`);
  return data;
}

async function getTelegramSettings() {
  const s = await getSettings([
    'telegram_bot_token',
    'telegram_chat_id',
    'telegram_enabled',
    'telegram_webapp_short_name',
  ]);
  return {
    botToken: s.telegram_bot_token || '',
    chatId: s.telegram_chat_id || '',
    enabled: s.telegram_enabled === 'true',
    webappShortName: s.telegram_webapp_short_name || '',
  };
}

function normalizeShortName(value?: string): string {
  const v = (value || '').trim();
  if (!v) return '';

  const fullMatch =
    v.match(/^https?:\/\/t\.me\/([A-Za-z0-9_]+)\/([A-Za-z0-9_]+)\/?$/i) ||
    v.match(/^t\.me\/([A-Za-z0-9_]+)\/([A-Za-z0-9_]+)\/?$/i);
  if (fullMatch) return `https://t.me/${fullMatch[1]}/${fullMatch[2]}`;

  return v
    .replace(/^@?https?:\/\/t\.me\/[^/]+\//i, '')
    .replace(/^@?t\.me\/[^/]+\//i, '')
    .replace(/^\/+|\/+$/g, '')
    .split(/[?#]/)[0]
    .replace(/[^A-Za-z0-9_]/g, '')
    .slice(0, 64);
}

function formatOrderMessage(orderData: TelegramOrderData): string {
  const itemsList = orderData.items
    .map((item) => {
      let line = `• ${item.product_name} x${item.quantity}`;
      if (item.selected_options?.size || item.selected_options?.color) {
        const options: string[] = [];
        if (item.selected_options.size) options.push(`O'lcham: ${item.selected_options.size}`);
        if (item.selected_options.color) options.push(`Rang: ${item.selected_options.color}`);
        line += ` (${options.join(', ')})`;
      }
      line += ` - ${new Intl.NumberFormat('uz-UZ').format(item.price * item.quantity)} so'm`;
      return line;
    })
    .join('\n');

  return `
🛒 *Yangi buyurtma!*

📋 *Buyurtma:* ${orderData.order_number}
👤 *Mijoz:* ${orderData.customer_name}
📞 *Telefon:* ${orderData.customer_phone}

*Mahsulotlar:*
${itemsList}

💰 *Jami:* ${new Intl.NumberFormat('uz-UZ').format(orderData.total_price)} so'm
${orderData.customer_message ? `\n💬 *Xabar:* ${orderData.customer_message}` : ''}
  `.trim();
}

async function requireValidBotToken() {
  const settings = await getTelegramSettings();
  if (!settings.botToken) throw new ApiError(400, 'Bot token sozlanmagan');
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(settings.botToken)) throw new ApiError(400, "Bot token formati noto'g'ri");
  return settings;
}

export async function sendTestMessage(): Promise<void> {
  const settings = await requireValidBotToken();
  if (!settings.enabled) throw new ApiError(400, 'Telegram xabarlari yoqilmagan. Avval "Telegram xabarlarini yoqish" tugmasini yoqing.');
  if (!settings.chatId) throw new ApiError(400, 'Chat ID sozlanmagan');

  await tgApi(settings.botToken, 'sendMessage', {
    chat_id: settings.chatId,
    text: "✅ *Test xabar*\n\nMebel do'koni admin paneli bilan aloqa muvaffaqiyatli o'rnatildi!\n\nBuyurtmalar haqida xabarlar shu chatga keladi.",
    parse_mode: 'Markdown',
  });
}

export async function sendOrderNotification(orderData: TelegramOrderData): Promise<void> {
  const settings = await requireValidBotToken();
  if (!settings.chatId) throw new ApiError(400, 'Chat ID sozlanmagan');

  await tgApi(settings.botToken, 'sendMessage', {
    chat_id: settings.chatId,
    text: formatOrderMessage(orderData),
    parse_mode: 'Markdown',
  });
}

export async function setupWebApp(webappUrl: string, buttonText?: string, shortName?: string) {
  const settings = await requireValidBotToken();

  let url = (webappUrl || '').trim().replace(/\/+$/, '');
  if (!url || !/^https:\/\/.+/i.test(url)) throw new ApiError(400, 'Web App URL HTTPS bilan boshlanishi kerak');

  const text = (buttonText || '').trim() || "Do'konni ochish";
  const normalizedShortName = normalizeShortName(shortName);

  try {
    await tgApi(settings.botToken, 'setChatMenuButton', { menu_button: { type: 'default' } });
  } catch (e) {
    console.log('Reset old menu button failed (non-fatal):', (e as Error).message);
  }

  await tgApi(settings.botToken, 'setChatMenuButton', {
    menu_button: { type: 'web_app', text, web_app: { url } },
  });

  await tgApi(settings.botToken, 'setMyCommands', {
    commands: [
      { command: 'start', description: "Do'konni ochish" },
      { command: 'help', description: 'Yordam' },
    ],
  });

  const me = await tgApi(settings.botToken, 'getMe', {});

  return { bot: me.result, webappUrl: url, webappShortName: normalizedShortName };
}

export async function postChannelButton(opts: {
  webappUrl?: string;
  buttonText?: string;
  shortName?: string;
  postText?: string;
  pin?: boolean;
}) {
  const settings = await requireValidBotToken();
  if (!settings.chatId) throw new ApiError(400, 'Chat ID sozlanmagan');

  let url = (opts.webappUrl || '').trim().replace(/\/+$/, '');
  if (!url || !/^https:\/\/.+/i.test(url)) {
    const fallback = await getSettings(['telegram_webapp_url']);
    url = (fallback.telegram_webapp_url || '').trim().replace(/\/+$/, '');
  }
  if (!url || !/^https:\/\/.+/i.test(url)) {
    throw new ApiError(400, "Web App URL topilmadi. Avval Web App sozlamasini saqlang.");
  }

  const buttonText = (opts.buttonText || 'Katalog').trim().slice(0, 32) || 'Katalog';
  const text = (opts.postText || "🛍 Bizning do'kon katalogi quyidagi tugma orqali ochiladi:").trim();

  const me = await tgApi(settings.botToken, 'getMe', {});
  const shortNameOrUrl = normalizeShortName(opts.shortName || settings.webappShortName);
  if (!shortNameOrUrl) {
    throw new ApiError(
      400,
      "Direct Link short name topilmadi. BotFather → /myapps orqali Mini App short name yarating va sozlamaga kiriting (yoki to'liq link: t.me/botname/katalog)."
    );
  }
  const buttonUrl = shortNameOrUrl.startsWith('https://t.me/')
    ? shortNameOrUrl
    : `https://t.me/${me.result.username}/${shortNameOrUrl}`;

  const sent = await tgApi(settings.botToken, 'sendMessage', {
    chat_id: settings.chatId,
    text,
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: [[{ text: buttonText, url: buttonUrl }]] },
  });

  let pinned = false;
  if (opts.pin !== false) {
    try {
      await tgApi(settings.botToken, 'pinChatMessage', {
        chat_id: settings.chatId,
        message_id: sent.result.message_id,
        disable_notification: true,
      });
      pinned = true;
    } catch (e) {
      console.log('Pin failed:', (e as Error).message);
    }
  }

  return { messageId: sent.result.message_id, pinned };
}
