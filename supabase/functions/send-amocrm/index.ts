import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderData {
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

interface AmoRequest {
  type: 'test' | 'order';
  order_data?: OrderData;
}

type AmoSettings = {
  domain: string;
  client_id: string;
  client_secret: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  redirect_uri: string;
  enabled: boolean;
};

async function getAmoSettings(supabase: any): Promise<AmoSettings> {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
      'amocrm_domain', 'amocrm_client_id', 'amocrm_client_secret',
      'amocrm_access_token', 'amocrm_refresh_token', 'amocrm_token_expires_at',
      'amocrm_redirect_uri', 'amocrm_enabled',
    ]);

  if (error) {
    console.error('Error fetching amoCRM settings:', error);
    throw new Error("AmoCRM sozlamalarini yuklashda xatolik");
  }

  const settings: Record<string, string> = {};
  data?.forEach((row: any) => { settings[row.key] = row.value || ''; });

  return {
    domain: settings['amocrm_domain'] || '',
    client_id: settings['amocrm_client_id'] || '',
    client_secret: settings['amocrm_client_secret'] || '',
    access_token: settings['amocrm_access_token'] || '',
    refresh_token: settings['amocrm_refresh_token'] || '',
    token_expires_at: settings['amocrm_token_expires_at'] || '',
    redirect_uri: settings['amocrm_redirect_uri'] || '',
    enabled: settings['amocrm_enabled'] === 'true',
  };
}

async function upsertSetting(supabase: any, key: string, value: string) {
  const { data: existing } = await supabase.from('settings').select('id').eq('key', key).maybeSingle();
  if (existing) {
    await supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
  } else {
    await supabase.from('settings').insert({ key, value });
  }
}

async function ensureAccessToken(supabase: any, settings: AmoSettings): Promise<string> {
  const expiresAt = settings.token_expires_at ? new Date(settings.token_expires_at).getTime() : 0;
  if (settings.access_token && expiresAt > Date.now()) {
    return settings.access_token;
  }

  if (!settings.refresh_token) {
    throw new Error("AmoCRM ulanmagan (refresh token yo'q). Admin panelda qayta ulang.");
  }

  const res = await fetch(`https://${settings.domain}/oauth2/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'refresh_token',
      refresh_token: settings.refresh_token,
      redirect_uri: settings.redirect_uri,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error('AmoCRM token refresh failed:', JSON.stringify(data));
    // Refresh token itself may have been revoked/expired — require a fresh manual connect.
    await upsertSetting(supabase, 'amocrm_enabled', 'false');
    throw new Error("AmoCRM tokenini yangilashda xatolik. Admin panelda qaytadan ulang.");
  }

  const newExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000).toISOString();
  await upsertSetting(supabase, 'amocrm_access_token', data.access_token);
  await upsertSetting(supabase, 'amocrm_refresh_token', data.refresh_token);
  await upsertSetting(supabase, 'amocrm_token_expires_at', newExpiresAt);

  return data.access_token;
}

function formatOrderNote(orderData: OrderData): string {
  const itemsList = orderData.items.map((item) => {
    let line = `- ${item.product_name} x${item.quantity}`;
    if (item.selected_options?.size || item.selected_options?.color) {
      const options: string[] = [];
      if (item.selected_options.size) options.push(`O'lcham: ${item.selected_options.size}`);
      if (item.selected_options.color) options.push(`Rang: ${item.selected_options.color}`);
      line += ` (${options.join(', ')})`;
    }
    line += ` - ${new Intl.NumberFormat('ru-RU').format(item.price * item.quantity)} so'm`;
    return line;
  }).join('\n');

  return [
    `Buyurtma: ${orderData.order_number}`,
    `Mahsulotlar:`,
    itemsList,
    `Jami: ${new Intl.NumberFormat('ru-RU').format(orderData.total_price)} so'm`,
    orderData.customer_message ? `Xabar: ${orderData.customer_message}` : '',
  ].filter(Boolean).join('\n');
}

async function amoFetch(domain: string, accessToken: string, path: string, method: string, body: unknown) {
  const res = await fetch(`https://${domain}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    console.error(`AmoCRM ${path} error (${res.status}):`, JSON.stringify(data));
    throw new Error(`AmoCRM so'rovida xatolik: ${res.status}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AmoRequest = await req.json();
    const settings = await getAmoSettings(supabase);

    if (!settings.enabled || !settings.domain || !settings.access_token) {
      return new Response(
        JSON.stringify({ success: false, error: "AmoCRM ulanmagan" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await ensureAccessToken(supabase, settings);

    let leadPayload: Record<string, unknown>;

    if (body.type === 'test') {
      leadPayload = {
        name: 'Test lead — Orsi Home',
        _embedded: {
          contacts: [{
            name: 'Test mijoz',
            custom_fields_values: [{
              field_code: 'PHONE',
              values: [{ value: '+998901234567' }],
            }],
          }],
        },
      };
    } else if (body.type === 'order') {
      if (!body.order_data) {
        return new Response(
          JSON.stringify({ success: false, error: "Buyurtma ma'lumotlari yo'q" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const orderData = body.order_data;
      leadPayload = {
        name: `Buyurtma ${orderData.order_number}`,
        price: Math.round(orderData.total_price),
        _embedded: {
          contacts: [{
            name: orderData.customer_name,
            custom_fields_values: [{
              field_code: 'PHONE',
              values: [{ value: orderData.customer_phone }],
            }],
          }],
        },
      };
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Noto'g'ri so'rov turi" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await amoFetch(settings.domain, accessToken, '/api/v4/leads/complex', 'POST', [leadPayload]);
    const createdLead = Array.isArray(result) ? result[0] : result?._embedded?.leads?.[0];
    const leadId = createdLead?.id;

    if (leadId && body.type === 'order' && body.order_data) {
      try {
        await amoFetch(settings.domain, accessToken, `/api/v4/leads/${leadId}/notes`, 'POST', [{
          note_type: 'common',
          params: { text: formatOrderNote(body.order_data) },
        }]);
      } catch (noteError) {
        // Non-fatal: the lead itself was created successfully, the note is a nice-to-have.
        console.error('AmoCRM note error (non-fatal):', noteError);
      }
    }

    console.log('AmoCRM lead created:', leadId);

    return new Response(
      JSON.stringify({ success: true, lead_id: leadId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('AmoCRM error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Xatolik yuz berdi' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
