import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Crown, Percent, Sparkles, Star, Tag, type LucideIcon,
  Search, SlidersHorizontal, Sofa, Armchair, Bed, Table2, DoorClosed, UtensilsCrossed, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { useFeaturedProducts, useCategories } from '@/hooks/useProducts';
import { useActiveSets } from '@/hooks/useSets';
import { usePromoTiles } from '@/hooks/usePromoTiles';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { EditableText } from '@/components/EditableText';
import { EditableImage } from '@/components/EditableImage';
import { HeroBento } from '@/components/home/HeroBento';
import { PromoCarousel } from '@/components/home/PromoCarousel';
import { useState, useRef, useEffect } from 'react';
import { getPageSeo } from '@/lib/pageSeo';
import { PROMO_ICONS } from '@/lib/promoIcons';
import { CollectionBanners, DiscountBanner, InspirationSection } from '@/components/home/HomeSections';


import serviceKitchen from '@/assets/service-kitchen.jpg';

const HOME_PROMO_ICONS: Record<string, LucideIcon> = PROMO_ICONS;

// Keyword match on category name/slug — the DB `icon` field isn't populated by any
// admin UI today, so pills resolve a sensible furniture icon instead of relying on it.
const CATEGORY_ICON_RULES: Array<[RegExp, LucideIcon]> = [
  [/divan|sofa|диван/i, Sofa],
  [/kreslo|armchair|кресл/i, Armchair],
  [/krovat|krevat|yotoq|bed|кроват|спальн/i, Bed],
  [/stol|stul|table|стол|стул/i, Table2],
  [/shkaf|komod|cabinet|wardrobe|шкаф|комод/i, DoorClosed],
  [/oshxona|kitchen|кухн/i, UtensilsCrossed],
];

function resolveCategoryIcon(name: string, slug: string): LucideIcon {
  const haystack = `${name} ${slug}`;
  for (const [pattern, Icon] of CATEGORY_ICON_RULES) {
    if (pattern.test(haystack)) return Icon;
  }
  return Package;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

function SetsCarousel({ sets, productsBySet, language, fallbackImage }: {
  sets: ReturnType<typeof useActiveSets>['sets'];
  productsBySet: ReturnType<typeof useActiveSets>['productsBySet'];
  language: 'uz' | 'ru';
  fallbackImage: string;
}) {
  const [current, setCurrent] = useState(0);
  const [incoming, setIncoming] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [animating, setAnimating] = useState(false);
  const count = sets.length;
  const touchStartX = useRef<number | null>(null);
  const DURATION = 800;
  const INNER_DURATION = 650;
  const PAGE = 2;
  const STEP_MS = 5000;

  // inner products pager: sliding by 1 (window of 2 visible, wraps around)
  const [innerStart, setInnerStart] = useState(0);
  const [innerAnimating, setInnerAnimating] = useState(false);
  // Pause autoplay briefly after user interaction so clicks aren't fought by the timer
  const [pausedUntil, setPausedUntil] = useState(0);
  const pauseAutoplay = (ms = 6000) => setPausedUntil(Date.now() + ms);

  // NOTE: previously we eagerly preloaded every set image AND every product
  // image using `new Image()`. That fired dozens of requests during initial
  // page load and starved the LCP hero image of bandwidth. Removed — images
  // now load naturally via <img loading="lazy"> when the carousel slides.


  const productsOf = (s: (typeof sets)[number]) => productsBySet[s.id] || [];

  const go = (next: number) => {
    if (animating) return;
    const n = ((next % count) + count) % count;
    if (n === current) return;
    const dir: 1 | -1 = n > current || (current === count - 1 && n === 0) ? 1 : -1;
    setDirection(dir);
    // Reset inner window immediately so the incoming set starts at item 0
    // (otherwise products would visually "jump" after the crossfade completes)
    setInnerStart(0);
    setInnerAnimating(false);
    setIncoming(n);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
    window.setTimeout(() => {
      setCurrent(n);
      setIncoming(null);
      setAnimating(false);
    }, DURATION);
  };

  const goInnerNext = () => {
    if (innerAnimating || animating) return;
    requestAnimationFrame(() => requestAnimationFrame(() => setInnerAnimating(true)));
    window.setTimeout(() => {
      setInnerStart((s) => s + 1);
      setInnerAnimating(false);
    }, INNER_DURATION);
  };

  const set = sets[current];
  const productsLen = set ? productsOf(set).length : 0;
  const canInnerSlide = productsLen > PAGE;

  // unified autoplay: slide inner by 1 each tick; advance to next set after full loop
  useEffect(() => {
    if (count <= 1 && !canInnerSlide) return;
    const t = setInterval(() => {
      if (animating || innerAnimating) return;
      if (Date.now() < pausedUntil) return;
      if (canInnerSlide) {
        // after innerStart wraps fully (productsLen steps), advance set
        if (count > 1 && productsLen > 0 && innerStart > 0 && innerStart % productsLen === 0) {
          go(current + 1);
        } else {
          goInnerNext();
        }
      } else if (count > 1) {
        go(current + 1);
      }
    }, STEP_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, current, innerStart, canInnerSlide, productsLen, animating, innerAnimating, pausedUntil]);


  if (!set) return null;

  const EmptyCard = ({ hideOnMobile = false }: { hideOnMobile?: boolean }) => (
    <div
      className={`aspect-square ${hideOnMobile ? 'hidden lg:block' : 'block'}`}
      aria-hidden="true"
    />
  );

  const renderPair = (items: ReturnType<typeof productsOf>) => (
    <div className="grid grid-cols-2 gap-2 lg:gap-4 w-full my-0 mx-0 px-0 py-[5px]">
      {items.length > 0 ? (
        <>
          {items.map((p, i) => (
            <div key={(p?.id || 'e') + '-' + i} className="h-full">
              <ProductCard product={p} imageAspect="aspect-[4/5]" imageFit="cover" compact />
            </div>
          ))}
          {items.length === 1 && <EmptyCard />}
        </>
      ) : (
        <>
          <EmptyCard />
          <EmptyCard />
        </>
      )}
    </div>
  );


  const renderSlide = (s: typeof set, withInner: boolean) => {
    const title = language === 'uz' ? s.title_uz : s.title_ru;
    const all = productsOf(s);
    const innerOn = withInner && all.length > PAGE;
    // Build sliding window: render 3 cards (current pair + next-after) so we can slide left by 1 card
    const at = (i: number) => all[((i % all.length) + all.length) % all.length];
    const startIdx = innerOn ? innerStart : 0;
    const curItems = innerOn
      ? [at(startIdx), at(startIdx + 1)]
      : all.slice(0, PAGE);
    const tailItem = innerOn ? at(startIdx + 2) : null;
    const showInnerTrack = innerOn;
    // track width = 200% (two pairs), translate -50% slides one card forward (overlapping pair)
    const innerTranslate = !showInnerTrack ? '0%' : (innerAnimating ? '-50%' : '0%');

    return (
      <div className="w-full">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            <span className="inline-block">{title}</span>
            
          </h2>
          <Link
            to={`/catalog?set=${s.id}`}
            className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {language === 'uz' ? 'Barchasi' : 'Все'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_2fr] gap-2 lg:gap-6 bg-background isolate">
          <Link
            to={`/catalog?set=${s.id}`}
            className="relative aspect-[16/10] lg:aspect-auto rounded-[2rem] overflow-hidden bg-card group"
          >
            <img
              src={s.image || fallbackImage}
              alt={title}
              loading="lazy"
              decoding="async"
              width={800}
              height={500}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-luxe"
            />

          </Link>
          <div className="relative overflow-hidden bg-background">
            <div
              className="flex"
              style={{
                width: showInnerTrack ? '200%' : '100%',
                transform: `translate3d(${innerTranslate}, 0, 0)`,
                transition: innerAnimating
                  ? `transform ${INNER_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`
                  : 'none',
              }}
            >
              <div className="shrink-0" style={{ width: showInnerTrack ? '50%' : '100%' }}>
                {renderPair(curItems)}
              </div>
              {showInnerTrack && tailItem && (
                <div className="shrink-0" style={{ width: '50%' }}>
                  {renderPair([curItems[1], tailItem])}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Outer: forward (→) track = [current, incoming], translate 0% → -50%
  //        backward (←) track = [incoming, current], translate -50% → 0%
  // Outer transition: crossfade (no horizontal bleed of neighboring sets)
  const showTrack = incoming !== null;
  const incomingSet = incoming !== null ? sets[incoming] : null;

  return (
    <div className="relative">
      <div
        className="relative py-4"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) { pauseAutoplay(); go(current + (dx < 0 ? 1 : -1)); }
          touchStartX.current = null;
        }}
      >
        <div className="relative">
          {/* Current set */}
          <div
            style={{
              opacity: 1,
            }}
          >
            {renderSlide(set, !showTrack)}
          </div>
          {/* Incoming set (absolute overlay, fades in) */}
          {showTrack && incomingSet && (
            <div
              className="absolute inset-0 bg-background"
              style={{
                opacity: animating ? 1 : 0,
                transition: `opacity ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            >
              {renderSlide(incomingSet, false)}
            </div>
          )}
        </div>
      </div>


      {count > 1 && (
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={() => { pauseAutoplay(); go(current - 1); }}
            className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-card hover:border-primary/40 transition-all hover:-translate-x-0.5"
            aria-label="Previous"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => { pauseAutoplay(); go(i); }}
                className={`h-2 rounded-full transition-all duration-500 ${i === current ? 'w-10 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/40'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => { pauseAutoplay(); go(current + 1); }}
            className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-card hover:border-primary/40 transition-all hover:translate-x-0.5"
            aria-label="Next"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}



export default function Index() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const homeSeo = getPageSeo('home', language);
  useSEO({ title: homeSeo.title, description: homeSeo.description, ogTitle: homeSeo.title, ogDescription: homeSeo.description });

  const sec1 = useInView();
  const sec2 = useInView();
  const sec3 = useInView();

  const shouldLoadBelowFoldData = sec2.isVisible;
  const { products: featuredProducts } = useFeaturedProducts(4, shouldLoadBelowFoldData);
  // Eager (not gated behind shouldLoadBelowFoldData): the mobile category pill
  // row renders above the fold, right under the hero.
  const { categories, loading: categoriesLoading } = useCategories(true);
  const { data: dbPromoTiles = [] } = usePromoTiles();
  const { sets, productsBySet, loading: setsLoading } = useActiveSets(true);

  // Toifalarda eski hardcoded/fallback rasmlar umuman ko'rsatilmaydi.
  const categoriesLoaded = shouldLoadBelowFoldData && !categoriesLoading;
  const cats = categoriesLoaded ? categories : [];
  const catsReady = cats.length > 0;
  // Mobile icon-pill row sits above the fold, so it uses the eagerly-fetched
  // list directly instead of waiting for the scroll-gated `categoriesLoaded`.
  const mobileCats = !categoriesLoading ? categories : [];

  // Toifalar carousel — one-at-a-time autoplay with seamless infinite loop
  const [catPerPage, setCatPerPage] = useState(4);
  const [catIndex, setCatIndex] = useState(0);
  const [catAnimate, setCatAnimate] = useState(true);
  const catTouchStartX = useRef<number | null>(null);
  const [catPaused, setCatPaused] = useState(false);
  const catResumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseCatAutoplay = () => {
    setCatPaused(true);
    if (catResumeTimer.current) clearTimeout(catResumeTimer.current);
    catResumeTimer.current = setTimeout(() => setCatPaused(false), 5000);
  };
  useEffect(() => () => { if (catResumeTimer.current) clearTimeout(catResumeTimer.current); }, []);
  useEffect(() => {
    const compute = () => {
      if (typeof window === 'undefined') return;
      if (window.matchMedia('(min-width: 1024px)').matches) setCatPerPage(4);
      else if (window.matchMedia('(min-width: 768px)').matches) setCatPerPage(3);
      else setCatPerPage(2);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  // Reset to 0 if data shrinks
  useEffect(() => { if (catIndex > cats.length) setCatIndex(0); }, [cats.length, catIndex]);
  // Build a looped list: original + clone of first `catPerPage` so we can slide past the end seamlessly
  const catsLooped = cats.length > 0 ? [...cats, ...cats.slice(0, catPerPage)] : cats;
  const catTotalPages = Math.max(1, Math.ceil(cats.length / catPerPage));
  const goCat = (dir: number) => {
    if (cats.length === 0) return;
    setCatAnimate(true);
    setCatIndex((p) => p + dir);
  };
  const onCatTouchStart = (e: React.TouchEvent) => {
    catTouchStartX.current = e.touches[0].clientX;
    pauseCatAutoplay();
  };
  const onCatTouchEnd = (e: React.TouchEvent) => {
    if (catTouchStartX.current === null) return;
    const diff = catTouchStartX.current - e.changedTouches[0].clientX;
    const SWIPE_THRESHOLD = 50;
    if (diff > SWIPE_THRESHOLD) {
      goCat(1);
    } else if (diff < -SWIPE_THRESHOLD) {
      goCat(-1);
    }
    catTouchStartX.current = null;
    pauseCatAutoplay();
  };
  // Autoplay: advance by 1 every 5s
  useEffect(() => {
    if (cats.length <= catPerPage) return;
    if (catPaused) return;
    const t = setInterval(() => {
      setCatAnimate(true);
      setCatIndex((p) => p + 1);
    }, 5000);
    return () => clearInterval(t);
  }, [cats.length, catPerPage, catPaused]);
  // When we cross past the end (into the cloned tail), snap back without animation
  useEffect(() => {
    if (cats.length === 0) return;
    if (catIndex >= cats.length) {
      const t = setTimeout(() => {
        setCatAnimate(false);
        setCatIndex((p) => p - cats.length);
      }, 700); // match transition duration
      return () => clearTimeout(t);
    }
    if (catIndex < 0) {
      const t = setTimeout(() => {
        setCatAnimate(false);
        setCatIndex((p) => p + cats.length);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [catIndex, cats.length]);
  // Re-enable animation on next frame after a snap
  useEffect(() => {
    if (!catAnimate) {
      const r = requestAnimationFrame(() => setCatAnimate(true));
      return () => cancelAnimationFrame(r);
    }
  }, [catAnimate]);


  return (
    <div className="min-h-screen bg-background">
      {/* ============ QIDIRUV PANELI (mobile only) ============ */}
      <div className="md:hidden container mx-auto px-4 pt-4 pb-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get('q');
            navigate(q ? `/catalog?search=${encodeURIComponent(String(q))}` : '/catalog');
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="q"
              type="text"
              placeholder={language === 'uz' ? 'Qidirish...' : 'Поиск...'}
              className="w-full h-11 pl-11 pr-4 rounded-full border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <Link
            to="/catalog"
            aria-label={language === 'uz' ? 'Filtrlar' : 'Фильтры'}
            className="shrink-0 w-11 h-11 rounded-full border border-border bg-card flex items-center justify-center"
          >
            <SlidersHorizontal className="w-4 h-4 text-foreground" />
          </Link>
        </form>
      </div>

      {/* ============ HERO (to'plamlar bento) ============ */}
      <HeroBento sets={sets as any} loading={setsLoading} language={language} />

      {/* ============ TOIFA IKONKALARI (mobile only) ============ */}
      {mobileCats.length > 0 && (
        <div className="md:hidden container mx-auto px-4 pt-5 pb-1">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {mobileCats.slice(0, 8).map((cat) => {
              const name = language === 'uz' ? cat.name_uz : cat.name_ru;
              const Icon = resolveCategoryIcon(name, cat.slug);
              return (
                <Link
                  key={cat.id}
                  to={`/catalog?category=${cat.slug}`}
                  className="shrink-0 w-[72px] flex flex-col items-center gap-1.5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-card border border-border/60 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] text-center text-foreground/80 leading-tight line-clamp-2">
                    {name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}


      {/* ============ PROMO TILES (DB-driven karusel) ============ */}
      <div ref={sec1.ref}>
        <PromoCarousel tiles={dbPromoTiles} language={language} />
      </div>


      {/* ============ KOLLEKSIYA BANNERLARI ============ */}
      <CollectionBanners
        categories={cats as any}
        loading={!categoriesLoaded}
        language={language}
      />




      <section ref={sec2.ref} className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              {language === 'uz' ? 'Toifalar' : 'Категория'}
              
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => goCat(-1)}
              disabled={catTotalPages <= 1}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-border hover:border-foreground/40 hover:bg-card transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goCat(1)}
              disabled={catTotalPages <= 1}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-border hover:border-foreground/40 hover:bg-card transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!categoriesLoaded ? (
          <div className="-mx-2 lg:-mx-3 py-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 px-2 lg:px-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-muted/50 rounded-[2rem] animate-pulse"
              />
            ))}
          </div>
        ) : !catsReady ? null : (
        <div
          className="overflow-x-hidden overflow-y-visible -mx-2 lg:-mx-3 py-2"
          onTouchStart={onCatTouchStart}
          onTouchEnd={onCatTouchEnd}
        >
          <div
            className="flex"
            style={{
              transform: `translate3d(-${(catIndex * 100) / catPerPage}%, 0, 0)`,
              transition: catAnimate ? 'transform 700ms cubic-bezier(0.22,1,0.36,1)' : 'none',
            }}
          >
            {catsLooped.map((cat: any, i) => {
              const name = language === 'uz' ? cat.name_uz : cat.name_ru;
              const img = cat.image;
              const FallbackIcon = cat.icon;
              return (
                <div
                  key={(cat.slug || cat.id) + '-' + i}
                  className="shrink-0 px-2 lg:px-3"
                  style={{ width: `${100 / catPerPage}%` }}
                >
                  <Link
                    to={`/catalog?category=${cat.slug}`}
                    className="group relative block aspect-[4/5] bg-card rounded-[2rem] overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-500 ease-luxe hover:-translate-y-1"
                  >
                    <div className="absolute top-6 left-0 right-0 z-10 text-center">
                      <h3 className="font-sans font-medium text-base lg:text-lg text-media-foreground px-4 drop-shadow-md">
                        {name}
                      </h3>
                    </div>
                    <div className="absolute inset-0">
                      {img ? (
                        <img
                          src={img}
                          alt={name}
                          loading="lazy"
                          decoding="async"
                          width={400}
                          height={500}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-luxe"
                        />
                      ) : FallbackIcon ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <FallbackIcon className="w-32 h-32 text-primary/70 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.2} />
                        </div>
                      ) : null}
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-[5]" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {cats.length > catPerPage && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: catTotalPages }).map((_, i) => {
              const currentPage = Math.floor((((catIndex % cats.length) + cats.length) % cats.length) / catPerPage);
              const active = currentPage === i;
              return (
                <button
                  key={i}
                  onClick={() => { setCatAnimate(true); setCatIndex(i * catPerPage); }}
                  aria-label={`Page ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active ? 'w-8 bg-foreground' : 'w-1.5 bg-foreground/30 hover:bg-foreground/50'
                  }`}
                />
              );
            })}
          </div>
        )}

      </section>

      {/* ============ CHEGIRMA BANNERI ============ */}
      <DiscountBanner products={featuredProducts as any} language={language} />



      {/* ============ SETLAR TO'PLAMI (DB-driven sets, carousel) ============ */}
      {(setsLoading || sets.length > 0) && (
        <section ref={sec3.ref} className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24">
          {setsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-4 lg:gap-6">
              <div className="aspect-[4/3] lg:aspect-auto rounded-[2rem] bg-card animate-pulse" />
              <div className="aspect-[3/4] rounded-[2rem] bg-card animate-pulse" />
              <div className="aspect-[3/4] rounded-[2rem] bg-card animate-pulse" />
            </div>
          ) : (
            <SetsCarousel
              sets={sets}
              productsBySet={productsBySet}
              language={language}
              fallbackImage={serviceKitchen}
            />
          )}
        </section>
      )}




      {/* ============ FEATURED PRODUCTS GRID (only if we have more) ============ */}
      {featuredProducts.length > 2 && (
        <section className="container mx-auto px-4 lg:px-8 mt-16 lg:mt-24 pb-16 lg:pb-24">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              {language === 'uz' ? 'Tanlangan' : 'Избранное'}
            </h2>
            <Button asChild variant="ghost" className="rounded-full text-sm gap-2">
              <Link to="/catalog">
                {language === 'uz' ? "Hammasi" : 'Все'} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} variant="grid" />
            ))}
          </div>
        </section>
      )}

      {/* ============ ILHOM (to'plamlar) ============ */}
      <InspirationSection sets={sets} loading={!shouldLoadBelowFoldData || setsLoading} language={language} />




    </div>
  );
}
