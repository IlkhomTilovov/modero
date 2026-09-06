import { useEffect, useState } from 'react';
import { Save, Send, CheckCircle, XCircle, Pin, Link2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminT } from '@/hooks/useAdminT';

function ChannelCatalogPost({ webappUrl, defaultButton, shortName }: { webappUrl: string; defaultButton: string; shortName: string }) {
  const t = useAdminT().settings;
  const { toast } = useToast();
  const [text, setText] = useState<string>(t.defaultChannelMessage);
  const [buttonText, setButtonText] = useState<string>(defaultButton || t.catalog);
  const [pin, setPin] = useState(true);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!webappUrl || !/^https:\/\/.+/i.test(webappUrl)) {
      toast({ title: t.errorTitle, description: t.saveUrlFirst, variant: 'destructive' });
      return;
    }
    if (!shortName.trim()) {
      toast({ title: t.errorTitle, description: t.saveShortNameFirst, variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram', {
        body: {
          type: 'post_channel_button',
          webapp_url: webappUrl,
          webapp_button_text: buttonText,
          webapp_short_name: shortName,
          post_text: text,
          pin,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || t.sendError);
      toast({
        title: t.sent,
        description: pin
          ? (data.pinned ? t.sentAndPinned : t.sentNotPinned)
          : t.sentToChannel,
      });
    } catch (err: any) {
      toast({ title: t.errorTitle, description: err.message || t.sendError, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Pin className="h-5 w-5" /> {t.channelPostTitle}</CardTitle>
        <CardDescription>{t.channelPostDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t.messageText}</Label>
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t.buttonText}</Label>
            <Input maxLength={32} value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3">
            <Label htmlFor="pin-switch">{t.autoPin}</Label>
            <Switch id="pin-switch" checked={pin} onCheckedChange={setPin} />
          </div>
        </div>
        <Button onClick={send} disabled={sending}>
          {sending ? (
            <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {t.sendToChannel}
        </Button>
      </CardContent>
    </Card>
  );
}


interface TelegramSettings {
  bot_token: string;
  chat_id: string;
  enabled: boolean;
}

interface WebAppSettings {
  url: string;
  button_text: string;
  short_name: string;
}

interface AmoCrmSettings {
  domain: string;
  client_id: string;
  client_secret: string;
  connected: boolean;
}

function normalizeAmoDomain(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

export default function Settings() {
  const t = useAdminT().settings;
  const [telegram, setTelegram] = useState<TelegramSettings>({
    bot_token: '',
    chat_id: '',
    enabled: false,
  });
  const [webapp, setWebapp] = useState<WebAppSettings>({
    url: typeof window !== 'undefined' ? window.location.origin : '',
    button_text: t.openShopBtn,
    short_name: 't.me/orsihomebot/katalog',
  });

  const [savingWebapp, setSavingWebapp] = useState(false);
  const [connectingBot, setConnectingBot] = useState(false);
  const [botInfo, setBotInfo] = useState<{ username?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const [amocrm, setAmocrm] = useState<AmoCrmSettings>({
    domain: '',
    client_id: '',
    client_secret: '',
    connected: false,
  });
  const [savingAmocrm, setSavingAmocrm] = useState(false);
  const [connectingAmocrm, setConnectingAmocrm] = useState(false);
  const [testingAmocrm, setTestingAmocrm] = useState(false);
  const [amocrmToken, setAmocrmToken] = useState('');
  const [savingAmocrmToken, setSavingAmocrmToken] = useState(false);
  const [amocrmTestResult, setAmocrmTestResult] = useState<'success' | 'error' | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle the redirect back from AmoCRM's OAuth authorize page (?code=...&state=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const authError = params.get('error');

    if (authError) {
      toast({ title: t.errorTitle, description: t.amocrmAuthDenied, variant: 'destructive' });
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    if (!code) return;

    const savedState = sessionStorage.getItem('amocrm_oauth_state');
    sessionStorage.removeItem('amocrm_oauth_state');

    if (!savedState || savedState !== state) {
      toast({ title: t.errorTitle, description: t.amocrmStateMismatch, variant: 'destructive' });
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    (async () => {
      setConnectingAmocrm(true);
      try {
        const redirect_uri = `${window.location.origin}/admin/settings`;
        const { data, error } = await supabase.functions.invoke('amocrm-connect', {
          body: { code, redirect_uri },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || t.amocrmConnectError);
        toast({ title: t.successTitle, description: t.amocrmConnected });
        await fetchSettings();
      } catch (err: any) {
        toast({ title: t.errorTitle, description: err.message || t.amocrmConnectError, variant: 'destructive' });
      } finally {
        setConnectingAmocrm(false);
        window.history.replaceState(null, '', window.location.pathname);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      const settings: Record<string, string> = {};
      data?.forEach(item => {
        settings[item.key] = item.value || '';
      });

      setTelegram({
        bot_token: settings['telegram_bot_token'] || '',
        chat_id: settings['telegram_chat_id'] || '',
        enabled: settings['telegram_enabled'] === 'true',
      });
      setWebapp((prev) => ({
        url: settings['telegram_webapp_url'] || prev.url,
        button_text: settings['telegram_webapp_button'] || prev.button_text,
        short_name: settings['telegram_webapp_short_name'] || prev.short_name,
      }));

      setAmocrm({
        domain: settings['amocrm_domain'] || '',
        client_id: settings['amocrm_client_id'] || '',
        client_secret: settings['amocrm_client_secret'] || '',
        connected: !!settings['amocrm_access_token'] && settings['amocrm_enabled'] === 'true',
      });

    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTelegramSettings = async () => {
    if (telegram.bot_token && !/^\d+:[A-Za-z0-9_-]+$/.test(telegram.bot_token)) {
      toast({ title: t.errorTitle, description: t.invalidToken, variant: 'destructive' });
      return;
    }

    if (telegram.chat_id && !/^-?\d+$/.test(telegram.chat_id)) {
      toast({ title: t.errorTitle, description: t.invalidChatId, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const updates = [
        { key: 'telegram_bot_token', value: telegram.bot_token },
        { key: 'telegram_chat_id', value: telegram.chat_id },
        { key: 'telegram_enabled', value: telegram.enabled.toString() },
      ];

      for (const update of updates) {
        const { data: existing } = await supabase
          .from('settings')
          .select('id')
          .eq('key', update.key)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('settings')
            .update({ value: update.value, updated_at: new Date().toISOString() })
            .eq('key', update.key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('settings')
            .insert({ key: update.key, value: update.value });
          if (error) throw error;
        }
      }

      toast({ title: t.successTitle, description: t.settingsSaved });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: t.errorTitle, description: t.settingsSaveError, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const testTelegramConnection = async () => {
    if (!telegram.bot_token || !telegram.chat_id) {
      toast({ title: t.errorTitle, description: t.enterTokenAndChat, variant: 'destructive' });
      return;
    }

    if (!telegram.enabled) {
      toast({ title: t.errorTitle, description: t.enableFirst, variant: 'destructive' });
      return;
    }

    await saveTelegramSettings();

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-telegram', {
        body: { type: 'test' },
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult('success');
        toast({ title: t.successTitle, description: t.testSuccess });
      } else {
        throw new Error(data?.error || t.testError);
      }
    } catch (error: any) {
      setTestResult('error');
      toast({ title: t.errorTitle, description: error.message || t.testError, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const upsertSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', key)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('settings').insert({ key, value });
      if (error) throw error;
    }
  };

  const saveAndConnectWebApp = async () => {
    if (!telegram.bot_token) {
      toast({ title: t.errorTitle, description: t.saveTokenFirst, variant: 'destructive' });
      return;
    }
    const url = webapp.url.trim();
    if (!/^https:\/\/.+/i.test(url)) {
      toast({ title: t.errorTitle, description: t.urlMustBeHttps, variant: 'destructive' });
      return;
    }
    setSavingWebapp(true);
    setConnectingBot(true);
    try {
      await upsertSetting('telegram_webapp_url', url);
      await upsertSetting('telegram_webapp_button', webapp.button_text || t.openShopBtn);
      await upsertSetting('telegram_webapp_short_name', webapp.short_name.trim());
      await upsertSetting('telegram_bot_token', telegram.bot_token);

      const { data, error } = await supabase.functions.invoke('send-telegram', {
        body: {
          type: 'setup_webapp',
          webapp_url: url,
          webapp_button_text: webapp.button_text,
          webapp_short_name: webapp.short_name,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || t.connectError);

      setBotInfo({ username: data.bot?.username });
      toast({ title: t.successTitle, description: t.webappConnected(data.bot?.username || 'bot') });
    } catch (err: any) {
      toast({ title: t.errorTitle, description: err.message || t.connectError, variant: 'destructive' });
    } finally {
      setSavingWebapp(false);
      setConnectingBot(false);
    }
  };

  const saveAmocrmSettings = async () => {
    const domain = normalizeAmoDomain(amocrm.domain);
    if (!domain || !amocrm.client_id.trim()) {
      toast({ title: t.errorTitle, description: t.amocrmFillFirst, variant: 'destructive' });
      return false;
    }
    setSavingAmocrm(true);
    try {
      await upsertSetting('amocrm_domain', domain);
      await upsertSetting('amocrm_client_id', amocrm.client_id.trim());
      if (amocrm.client_secret.trim()) {
        await upsertSetting('amocrm_client_secret', amocrm.client_secret.trim());
      }
      setAmocrm((prev) => ({ ...prev, domain }));
      toast({ title: t.successTitle, description: t.settingsSaved });
      return true;
    } catch (err: any) {
      toast({ title: t.errorTitle, description: err.message || t.settingsSaveError, variant: 'destructive' });
      return false;
    } finally {
      setSavingAmocrm(false);
    }
  };

  const connectWithLongLivedToken = async () => {
    const domain = normalizeAmoDomain(amocrm.domain);
    if (!domain || !amocrmToken.trim()) {
      toast({ title: t.errorTitle, description: t.amocrmFillFirst, variant: 'destructive' });
      return;
    }
    setSavingAmocrmToken(true);
    try {
      const farFuture = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString();
      await upsertSetting('amocrm_domain', domain);
      await upsertSetting('amocrm_access_token', amocrmToken.trim());
      await upsertSetting('amocrm_token_expires_at', farFuture);
      await upsertSetting('amocrm_refresh_token', '');
      await upsertSetting('amocrm_enabled', 'true');
      setAmocrm((prev) => ({ ...prev, domain, connected: true }));
      setAmocrmToken('');
      toast({ title: t.successTitle, description: t.amocrmConnected });
    } catch (err: any) {
      toast({ title: t.errorTitle, description: err.message || t.amocrmConnectError, variant: 'destructive' });
    } finally {
      setSavingAmocrmToken(false);
    }
  };

  const connectAmocrm = async () => {
    const domain = normalizeAmoDomain(amocrm.domain);
    if (!domain || !amocrm.client_id.trim() || !amocrm.client_secret.trim()) {
      toast({ title: t.errorTitle, description: t.amocrmFillFirst, variant: 'destructive' });
      return;
    }
    setConnectingAmocrm(true);
    const ok = await saveAmocrmSettings();
    if (!ok) {
      setConnectingAmocrm(false);
      return;
    }
    const state = crypto.randomUUID();
    sessionStorage.setItem('amocrm_oauth_state', state);
    const authorizeUrl = `https://${domain}/oauth?client_id=${encodeURIComponent(amocrm.client_id.trim())}&state=${encodeURIComponent(state)}`;
    window.location.href = authorizeUrl;
  };

  const disconnectAmocrm = async () => {
    setConnectingAmocrm(true);
    try {
      await upsertSetting('amocrm_enabled', 'false');
      await upsertSetting('amocrm_access_token', '');
      await upsertSetting('amocrm_refresh_token', '');
      setAmocrm((prev) => ({ ...prev, connected: false }));
      toast({ title: t.successTitle, description: t.amocrmDisconnected });
    } catch (err: any) {
      toast({ title: t.errorTitle, description: err.message || t.amocrmConnectError, variant: 'destructive' });
    } finally {
      setConnectingAmocrm(false);
    }
  };

  const testAmocrm = async () => {
    setTestingAmocrm(true);
    setAmocrmTestResult(null);
    try {
      const { data, error } = await supabase.rpc('amocrm_test_lead');
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || t.amocrmTestError);
      setAmocrmTestResult('success');
      toast({ title: t.successTitle, description: t.amocrmTestSuccess });
    } catch (err: any) {
      setAmocrmTestResult('error');
      toast({ title: t.errorTitle, description: err.message || t.amocrmTestError, variant: 'destructive' });
    } finally {
      setTestingAmocrm(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {/* Telegram Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {t.telegramBot}
          </CardTitle>
          <CardDescription>{t.telegramBotDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="telegram-enabled">{t.enableTelegram}</Label>
            <Switch
              id="telegram-enabled"
              checked={telegram.enabled}
              onCheckedChange={(checked) => setTelegram(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-token">{t.botToken}</Label>
            <Input
              id="bot-token"
              type="password"
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={telegram.bot_token}
              onChange={(e) => setTelegram(prev => ({ ...prev, bot_token: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{t.botTokenHint}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chat-id">{t.chatId}</Label>
            <Input
              id="chat-id"
              placeholder="-1001234567890"
              value={telegram.chat_id}
              onChange={(e) => setTelegram(prev => ({ ...prev, chat_id: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{t.chatIdHint}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={saveTelegramSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? t.saving : t.save}
            </Button>
            <Button 
              variant="outline" 
              onClick={testTelegramConnection}
              disabled={testing}
            >
              {testing ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
              ) : testResult === 'success' ? (
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              ) : testResult === 'error' ? (
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t.testMessage}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Web App */}
      <Card>
        <CardHeader>
          <CardTitle>{t.webAppTitle}</CardTitle>
          <CardDescription>{t.webAppDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webapp-url">{t.webAppUrl}</Label>
            <Input
              id="webapp-url"
              placeholder="https://sizning-saytingiz.uz"
              value={webapp.url}
              onChange={(e) => setWebapp((p) => ({ ...p, url: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              {t.webAppUrlHint}: {typeof window !== 'undefined' ? window.location.origin : ''}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webapp-button">{t.buttonText}</Label>
            <Input
              id="webapp-button"
              placeholder={t.openShopBtn}
              maxLength={32}
              value={webapp.button_text}
              onChange={(e) => setWebapp((p) => ({ ...p, button_text: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webapp-short-name">{t.webAppShortName}</Label>
            <Input
              id="webapp-short-name"
              placeholder={t.webAppShortNamePlaceholder}
              value={webapp.short_name}
              onChange={(e) => setWebapp((p) => ({ ...p, short_name: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{t.webAppShortNameHint}</p>
          </div>


          {botInfo?.username && (
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
              ✅ Bot: <a className="font-medium underline" href={`https://t.me/${botInfo.username}`} target="_blank" rel="noreferrer">@{botInfo.username}</a> — {t.botConnected}
            </div>
          )}

          <div className="pt-2">
            <Button onClick={saveAndConnectWebApp} disabled={savingWebapp || connectingBot}>
              {connectingBot ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t.saveAndConnect}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Post Catalog button to channel */}
      <ChannelCatalogPost
        webappUrl={webapp.url}
        defaultButton={webapp.button_text || t.catalog}
        shortName={webapp.short_name}
      />

      {/* AmoCRM Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {t.amocrmTitle}
          </CardTitle>
          <CardDescription>{t.amocrmDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border p-3 text-sm flex items-center gap-2">
            {amocrm.connected ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t.amocrmConnected}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-muted-foreground" />
                {t.amocrmNotConnected}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amocrm-domain">{t.amocrmDomain}</Label>
            <Input
              id="amocrm-domain"
              placeholder="yourcompany.amocrm.ru"
              value={amocrm.domain}
              onChange={(e) => setAmocrm((p) => ({ ...p, domain: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{t.amocrmDomainHint}</p>
          </div>

          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div>
              <p className="font-medium text-sm">{t.amocrmQuickConnect}</p>
              <p className="text-xs text-muted-foreground">{t.amocrmQuickConnectDesc}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amocrm-long-token">{t.amocrmLongLivedToken}</Label>
              <Input
                id="amocrm-long-token"
                type="password"
                value={amocrmToken}
                onChange={(e) => setAmocrmToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t.amocrmLongLivedTokenHint}</p>
            </div>
            <Button onClick={connectWithLongLivedToken} disabled={savingAmocrmToken}>
              {savingAmocrmToken ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              {t.amocrmConnect}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">{t.amocrmOrOauth}</p>

          <div className="space-y-2">
            <Label htmlFor="amocrm-client-id">{t.amocrmClientId}</Label>
            <Input
              id="amocrm-client-id"
              value={amocrm.client_id}
              onChange={(e) => setAmocrm((p) => ({ ...p, client_id: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{t.amocrmClientIdHint}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amocrm-client-secret">{t.amocrmClientSecret}</Label>
            <Input
              id="amocrm-client-secret"
              type="password"
              value={amocrm.client_secret}
              onChange={(e) => setAmocrm((p) => ({ ...p, client_secret: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{t.amocrmClientSecretHint}</p>
          </div>

          <div className="space-y-2">
            <Label>{t.amocrmRedirectUriLabel}</Label>
            <Input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/admin/settings` : ''} />
            <p className="text-xs text-muted-foreground">{t.amocrmRedirectUriHint}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={saveAmocrmSettings} disabled={savingAmocrm}>
              <Save className="mr-2 h-4 w-4" />
              {savingAmocrm ? t.saving : t.amocrmSave}
            </Button>

            {amocrm.connected ? (
              <Button variant="outline" onClick={disconnectAmocrm} disabled={connectingAmocrm}>
                <Unlink className="mr-2 h-4 w-4" />
                {t.amocrmDisconnect}
              </Button>
            ) : (
              <Button variant="outline" onClick={connectAmocrm} disabled={connectingAmocrm}>
                {connectingAmocrm ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                {connectingAmocrm ? t.amocrmConnecting : t.amocrmConnectOauth}
              </Button>
            )}

            {amocrm.connected && (
              <Button variant="outline" onClick={testAmocrm} disabled={testingAmocrm}>
                {testingAmocrm ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                ) : amocrmTestResult === 'success' ? (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                ) : amocrmTestResult === 'error' ? (
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {t.amocrmTestLead}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AmoCRM Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>{t.amocrmGuideTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. {t.amocrmStep1}</h4>
            <p className="text-sm text-muted-foreground">{t.amocrmStep1Desc}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">2. {t.amocrmStep2}</h4>
            <p className="text-sm text-muted-foreground">{t.amocrmStep2Desc}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">3. {t.amocrmStep3}</h4>
            <p className="text-sm text-muted-foreground">{t.amocrmStep3Desc}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">4. {t.amocrmStep4}</h4>
            <p className="text-sm text-muted-foreground">{t.amocrmStep4Desc}</p>
          </div>
        </CardContent>
      </Card>


      {/* How to Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>{t.guideTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. {t.step1}</h4>
            <p className="text-sm text-muted-foreground">{t.step1Desc}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">2. {t.step2}</h4>
            <p className="text-sm text-muted-foreground">{t.step2Desc}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">3. {t.step3}</h4>
            <p className="text-sm text-muted-foreground">{t.step3Desc}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
