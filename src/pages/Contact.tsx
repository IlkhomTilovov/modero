import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail, MapPin, Clock, Send, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { EditableText } from '@/components/EditableText';
import { EditableLink } from '@/components/EditableLink';
import { useSiteContent } from '@/hooks/useSiteContent';
import { cn } from '@/lib/utils';
import { getPageSeo } from '@/lib/pageSeo';

interface Branch {
  id: string;
  name_uz: string;
  name_ru: string;
  address_uz: string;
  address_ru: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  order_index: number;
}

export default function Contact() {
  const { language, t } = useLanguage();
  const seo = getPageSeo('contact', language);

  useSEO({ title: seo.title, description: seo.description, ogTitle: seo.title, ogDescription: seo.description });
  const { toast } = useToast();
  const { getContent } = useSiteContent();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      const list = (data as Branch[]) || [];
      setBranches(list);
      if (list.length > 0) setSelectedBranchId(list[0].id);
    })();
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    setIsMobile(/android|iphone|ipad|ipod/i.test(userAgent.toLowerCase()));
  }, []);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email?.trim() || null,
        message: form.message.trim(),
      });

      if (error) throw error;

      toast({
        title: t.contact.form.success,
        description: "Tez orada siz bilan bog'lanamiz!",
      });
      
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: language === 'uz' ? "Xabar yuborishda xatolik yuz berdi" : "Ошибка при отправке сообщения",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: Phone, labelKey: 'contact_phone_label', valueKey: 'contact_phone_value', label: t.contact.info.phone, value: '', href: '#' },
    { icon: Mail, labelKey: 'contact_email_label', valueKey: 'contact_email_value', label: t.contact.info.email, value: 'info@orsihome.uz', href: 'mailto:info@orsihome.uz' },
    { icon: Clock, labelKey: 'contact_hours_label', valueKey: 'contact_hours_value', label: t.contact.info.workingHours, value: 'Du-Ju: 9:00-18:00, Sha: 10:00-16:00', href: undefined },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-foreground to-foreground/90 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-primary text-xs tracking-[0.3em] uppercase font-medium">
            <EditableText contentKey="contact_label" fallback="Aloqa" as="span" className="text-xs tracking-[0.3em] uppercase font-medium" section="contact" />
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-background mt-4 mb-4">
            <EditableText 
              contentKey="contact_title" 
              fallback={t.contact.title}
              as="span"
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold"
              section="contact"
              field="title"
            />
          </h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">
            <EditableText 
              contentKey="contact_subtitle" 
              fallback={t.contact.subtitle}
              as="span"
              className="text-lg"
              section="contact"
              field="subtitle"
            />
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12 max-w-7xl mx-auto">
            
            {/* Contact Form - 3 cols */}
            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-lg">
                <div className="mb-8">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
                    <EditableText 
                      contentKey="contact_form_title" 
                      fallback={language === 'uz' ? "Bizga yozing" : "Напишите нам"}
                      as="span"
                      className="font-serif text-2xl md:text-3xl font-bold"
                      section="contact"
                      field="form_title"
                    />
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {language === 'uz' ? "Formani to'ldiring, biz siz bilan bog'lanamiz" : "Заполните форму, мы свяжемся с вами"}
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">{t.contact.form.name}</label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        maxLength={100}
                        placeholder="Ismingizni kiriting"
                        className="h-12 rounded-lg border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">{t.contact.form.phone}</label>
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                        maxLength={20}
                        placeholder="+998 90 123 45 67"
                        className="h-12 rounded-lg border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">{t.contact.form.email}</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      maxLength={255}
                      placeholder="email@example.com"
                      className="h-12 rounded-lg border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">{t.contact.form.message}</label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      maxLength={1000}
                      rows={5}
                      placeholder="Xabaringizni yozing..."
                      className="rounded-lg border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors resize-none"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full h-14 rounded-lg text-base font-semibold gap-2 group" disabled={loading}>
                    {loading ? 'Yuborilmoqda...' : t.contact.form.submit}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </Button>
                </form>
              </div>
            </div>

            {/* Contact Info - 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground">
                <EditableText 
                  contentKey="contact_info_title" 
                  fallback={language === 'uz' ? "Bog'lanish ma'lumotlari" : "Контактная информация"}
                  as="span"
                  className="font-serif text-2xl font-bold"
                  section="contact"
                  field="info_title"
                />
              </h2>
              
              <div className="space-y-4">
                {contactInfo.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all duration-300 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 text-sm">
                        <EditableText 
                          contentKey={item.labelKey} 
                          fallback={item.label}
                          as="span"
                          className="font-semibold text-sm"
                          section="contact"
                          field={item.labelKey}
                        />
                      </h4>
                      {item.href ? (
                        <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                          <EditableText 
                            contentKey={item.valueKey} 
                            fallback={item.value}
                            as="span"
                            className="text-sm"
                            section="contact"
                            field={item.valueKey}
                          />
                        </a>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          <EditableText 
                            contentKey={item.valueKey} 
                            fallback={item.value}
                            as="span"
                            className="text-sm"
                            section="contact"
                            field={item.valueKey}
                          />
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="pt-2">
                <EditableLink
                  contentKey="contact_telegram_link"
                  fallback="https://t.me/mebelusta"
                  className="block"
                >
                  <Button size="lg" variant="outline" className="w-full gap-2 rounded-xl h-14 border-primary/20 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-primary">
                    <Send className="w-5 h-5 text-primary" /> Telegram
                  </Button>
                </EditableLink>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Branches / Map Section */}
      {branches.length > 0 && selectedBranch && (
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-primary text-xs tracking-[0.3em] uppercase font-medium">
                  {language === 'uz' ? 'Manzillar' : 'Адреса'}
                </span>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-3">
                  {language === 'uz' ? 'Bizning filiallarimiz' : 'Наши филиалы'}
                </h2>
              </div>

              <div className="grid lg:grid-cols-5 gap-6">
                {/* Branch list */}
                <div className="lg:col-span-2 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {branches.map((b) => {
                    const active = b.id === selectedBranch.id;
                    const name = language === 'ru' && b.name_ru ? b.name_ru : b.name_uz;
                    const address = language === 'ru' && b.address_ru ? b.address_ru : b.address_uz;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBranchId(b.id)}
                        className={cn(
                          'w-full text-left p-5 rounded-xl border transition-all',
                          active
                            ? 'bg-primary/5 border-primary shadow-md'
                            : 'bg-card border-border hover:border-primary/40'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                              active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                            )}
                          >
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{address}</p>
                            {b.phone && (
                              <a
                                href={`tel:${b.phone.replace(/\s/g, '')}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
                              >
                                <Phone className="w-3.5 h-3.5" /> {b.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Map */}
                <div className="lg:col-span-3">
                  <div className="rounded-2xl overflow-hidden border border-border shadow-lg h-[400px] lg:h-[500px] bg-card">
                    <iframe
                      key={selectedBranch.id}
                      title={selectedBranch.name_uz}
                      src={`https://yandex.uz/map-widget/v1/?ll=${selectedBranch.longitude}%2C${selectedBranch.latitude}&z=16&pt=${selectedBranch.longitude}%2C${selectedBranch.latitude}%2Cpm2rdm&lang=${language === 'ru' ? 'ru_RU' : 'uz_UZ'}`}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                  <a
                    href={`https://yandex.uz/maps/?ll=${selectedBranch.longitude},${selectedBranch.latitude}&z=17&pt=${selectedBranch.longitude},${selectedBranch.latitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-3"
                    onClick={(e) => {
                      if (!isMobile) return;
                      e.preventDefault();
                      const appUrl = `yandexmaps://maps.yandex.com/?ll=${selectedBranch.longitude},${selectedBranch.latitude}&z=17&pt=${selectedBranch.longitude},${selectedBranch.latitude}`;
                      const webUrl = e.currentTarget.href;
                      window.location.href = appUrl;
                      setTimeout(() => {
                        window.location.href = webUrl;
                      }, 1500);
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {language === 'uz' ? "Yandex Mapsda ochish" : 'Открыть в Яндекс.Картах'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
