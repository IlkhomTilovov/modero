import { Link } from 'react-router-dom';
import { Phone, Send, Instagram, Clock, MapPin } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { EditableText } from '@/components/EditableText';
import { EditableLink } from '@/components/EditableLink';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function Footer() {
  const { language } = useLanguage();
  const { settings, getAddress, getWorkingHours } = useSystemSettings();
  const brandName = settings?.site_name || '';
  const logoUrl = settings?.logo_url;

  const { data: categories } = useQuery({
    queryKey: ['footer-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name_uz, name_ru, slug')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      return data || [];
    },
  });

  const contactPhone = settings?.contact_phone || '';
  const address = getAddress(language);
  const workingHours = getWorkingHours(language);

  const navLinks = [
    { to: '/', label: language === 'ru' ? 'Главная' : 'Bosh sahifa' },
    { to: '/catalog', label: language === 'ru' ? 'Каталог' : 'Katalog' },
    { to: '/about', label: language === 'ru' ? 'О нас' : 'Biz xaqimizda' },
    { to: '/contact', label: language === 'ru' ? 'Контакты' : 'Aloqa' },
  ];

  return (
    <footer className="bg-secondary/40 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-12 md:py-16">
        <div className="bg-background shadow-sm rounded-2xl py-12 md:py-16 px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20">
            {/* Brand */}
            <div className="md:col-span-5 flex flex-col space-y-6">
              <div className="space-y-3">
                <Link to="/" className="inline-block">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={brandName}
                      width={140}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="h-10 md:h-12 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-xl font-serif font-bold tracking-wide text-foreground">
                      {brandName}
                    </span>
                  )}
                </Link>
                <EditableText
                  contentKey="footer_description"
                  fallback="Zamonaviy, sifatli va individual buyurtma asosida ishlab chiqariladigan premium mebellar."
                  as="p"
                  className="text-sm leading-relaxed text-muted-foreground max-w-sm"
                  multiline
                  section="footer"
                />
              </div>
              <div className="flex gap-4">
                <EditableLink
                  contentKey="footer_social_telegram"
                  fallback={settings?.social_telegram || '#'}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                  section="footer"
                >
                  <Send className="w-5 h-5" />
                </EditableLink>
                <EditableLink
                  contentKey="footer_social_instagram"
                  fallback={settings?.social_instagram || '#'}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                  section="footer"
                >
                  <Instagram className="w-5 h-5" />
                </EditableLink>
              </div>
            </div>

            {/* Navigation */}
            <div className="md:col-span-3 flex flex-col">
              <EditableText
                contentKey="footer_nav_title"
                fallback="Sahifalar"
                as="h3"
                className="font-serif text-lg font-bold text-foreground mb-6"
                section="footer"
              />
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-4 flex flex-col">
              <EditableText
                contentKey="footer_contact_title"
                fallback="Bog'lanish"
                as="h3"
                className="font-serif text-lg font-bold text-foreground mb-6"
                section="footer"
              />
              <ul className="space-y-5">
                <li className="flex items-start">
                  <div className="mt-1 mr-4 text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <EditableText
                    contentKey="footer_address"
                    fallback={address || "Toshkent sh., Chilonzor tumani"}
                    as="span"
                    className="text-sm text-muted-foreground leading-snug"
                    multiline
                    section="footer"
                  />
                </li>
                <li className="flex items-center">
                  <div className="mr-4 text-primary">
                    <Phone className="w-5 h-5" />
                  </div>
                  <EditableText
                    contentKey="footer_phone"
                    fallback={contactPhone}
                    as="span"
                    className="text-sm text-muted-foreground"
                    section="footer"
                  />
                </li>
                <li className="flex items-center">
                  <div className="mr-4 text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <EditableText
                    contentKey="footer_working_hours"
                    fallback={workingHours || "Dush–Shan: 09:00–18:00"}
                    as="span"
                    className="text-sm text-muted-foreground leading-snug"
                    multiline
                    section="footer"
                  />
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}{' '}
              <EditableText contentKey="footer_copyright" fallback={`${brandName}. Barcha huquqlar himoyalangan.`} as="span" className="text-xs" section="footer" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

