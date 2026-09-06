import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';
import { LazyImage } from '@/components/LazyImage';
import { Button } from '@/components/ui/button';

type Lang = 'uz' | 'ru';

interface CategoryLike {
  id: string;
  slug?: string | null;
  name_uz: string;
  name_ru: string;
  image?: string | null;
  show_in_banner?: boolean | null;
}

interface SetLike {
  id: string;
  title_uz: string;
  title_ru: string;
  image?: string | null;
}

interface ProductLike {
  id: string;
  name_uz: string;
  name_ru: string;
  slug?: string | null;
  price?: number | null;
  original_price?: number | null;
  images?: string[] | null;
}

/* ============ 1. Ikki ustunli kolleksiya bannerlari ============ */
export function CollectionBanners({
  categories,
  loading,
  language,
}: {
  categories: CategoryLike[];
  loading: boolean;
  language: Lang;
}) {
  if (loading) {
    return (
      <section className="container mx-auto px-4 lg:px-8 mt-10 lg:mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="aspect-[16/9] rounded-[2rem] bg-muted/50 animate-pulse" />
          <div className="aspect-[16/9] rounded-[2rem] bg-muted/50 animate-pulse" />
        </div>
      </section>
    );
  }

  // Admin panelda "Bosh sahifa bannerida ko'rsatish" yoqilgan toifalar ustuvor.
  // Bitta toifa belgilangan bo'lsa ham u birinchi o'rinda chiqadi, ikkinchi joy qolganlardan to'ldiriladi.
  const withImage = categories.filter((c) => c.image);
  const selected = withImage.filter((c) => c.show_in_banner);
  const others = withImage.filter((c) => !c.show_in_banner);
  const picks = [...selected, ...others].slice(0, 2);
  if (picks.length < 2) return null;

  return (
    <section className="container mx-auto px-4 lg:px-8 mt-10 lg:mt-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {picks.map((cat, i) => {
          const name = language === 'uz' ? cat.name_uz : cat.name_ru;
          return (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className={`group relative overflow-hidden rounded-[2rem] shadow-soft hover:shadow-soft-lg transition-all duration-500 ease-luxe ${
                i === 0 ? 'bg-secondary' : 'bg-muted'
              }`}
            >
              <div className="grid grid-cols-[1fr_1.1fr] items-center min-h-[210px] lg:min-h-[260px]">
                <div className="p-6 lg:p-9">
                  <h3 className="font-serif text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                    {name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground/80 max-w-[22ch]">
                    {language === 'uz'
                      ? 'Zamonaviy dizayn, uzoq muddatli sifat.'
                      : 'Современный дизайн, долговечное качество.'}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    {language === 'uz' ? 'Ko‘rish' : 'Смотреть'}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
                <div className="relative h-full min-h-[210px] lg:min-h-[260px]">
                  <LazyImage
                    src={cat.image as string}
                    alt={name}
                    wrapperClassName="absolute inset-0"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-luxe"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ============ 2. Chegirma banneri ============ */
export function DiscountBanner({
  products,
  language,
}: {
  products: ProductLike[];
  language: Lang;
}) {
  const [picked, setPicked] = useState<ProductLike | null>(null);

  // Admin panelda "Chegirma bannerida ko'rsatish" belgilangan mahsulot ustuvor.
  useEffect(() => {
    let alive = true;
    supabase
      .from('products')
      .select('id, name_uz, name_ru, slug, price, original_price, images')
      .eq('is_active', true)
      .eq('show_in_discount_banner', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (alive && data) setPicked(data as ProductLike);
      });
    return () => {
      alive = false;
    };
  }, []);

  const withDiscount = products
    .filter((p) => p.price && p.original_price && p.original_price > p.price)
    .map((p) => ({
      ...p,
      percent: Math.round(((p.original_price! - p.price!) / p.original_price!) * 100),
    }))
    .sort((a, b) => b.percent - a.percent);

  const source = picked ?? withDiscount[0];
  if (!source) return null;
  const percent =
    source.price && source.original_price && source.original_price > source.price
      ? Math.round(((source.original_price - source.price) / source.original_price) * 100)
      : null;
  const best = { ...source, percent };
  if (best.percent === null) return null;
  const image = best.images?.[0];

  return (
    <section className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-secondary">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
          <div className="order-2 md:order-1 p-8 lg:p-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
              {language === 'uz' ? 'Cheklangan taklif' : 'Ограниченное предложение'}
            </span>
            <h2 className="mt-4 font-serif text-4xl lg:text-6xl font-bold text-foreground leading-[1.05]">
              {language === 'uz' ? 'Chegirma' : 'Скидка'}{' '}
              <span className="text-accent">{best.percent}%</span>
              <span className="block text-2xl lg:text-3xl font-medium mt-2 text-muted-foreground/90">
                {language === 'uz' ? 'eng sara mahsulotlarda' : 'на бестселлеры'}
              </span>
            </h2>
            <Button asChild size="lg" className="mt-8 rounded-full px-8 gap-2">
              <Link to="/catalog?discounted=1">
                {language === 'uz' ? 'Taklifni olish' : 'Получить предложение'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="order-1 md:order-2 relative aspect-[16/10] md:aspect-auto md:h-full md:min-h-[320px]">

            {image && (
              <LazyImage
                src={image}
                alt={language === 'uz' ? best.name_uz : best.name_ru}
                wrapperClassName="absolute inset-0"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ 3. Ilhom bloki (to'plamlar) ============ */
export function InspirationSection({
  sets,
  loading,
  language,
}: {
  sets: SetLike[];
  loading: boolean;
  language: Lang;
}) {
  if (loading) {
    return (
      <section className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-[2rem] bg-muted/50 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const picks = sets.filter((s) => s.image).slice(0, 3);
  if (picks.length === 0) return null;

  return (
    <section className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24 mb-16 lg:mb-24">
      <div className="mb-8">
        <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
          {language === 'uz' ? 'Interyer uchun ilhom' : 'Вдохновение для интерьера'}
        </h2>
        <p className="mt-3 text-muted-foreground/80">
          {language === 'uz'
            ? 'Tayyor to‘plamlar — uyingizni bir zumda yangilang.'
            : 'Готовые комплекты — обновите дом за один шаг.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {picks.map((s) => {
          const title = language === 'uz' ? s.title_uz : s.title_ru;
          return (
            <Link
              key={s.id}
              to={`/catalog?set=${s.id}`}
              className="group overflow-hidden rounded-[2rem] bg-card shadow-soft hover:shadow-soft-lg transition-all duration-500 ease-luxe hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <LazyImage
                  src={s.image as string}
                  alt={title}
                    wrapperClassName="absolute inset-0"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-luxe"
                />
              </div>
              <div className="p-5">
                <h3 className="font-sans font-semibold text-base text-foreground">{title}</h3>
                <span className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground/80">
                  {language === 'uz' ? 'To‘plamni ko‘rish' : 'Смотреть комплект'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ============ 4. Afzalliklar qatori ============ */
export function FeatureStrip({ language }: { language: Lang }) {
  const items = [
    {
      Icon: Truck,
      title: language === 'uz' ? 'Bepul yetkazib berish' : 'Бесплатная доставка',
      text: language === 'uz' ? 'Toshkent bo‘ylab' : 'По Ташкенту',
    },
    {
      Icon: RotateCcw,
      title: language === 'uz' ? 'Qulay qaytarish' : 'Удобный возврат',
      text: language === 'uz' ? '14 kun ichida' : 'В течение 14 дней',
    },
    {
      Icon: ShieldCheck,
      title: language === 'uz' ? 'Kafolat' : 'Гарантия',
      text: language === 'uz' ? '24 oygacha kafolat' : 'До 24 месяцев',
    },
    {
      Icon: Headphones,
      title: language === 'uz' ? 'Qo‘llab-quvvatlash' : 'Поддержка',
      text: language === 'uz' ? 'Har kuni 9:00–20:00' : 'Ежедневно 9:00–20:00',
    },
  ];

  return (
    <section className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24 pb-16 lg:pb-24">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 border-t border-border pt-10">
        {items.map(({ Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="shrink-0 w-11 h-11 rounded-full bg-muted flex items-center justify-center">
              <Icon className="w-5 h-5 text-foreground" strokeWidth={1.6} />
            </span>
            <div>
              <h3 className="font-sans font-semibold text-sm text-foreground leading-tight">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground/80">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
