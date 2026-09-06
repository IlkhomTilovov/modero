import { Link, useLocation } from 'react-router-dom';
import { X, ShoppingBag, Phone, ChevronDown, ChevronRight, LayoutGrid, Tag, Sparkles, Search, Info, Shield, Send, Instagram } from 'lucide-react';
import { lazy, Suspense, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useCategories, useSections, type Product } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';

const CartDrawer = lazy(() => import('@/components/CartDrawer').then((m) => ({ default: m.CartDrawer })));

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { totalItems } = useCart();
  const location = useLocation();
  const { settings } = useSystemSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    window.addEventListener('open-mobile-menu', openHandler);
    return () => window.removeEventListener('open-mobile-menu', openHandler);
  }, []);

  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const shouldLoadCatalogData = catalogOpen || mobileCatalogOpen;
  const { categories } = useCategories(shouldLoadCatalogData);
  const { sections } = useSections(shouldLoadCatalogData);
  const [mobileSectionId, setMobileSectionId] = useState<string | null>(null);
  
  
  const [activeSectionId, setActiveSectionId] = useState<string | null | undefined>(undefined);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!catalogOpen) {
      setActiveSectionId(undefined);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: promo }, { data: fresh }] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .not('original_price', 'is', null)
          .gt('original_price', 0)
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(4),
      ]);
      if (cancelled) return;
      const filteredPromo = (promo || []).filter(
        (p: any) => p.original_price && p.price && p.original_price > p.price
      );
      setPromoProducts(filteredPromo as Product[]);
      setNewProducts((fresh as Product[]) || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [catalogOpen]);





  const navLinks = [
    { href: '/', label: language === 'ru' ? 'Главная' : 'Bosh sahifa' },
    { href: '/catalog', label: language === 'ru' ? 'Каталог' : 'Katalog' },
    { href: '/about', label: language === 'ru' ? 'О нас' : 'Biz xaqimizda' },
    { href: '/contact', label: language === 'ru' ? 'Контакты' : 'Aloqa' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const contactPhone = settings?.contact_phone || '';
  const logoUrl = settings?.logo_url;
  const brandName = settings?.site_name || '';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-luxe relative ${
        catalogOpen
          ? 'bg-background shadow-soft-md py-2 border-b border-border/30'
          : scrolled
          ? 'glass-surface shadow-soft-md py-2'
          : 'bg-background/60 backdrop-blur-md py-4 border-b border-border/20'
      }`}
    >

      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName}
                width={140}
                height={40}
                fetchpriority="high"
                decoding="async"
                className="h-8 md:h-10 w-auto object-contain"
              />
            ) : (
              <span className="text-lg md:text-xl font-serif font-bold tracking-wide text-foreground">
                {brandName}
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => {
              if (link.href === '/catalog') {
                return (
                  <div key={link.href} className="relative">
                    <button
                      type="button"
                      onClick={() => setCatalogOpen(v => !v)}
                      className={`flex items-center gap-1 text-sm font-medium tracking-widest uppercase transition-colors duration-300 hover:text-primary relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 ${
                        isActive(link.href) || catalogOpen
                          ? 'text-primary after:w-full'
                          : 'text-muted-foreground after:w-0 hover:after:w-full'
                      }`}
                    >
                      {link.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catalogOpen ? 'rotate-180' : ''}`} />
                    </button>

                  </div>


                );
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium tracking-widest uppercase transition-colors duration-300 hover:text-primary relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 ${
                    isActive(link.href)
                      ? 'text-primary after:w-full'
                      : 'text-muted-foreground after:w-0 hover:after:w-full'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Language */}
            <div className="flex items-center border border-border rounded-sm overflow-hidden">
              <button
                onClick={() => setLanguage('uz')}
                className={`px-2.5 py-1 text-xs font-medium tracking-wider transition-all duration-300 ${
                  language === 'uz' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                UZ
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-2.5 py-1 text-xs font-medium tracking-wider transition-all duration-300 ${
                  language === 'ru' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                RU
              </button>
            </div>

            {/* Phone - desktop */}
            <a 
              href={`tel:${contactPhone.replace(/\s/g, '')}`} 
              className="hidden xl:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>{contactPhone}</span>
            </a>

            {/* CTA Button - desktop */}
            <Button asChild className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm tracking-wider text-xs uppercase px-6">
              <Link to="/contact">{language === 'ru' ? 'Связаться' : "Bog'lanish"}</Link>
            </Button>

            {/* Cart */}
            <button onClick={() => setCartOpen(prev => !prev)} className="relative hidden lg:block">
              <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary" asChild>
                <span>
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                      {totalItems}
                    </span>
                  )}
                </span>
              </Button>
            </button>
          </div>
        </div>
      </div>



      {/* Mobile Drawer - left slide-in */}
      {createPortal(
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] lg:hidden transition-opacity duration-300 ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsOpen(false)}
          />
          {/* Drawer */}
          <aside
            className={`fixed top-3 bottom-3 left-3 w-[84%] max-w-[340px] bg-background rounded-3xl border border-border/60 overflow-hidden z-[90] lg:hidden shadow-soft-xl flex flex-col transition-transform duration-300 ease-luxe ${
              isOpen ? 'translate-x-0' : '-translate-x-[110%]'
            }`}
            aria-hidden={!isOpen}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <h2 className="text-base font-semibold text-foreground">
                {language === 'ru' ? 'Меню' : 'Menyu'}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                aria-label="close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Search */}
              <div className="px-5 pt-4 pb-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const input = form.elements.namedItem('q') as HTMLInputElement;
                    const q = input?.value.trim();
                    setIsOpen(false);
                    window.location.href = q ? `/catalog?search=${encodeURIComponent(q)}` : '/catalog';
                  }}
                  className="relative"
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    name="q"
                    type="text"
                    placeholder={language === 'ru' ? 'Поиск мебели...' : 'Mebel qidirish...'}
                    className="w-full h-11 pl-10 pr-4 rounded-full bg-muted/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </form>
              </div>

              {/* Primary items */}
              <div className="px-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setMobileCatalogOpen(v => !v); }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-3 text-[14.5px] font-medium text-foreground">
                    <LayoutGrid className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.75} />
                    {language === 'ru' ? 'Каталог' : 'Katalog'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${mobileCatalogOpen ? 'rotate-180' : ''}`} />
                </button>

                {mobileCatalogOpen && (
                  <div className="ml-[26px] mt-1 mb-2 pl-4 border-l border-border/60">
                    {mobileSectionId === null ? (
                      <div className="flex flex-col">
                        {sections.map((section) => {
                          const hasCats = categories.some((c) => !c.parent_id && c.section_id === section.id);
                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => {
                                if (hasCats) {
                                  setMobileSectionId(section.id);
                                } else {
                                  setIsOpen(false);
                                  setMobileCatalogOpen(false);
                                  window.location.href = `/catalog?section=${section.slug}`;
                                }
                              }}
                              className="w-full flex items-center justify-between px-3 py-2.5 text-[13.5px] font-medium text-foreground/90 hover:text-primary hover:bg-muted/60 rounded-lg transition-colors text-left"
                            >
                              <span>{language === 'ru' ? section.name_ru : section.name_uz}</span>
                              {hasCats && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (() => {
                      const section = sections.find((s) => s.id === mobileSectionId);
                      const cats = categories.filter((c) => !c.parent_id && c.section_id === mobileSectionId);
                      return (
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => setMobileSectionId(null)}
                            className="flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            {language === 'ru' ? 'Назад' : 'Orqaga'}
                          </button>
                          {section && (
                            <Link
                              to={`/catalog?section=${section.slug}`}
                              onClick={() => { setIsOpen(false); setMobileCatalogOpen(false); setMobileSectionId(null); }}
                              className="px-3 py-2.5 text-[13.5px] font-semibold text-primary hover:bg-muted/60 rounded-lg block transition-colors"
                            >
                              {language === 'ru' ? `Все в «${section.name_ru}»` : `«${section.name_uz}» — barchasi`}
                            </Link>
                          )}
                          {cats.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/catalog?category=${cat.slug}`}
                              onClick={() => { setIsOpen(false); setMobileCatalogOpen(false); setMobileSectionId(null); }}
                              className="px-3 py-2.5 text-[13.5px] font-medium text-foreground/90 hover:text-primary hover:bg-muted/60 rounded-lg block transition-colors"
                            >
                              {language === 'ru' ? cat.name_ru : cat.name_uz}
                            </Link>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <button
                  onClick={() => { setIsOpen(false); setCartOpen(true); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors text-[14.5px] font-medium text-foreground text-left"
                >
                  <ShoppingBag className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.75} />
                  <span className="flex-1">{language === 'ru' ? 'Корзина' : 'Savat'}</span>
                  {totalItems > 0 && (
                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>

              {/* Kompaniya */}
              <div className="px-3 pt-5">
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {language === 'ru' ? 'Компания' : 'Kompaniya'}
                </p>
                <Link
                  to="/about"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-[14px] text-foreground"
                >
                  <Info className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.75} />
                  {language === 'ru' ? 'О нас' : 'Biz haqimizda'}
                </Link>
              </div>

              {/* Biz bilan bog'laning */}
              <div className="px-3 pt-5 pb-6">
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {language === 'ru' ? 'Свяжитесь с нами' : "Biz bilan bog'laning"}
                </p>
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone.replace(/\s/g, '')}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-[14px] text-foreground"
                  >
                    <Phone className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.75} />
                    {contactPhone}
                  </a>
                )}
                {settings?.social_telegram && (
                  <a
                    href={settings.social_telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-[14px] text-foreground"
                  >
                    <Send className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.75} />
                    Telegram
                  </a>
                )}
                {settings?.social_instagram && (
                  <a
                    href={settings.social_instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-[14px] text-foreground"
                  >
                    <Instagram className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.75} />
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </aside>
        </>,
        document.body
      )}


      {/* Floating Mega Menu */}
      {catalogOpen && createPortal(
        (() => {
          const displaySections = [
            ...sections.map((s) => ({
              id: s.id,
              name: language === 'ru' ? s.name_ru : s.name_uz,
              parents: categories.filter((c) => !c.parent_id && c.section_id === s.id),
            })),
            {
              id: '__none__',
              name: language === 'ru' ? 'Другое' : 'Boshqa',
              parents: categories.filter((c) => !c.parent_id && !c.section_id),
            },
          ].filter((s) => s.parents.length > 0);

          const activeSection = displaySections.find((s) => s.id === activeSectionId);

          const formatPrice = (v: number | null) =>
            v == null ? '' : new Intl.NumberFormat('ru-RU').format(v) + " so'm";

          const ProductMini = ({ p }: { p: Product }) => (
            <Link
              to={`/product/${p.slug}`}
              onClick={() => setCatalogOpen(false)}
              className="group flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 ring-1 ring-border">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name_uz}
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <p className="text-[13px] font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {language === 'ru' ? p.name_ru : p.name_uz}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[13px] font-semibold text-foreground">{formatPrice(p.price)}</span>
                  {p.original_price && p.price && p.original_price > p.price && (
                    <span className="text-[11px] line-through text-muted-foreground">
                      {formatPrice(p.original_price)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );

          return (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] animate-fade-in"
                onClick={() => setCatalogOpen(false)}
              />
              <div className={`fixed left-4 top-1/2 -translate-y-1/2 z-[70] h-[95%] p-3 flex gap-3 animate-in slide-in-from-left duration-500 transition-all ${activeSectionId === undefined ? 'w-auto' : 'w-[95%]'}`}>
                {/* Dark left sidebar */}
                <aside
                  className="w-[280px] shrink-0 bg-background text-foreground flex flex-col rounded-[24px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.45)] ring-1 ring-border overflow-hidden relative z-[2]"
                >
                  <div className="px-6 pt-6 pb-4 flex items-center gap-2.5">
                    <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <LayoutGrid className="w-4 h-4" />
                    </span>
                    <div className="text-[15px] font-semibold tracking-wide">
                      {language === 'ru' ? 'Каталог' : 'Katalog'}
                    </div>
                  </div>

                  <div className="px-4">
                    <button
                      type="button"
                      onClick={() => setActiveSectionId(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors text-left ${
                        activeSectionId === null
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <LayoutGrid className="w-[17px] h-[17px]" strokeWidth={1.75} />
                      <span>{language === 'ru' ? 'Все товары' : 'Barcha tovarlar'}</span>
                    </button>
                  </div>

                  <div className="mx-6 my-4 h-px bg-border" />

                  <div className="px-4 pb-2">
                    <p className="px-3 mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {language === 'ru' ? 'Разделы' : "Bo'limlar"}
                    </p>
                  </div>

                  <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
                    {displaySections.map((section) => {
                      const isActive = activeSectionId === section.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => setActiveSectionId(section.id)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-[13.5px] font-medium transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <span className="truncate">{section.name}</span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-0.5' : 'opacity-50'}`} />
                        </button>
                      );
                    })}
                  </nav>

                  <div className="px-6 py-4 border-t border-border text-[11px] text-muted-foreground">
                    {brandName} · {language === 'ru' ? 'Мебель' : 'Mebel'}
                  </div>
                </aside>

                {/* Right content - appears after clicking a section */}
                {activeSectionId !== undefined && (
                  <div className="relative z-[1] flex-1 flex flex-col bg-card text-card-foreground rounded-[24px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.45)] ring-1 ring-border overflow-hidden min-w-0 animate-in slide-in-from-left duration-500">
                    <div className="flex items-center justify-between px-7 py-4 bg-card border-b border-border">
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {activeSection
                            ? activeSection.name
                            : language === 'ru' ? 'Рекомендуем' : 'Tavsiya etamiz'}
                        </span>
                        {activeSection && (
                          <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span>{activeSection.parents.length} {language === 'ru' ? 'категорий' : 'kategoriya'}</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setCatalogOpen(false)}
                        className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                        aria-label="close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      {activeSection ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {activeSection.parents.map((parent) => {
                            const subs = categories.filter((c) => c.parent_id === parent.id);
                            return (
                              <div
                                key={parent.id}
                                className="bg-background rounded-2xl p-4 ring-1 ring-border hover:ring-primary/30 hover:shadow-sm transition-all"
                              >
                                <Link
                                  to={`/catalog?category=${parent.slug}`}
                                  onClick={() => setCatalogOpen(false)}
                                  className="flex items-center gap-3 mb-3 group"
                                >
                                  {parent.image ? (
                                    <img
                                      src={parent.image}
                                      alt=""
                                      width={44}
                                      height={44}
                                      loading="lazy"
                                      decoding="async"
                                      className="w-11 h-11 rounded-xl object-cover shrink-0 ring-1 ring-border"
                                    />
                                  ) : (
                                    <span className="w-11 h-11 rounded-xl bg-muted shrink-0" />
                                  )}
                                  <span className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                    {language === 'ru' ? parent.name_ru : parent.name_uz}
                                  </span>
                                </Link>
                                {subs.length > 0 && (
                                  <ul className="space-y-0.5">
                                    {subs.slice(0, 5).map((sub) => (
                                      <li key={sub.id}>
                                        <Link
                                          to={`/catalog?category=${sub.slug}`}
                                          onClick={() => setCatalogOpen(false)}
                                          className="block text-[12.5px] py-1 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                          · {language === 'ru' ? sub.name_ru : sub.name_uz}
                                        </Link>
                                      </li>
                                    ))}
                                    {subs.length > 5 && (
                                      <li>
                                        <Link
                                          to={`/catalog?category=${parent.slug}`}
                                          onClick={() => setCatalogOpen(false)}
                                          className="block text-[12px] py-1 text-primary font-medium"
                                        >
                                          +{subs.length - 5} {language === 'ru' ? 'ещё' : "yana"}
                                        </Link>
                                      </li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                          <section className="bg-background rounded-2xl p-5 ring-1 ring-border shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex w-8 h-8 rounded-lg bg-primary/10 text-primary items-center justify-center">
                                  <Tag className="w-4 h-4" />
                                </span>
                                <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground">
                                  {language === 'ru' ? 'Со скидкой' : 'Chegirmada'}
                                </h3>
                              </div>
                              <Link
                                to="/catalog?discounted=1"
                                onClick={() => setCatalogOpen(false)}
                                className="text-[11.5px] font-medium text-muted-foreground hover:text-primary flex items-center gap-0.5"
                              >
                                {language === 'ru' ? 'Все' : 'Barchasi'}
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                            <div className="flex flex-col gap-1">
                              {promoProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground px-2 py-8 text-center">
                                  {language === 'ru' ? 'Пока нет товаров' : "Hozircha mahsulot yo'q"}
                                </p>
                              ) : (
                                promoProducts.map((p) => <ProductMini key={p.id} p={p} />)
                              )}
                            </div>
                          </section>
                          <section className="bg-background rounded-2xl p-5 ring-1 ring-border shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex w-8 h-8 rounded-lg bg-primary/10 text-primary items-center justify-center">
                                  <Sparkles className="w-4 h-4" />
                                </span>
                                <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground">
                                  {language === 'ru' ? 'Новинки' : 'Yangi kelganlar'}
                                </h3>
                              </div>
                              <Link
                                to="/catalog"
                                onClick={() => setCatalogOpen(false)}
                                className="text-[11.5px] font-medium text-muted-foreground hover:text-primary flex items-center gap-0.5"
                              >
                                {language === 'ru' ? 'Все' : 'Barchasi'}
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                            <div className="flex flex-col gap-1">
                              {newProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground px-2 py-8 text-center">
                                  {language === 'ru' ? 'Пока нет товаров' : "Hozircha mahsulot yo'q"}
                                </p>
                              ) : (
                                newProducts.map((p) => <ProductMini key={p.id} p={p} />)
                              )}
                            </div>
                          </section>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })(),
        document.body
      )}






      {cartOpen && createPortal(
        <Suspense fallback={null}>
          <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </Suspense>,
        document.body
      )}
    </header>
  );
}
