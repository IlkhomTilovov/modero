import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConnectRequest {
  code: string;
  redirect_uri: string;
}

async function upsertSetting(supabase: any, key: string, value: string) {
  const { data: existing } = await supabase.from('settings').select('id').eq('key', key).maybeSingle();
  if (existing) {
    await supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
  } else {
    await supabase.from('settings').insert({ key, value });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ConnectRequest = await req.json();

    if (!body.code || !body.redirect_uri) {
      return new Response(
        JSON.stringify({ success: false, error: "code va redirect_uri talab qilinadi" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: settingsRows, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['amocrm_domain', 'amocrm_client_id', 'amocrm_client_secret']);

    if (settingsError) {
      console.error('Error fetching amoCRM settings:', settingsError);
      throw new Error('Sozlamalarni yuklashda xatolik');
    }

    const settings: Record<string, string> = {};
    settingsRows?.forEach((row: any) => { settings[row.key] = row.value || ''; });

    const domain = (settings['amocrm_domain'] || '').trim();
    const clientId = (settings['amocrm_client_id'] || '').trim();
    const clientSecret = (settings['amocrm_client_secret'] || '').trim();

    if (!domain || !clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Avval domen, Client ID va Client Secret ni saqlang" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenResponse = await fetch(`https://${domain}/oauth2/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: body.code,
        redirect_uri: body.redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('AmoCRM token exchange failed:', JSON.stringify(tokenData));
      return new Response(
        JSON.stringify({ success: false, error: tokenData.hint || tokenData.title || "AmoCRM'dan token olishda xatolik" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in - 60) * 1000).toISOString();

    await upsertSetting(supabase, 'amocrm_access_token', tokenData.access_token);
    await upsertSetting(supabase, 'amocrm_refresh_token', tokenData.refresh_token);
    await upsertSetting(supabase, 'amocrm_token_expires_at', expiresAt);
    await upsertSetting(supabase, 'amocrm_redirect_uri', body.redirect_uri);
    await upsertSetting(supabase, 'amocrm_enabled', 'true');

    console.log('AmoCRM connected successfully, expires at', expiresAt);

    return new Response(
      JSON.stringify({ success: true, expires_at: expiresAt }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('AmoCRM connect error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Kutilmagan xatolik yuz berdi' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
