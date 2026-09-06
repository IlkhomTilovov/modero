import { getSettings, setSettings, setSetting } from './settingsStore';
import { ApiError } from './ApiError';

export interface AmoOrderData {
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

const AMO_KEYS = [
  'amocrm_domain',
  'amocrm_client_id',
  'amocrm_client_secret',
  'amocrm_access_token',
  'amocrm_refresh_token',
  'amocrm_token_expires_at',
  'amocrm_redirect_uri',
  'amocrm_enabled',
];

async function getAmoSettings() {
  const s = await getSettings(AMO_KEYS);
  return {
    domain: s.amocrm_domain || '',
    clientId: s.amocrm_client_id || '',
    clientSecret: s.amocrm_client_secret || '',
    accessToken: s.amocrm_access_token || '',
    refreshToken: s.amocrm_refresh_token || '',
    tokenExpiresAt: s.amocrm_token_expires_at || '',
    redirectUri: s.amocrm_redirect_uri || '',
    enabled: s.amocrm_enabled === 'true',
  };
}

async function ensureAccessToken(settings: Awaited<ReturnType<typeof getAmoSettings>>): Promise<string> {
  const expiresAt = settings.tokenExpiresAt ? new Date(settings.tokenExpiresAt).getTime() : 0;
  if (settings.accessToken && expiresAt > Date.now()) return settings.accessToken;

  if (!settings.refreshToken) {
    throw new ApiError(400, "AmoCRM ulanmagan (refresh token yo'q). Admin panelda qayta ulang.");
  }

  const res = await fetch(`https://${settings.domain}/oauth2/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: settings.refreshToken,
      redirect_uri: settings.redirectUri,
    }),
  });

  const data: any = await res.json();
  if (!res.ok || !data.access_token) {
    console.error('AmoCRM token refresh failed:', JSON.stringify(data));
    await setSetting('amocrm_enabled', 'false');
    throw new ApiError(400, "AmoCRM tokenini yangilashda xatolik. Admin panelda qaytadan ulang.");
  }

  const newExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000).toISOString();
  await setSettings({
    amocrm_access_token: data.access_token,
    amocrm_refresh_token: data.refresh_token,
    amocrm_token_expires_at: newExpiresAt,
  });

  return data.access_token;
}

function formatOrderNote(orderData: AmoOrderData): string {
  const itemsList = orderData.items
    .map((item) => {
      let line = `- ${item.product_name} x${item.quantity}`;
      if (item.selected_options?.size || item.selected_options?.color) {
        const options: string[] = [];
        if (item.selected_options.size) options.push(`O'lcham: ${item.selected_options.size}`);
        if (item.selected_options.color) options.push(`Rang: ${item.selected_options.color}`);
        line += ` (${options.join(', ')})`;
      }
      line += ` - ${new Intl.NumberFormat('ru-RU').format(item.price * item.quantity)} so'm`;
      return line;
    })
    .join('\n');

  return [
    `Buyurtma: ${orderData.order_number}`,
    `Mahsulotlar:`,
    itemsList,
    `Jami: ${new Intl.NumberFormat('ru-RU').format(orderData.total_price)} so'm`,
    orderData.customer_message ? `Xabar: ${orderData.customer_message}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function amoFetch(domain: string, accessToken: string, path: string, method: string, body: unknown) {
  const res = await fetch(`https://${domain}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    console.error(`AmoCRM ${path} error (${res.status}):`, JSON.stringify(data));
    throw new ApiError(500, `AmoCRM so'rovida xatolik: ${res.status}`);
  }
  return data;
}

export async function createAmoLead(type: 'test' | 'order', orderData?: AmoOrderData): Promise<{ leadId: unknown }> {
  const settings = await getAmoSettings();
  if (!settings.enabled || !settings.domain || !settings.accessToken) {
    throw new ApiError(400, 'AmoCRM ulanmagan');
  }

  const accessToken = await ensureAccessToken(settings);

  let leadPayload: Record<string, unknown>;
  if (type === 'test') {
    leadPayload = {
      name: 'Test lead — Modero',
      _embedded: {
        contacts: [
          {
            name: 'Test mijoz',
            custom_fields_values: [{ field_code: 'PHONE', values: [{ value: '+998901234567' }] }],
          },
        ],
      },
    };
  } else {
    if (!orderData) throw new ApiError(400, "Buyurtma ma'lumotlari yo'q");
    leadPayload = {
      name: `Buyurtma ${orderData.order_number}`,
      price: Math.round(orderData.total_price),
      _embedded: {
        contacts: [
          {
            name: orderData.customer_name,
            custom_fields_values: [{ field_code: 'PHONE', values: [{ value: orderData.customer_phone }] }],
          },
        ],
      },
    };
  }

  const result = await amoFetch(settings.domain, accessToken, '/api/v4/leads/complex', 'POST', [leadPayload]);
  const createdLead = Array.isArray(result) ? result[0] : result?._embedded?.leads?.[0];
  const leadId = createdLead?.id;

  if (leadId && type === 'order' && orderData) {
    try {
      await amoFetch(settings.domain, accessToken, `/api/v4/leads/${leadId}/notes`, 'POST', [
        { note_type: 'common', params: { text: formatOrderNote(orderData) } },
      ]);
    } catch (noteError) {
      console.error('AmoCRM note error (non-fatal):', noteError);
    }
  }

  return { leadId };
}

export async function connectAmoCrm(code: string, redirectUri: string): Promise<{ expiresAt: string }> {
  const s = await getSettings(['amocrm_domain', 'amocrm_client_id', 'amocrm_client_secret']);
  const domain = (s.amocrm_domain || '').trim();
  const clientId = (s.amocrm_client_id || '').trim();
  const clientSecret = (s.amocrm_client_secret || '').trim();

  if (!domain || !clientId || !clientSecret) {
    throw new ApiError(400, "Avval domen, Client ID va Client Secret ni saqlang");
  }

  const tokenResponse = await fetch(`https://${domain}/oauth2/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData: any = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error('AmoCRM token exchange failed:', JSON.stringify(tokenData));
    throw new ApiError(400, tokenData.hint || tokenData.title || "AmoCRM'dan token olishda xatolik");
  }

  const expiresAt = new Date(Date.now() + (tokenData.expires_in - 60) * 1000).toISOString();
  await setSettings({
    amocrm_access_token: tokenData.access_token,
    amocrm_refresh_token: tokenData.refresh_token,
    amocrm_token_expires_at: expiresAt,
    amocrm_redirect_uri: redirectUri,
    amocrm_enabled: 'true',
  });

  return { expiresAt };
}
