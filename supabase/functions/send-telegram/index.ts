import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramRequest {
  type: 'test' | 'order' | 'setup_webapp' | 'post_channel_button';
  webapp_url?: string;
  webapp_button_text?: string;
  webapp_short_name?: string;
  post_text?: string;
  pin?: boolean;
  order_data?: {
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_message?: string;
    total_price: number;
    items: Array<{
      product_name: string;
      quantity: number;
      price: number;
      selected_options?: {
        size?: string;
        color?: string;
      };
    }>;
  };
}
async function tgApi(botToken: string, method: string, payload: any) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || `Telegram ${method} xatoligi`);
  return data;
}


async function getTelegramSettings(supabase: any) {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['telegram_bot_token', 'telegram_chat_id', 'telegram_enabled', 'telegram_webapp_short_name']);

  if (error) {
    console.error('Error fetching telegram settings:', error);
    throw new Error('Telegram sozlamalarini yuklashda xatolik');
  }

  const settings: Record<string, string> = {};
  data?.forEach((item: any) => {
    settings[item.key] = item.value || '';
  });

  return {
    bot_token: settings['telegram_bot_token'] || '',
    chat_id: settings['telegram_chat_id'] || '',
    enabled: settings['telegram_enabled'] === 'true',
    webapp_short_name: settings['telegram_webapp_short_name'] || '',
  };
}

function normalizeShortName(value?: string) {
  const v = (value || '').trim();
  if (!v) return '';

  // Full Direct Link like t.me/orsihomebot/katalog or https://t.me/orsihomebot/katalog
  const fullMatch = v.match(/^https?:\/\/t\.me\/([A-Za-z0-9_]+)\/([A-Za-z0-9_]+)\/?$/i)
                 || v.match(/^t\.me\/([A-Za-z0-9_]+)\/([A-Za-z0-9_]+)\/?$/i);
  if (fullMatch) {
    return `https://t.me/${fullMatch[1]}/${fullMatch[2]}`;
  }

  // Plain short name only: clean up accidental prefixes
  return v
    .replace(/^@?https?:\/\/t\.me\/[^/]+\//i, '')
    .replace(/^@?t\.me\/[^/]+\//i, '')
    .replace(/^\/+|\/+$/g, '')
    .split(/[?#]/)[0]
    .replace(/[^A-Za-z0-9_]/g, '')
    .slice(0, 64);
}




function formatOrderMessage(orderData: TelegramRequest['order_data']) {
  if (!orderData) return '';

  const itemsList = orderData.items.map(item => {
    let line = `• ${item.product_name} x${item.quantity}`;
    if (item.selected_options?.size || item.selected_options?.color) {
      const options = [];
      if (item.selected_options.size) options.push(`O'lcham: ${item.selected_options.size}`);
      if (item.selected_options.color) options.push(`Rang: ${item.selected_options.color}`);
      line += ` (${options.join(', ')})`;
    }
    line += ` - ${new Intl.NumberFormat('uz-UZ').format(item.price * item.quantity)} so'm`;
    return line;
  }).join('\n');

  const message = `
🛒 *Yangi buyurtma!*

📋 *Buyurtma:* ${orderData.order_number}
👤 *Mijoz:* ${orderData.customer_name}
📞 *Telefon:* ${orderData.customer_phone}

*Mahsulotlar:*
${itemsList}

💰 *Jami:* ${new Intl.NumberFormat('uz-UZ').format(orderData.total_price)} so'm
${orderData.customer_message ? `\n💬 *Xabar:* ${orderData.customer_message}` : ''}
  `.trim();

  return message;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: TelegramRequest = await req.json();
    console.log('Telegram request type:', body.type);

    // Get Telegram settings from database
    const settings = await getTelegramSettings(supabase);
    console.log('Telegram enabled:', settings.enabled);

    // Validate settings
    if (!settings.bot_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bot token sozlanmagan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate bot token format (basic check)
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(settings.bot_token)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bot token formati noto\'g\'ri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Web App setup separately (no chat_id needed)
    if (body.type === 'setup_webapp') {

      let url = body.webapp_url?.trim() || '';
      // Normalize: strip trailing slash
      url = url.replace(/\/+$/, '');
      if (!url || !/^https:\/\/.+/i.test(url)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Web App URL HTTPS bilan boshlanishi kerak' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const buttonText = body.webapp_button_text?.trim() || 'Do\'konni ochish';
      const shortName = normalizeShortName(body.webapp_short_name);

      // Step 1: Reset old menu button (removes any previously linked Web App)
      try {
        await tgApi(settings.bot_token, 'setChatMenuButton', {
          menu_button: { type: 'default' },
        });
      } catch (e) {
        console.log('Reset old menu button failed (non-fatal):', (e as Error).message);
      }

      // Step 2: Set the new Web App as the bot's default menu button
      await tgApi(settings.bot_token, 'setChatMenuButton', {
        menu_button: {
          type: 'web_app',
          text: buttonText,
          web_app: { url },
        },
      });


      // Set basic commands
      await tgApi(settings.bot_token, 'setMyCommands', {
        commands: [
          { command: 'start', description: 'Do\'konni ochish' },
          { command: 'help', description: 'Yordam' },
        ],
      });

      const me = await tgApi(settings.bot_token, 'getMe', {});

      return new Response(
        JSON.stringify({ success: true, bot: me.result, webapp_url: url, webapp_short_name: shortName }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.chat_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Chat ID sozlanmagan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Post a message to the channel/group with an inline URL button (e.g., "Katalog") and optionally pin it.
    // Channels do NOT support web_app inline buttons — we use a regular URL button which opens the site
    // (and, if visited inside Telegram, the Mini App opens automatically when set up).
    if (body.type === 'post_channel_button') {
      let url = (body.webapp_url || '').trim().replace(/\/+$/, '');
      if (!url || !/^https:\/\/.+/i.test(url)) {
        // Fallback: try DB
        const { data } = await supabase.from('settings').select('value').eq('key', 'telegram_webapp_url').maybeSingle();
        url = (data?.value || '').trim().replace(/\/+$/, '');
      }
      if (!url || !/^https:\/\/.+/i.test(url)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Web App URL topilmadi. Avval Web App sozlamasini saqlang.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const buttonText = (body.webapp_button_text || 'Katalog').trim().slice(0, 32) || 'Katalog';
      const text = (body.post_text || '🛍 Bizning do\'kon katalogi quyidagi tugma orqali ochiladi:').trim();

      const me = await tgApi(settings.bot_token, 'getMe', {});
      const shortNameOrUrl = normalizeShortName(body.webapp_short_name || settings.webapp_short_name);
      if (!shortNameOrUrl) {
        return new Response(
          JSON.stringify({ success: false, error: 'Direct Link short name topilmadi. BotFather → /myapps orqali Mini App short name yarating va sozlamaga kiriting (yoki to\'liq link: t.me/orsihomebot/katalog).' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const buttonUrl = shortNameOrUrl.startsWith('https://t.me/')
        ? shortNameOrUrl
        : `https://t.me/${me.result.username}/${shortNameOrUrl}`;


      // Channels don't support `web_app` inline buttons directly. To open the Mini App
      // from a channel button, Telegram requires a BotFather Direct Link short name.
      const sent = await tgApi(settings.bot_token, 'sendMessage', {
        chat_id: settings.chat_id,
        text,
        link_preview_options: { is_disabled: true },
        reply_markup: {
          inline_keyboard: [[{ text: buttonText, url: buttonUrl }]],
        },
      });


      let pinned = false;
      if (body.pin !== false) {
        try {
          await tgApi(settings.bot_token, 'pinChatMessage', {
            chat_id: settings.chat_id,
            message_id: sent.result.message_id,
            disable_notification: true,
          });
          pinned = true;
        } catch (e) {
          console.log('Pin failed:', (e as Error).message);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message_id: sent.result.message_id, pinned }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }



    let message: string;


    if (body.type === 'test') {
      // Check if enabled for test messages too
      if (!settings.enabled) {
        return new Response(
          JSON.stringify({ success: false, error: 'Telegram xabarlari yoqilmagan. Avval "Telegram xabarlarini yoqish" tugmasini yoqing.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      message = '✅ *Test xabar*\n\nMebel do\'koni admin paneli bilan aloqa muvaffaqiyatli o\'rnatildi!\n\nBuyurtmalar haqida xabarlar shu chatga keladi.';
    } else if (body.type === 'order') {
      if (!body.order_data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Buyurtma ma\'lumotlari yo\'q' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      message = formatOrderMessage(body.order_data);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Noto\'g\'ri so\'rov turi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send the message
    await tgApi(settings.bot_token, 'sendMessage', {
      chat_id: settings.chat_id,
      text: message,
      parse_mode: 'Markdown',
    });
    console.log('Telegram message sent successfully');



    return new Response(
      JSON.stringify({ success: true, message: 'Xabar yuborildi' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Telegram error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Xatolik yuz berdi' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
