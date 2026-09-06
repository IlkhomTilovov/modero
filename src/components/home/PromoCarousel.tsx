import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Sparkles, type LucideIcon } from 'lucide-react';
import { PROMO_ICONS } from '@/lib/promoIcons';
import type { PromoTile } from '@/hooks/usePromoTiles';

type Lang = 'uz' | 'ru';

const ICONS: Record<string, LucideIcon> = PROMO_ICONS;

/**
 * Promo kartochkalar — zamonaviy, professional karusel (embla).
 * Sudrab suriladi, o'q tugmalari va progress indikatori bilan.
 */
export function PromoCarousel({
  tiles,
  loading,
  language,
}: {
  tiles: PromoTile[];
  loading?: boolean;
  language: Lang;
}) {
  const [emblaRef, embla] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [progress, setProgress] = useState(0);

  const onUpdate = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
    setProgress(Math.max(0, Math.min(1, embla.scrollProgress())));
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onUpdate();
    embla.on('select', onUpdate).on('reInit', onUpdate).on('scroll', onUpdate);
  }, [embla, onUpdate]);

  if (loading) {
    return (
      <section className="container mx-auto px-4 lg:px-8 mt-10 lg:mt-16">
        <div className="flex gap-3 lg:gap-5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[46%] sm:w-[32%] lg:w-[19%] aspect-[4/5] rounded-[1.5rem] bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!tiles.length) return null;

  return (
    <section className="container mx-auto px-4 lg:px-8 mt-10 lg:mt-16">
      <div className="flex items-end justify-between gap-4 mb-5 lg:mb-7">
        <div>
          <span className="text-[10px] lg:text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {language === 'uz' ? 'Tanlangan takliflar' : 'Избранные предложения'}
          </span>
          <h2 className="mt-2 font-serif text-2xl lg:text-4xl font-bold text-foreground leading-tight">
            {language === 'uz' ? 'Siz uchun maxsus' : 'Специально для вас'}
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            aria-label={language === 'uz' ? 'Orqaga' : 'Назад'}
            onClick={() => embla?.scrollPrev()}
            disabled={!canPrev}
            className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-foreground transition-colors duration-300 hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label={language === 'uz' ? 'Oldinga' : 'Вперёд'}
            onClick={() => embla?.scrollNext()}
            disabled={!canNext}
            className="w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center transition-transform duration-300 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden -mx-1 px-1" ref={emblaRef}>
        <div className="flex gap-3 lg:gap-5 py-1">
          {tiles.map((tile) => {
            const Icon = ICONS[tile.icon] || Sparkles;
            const title = language === 'uz' ? tile.title_uz : tile.title_ru;
            return (
              <Link
                key={tile.id}
                to={`/catalog?promo=${tile.id}`}
                className={`group relative shrink-0 basis-[46%] sm:basis-[32%] lg:basis-[19%] aspect-[4/5] rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-500 ease-luxe hover:-translate-y-1.5 ${tile.bg_class}`}
              >
                {/* Katta shaffof ikonka — fon naqshi */}
                <Icon
                  className={`absolute -bottom-6 -right-5 w-32 h-32 lg:w-44 lg:h-44 ${tile.text_class} opacity-[0.08] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700 ease-luxe`}
                  strokeWidth={1}
                />
                <div className="relative h-full p-4 lg:p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`w-9 h-9 lg:w-11 lg:h-11 rounded-full border border-current/20 bg-background/25 flex items-center justify-center ${tile.text_class}`}
                    >
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={1.75} />
                    </span>
                    <ArrowUpRight
                      className={`w-4 h-4 shrink-0 opacity-60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${tile.text_class}`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-sans font-semibold text-sm lg:text-lg leading-snug ${tile.text_class}`}
                    >
                      {title}
                    </h3>
                    <span
                      className={`mt-1.5 block text-[10px] lg:text-xs uppercase tracking-[0.18em] opacity-60 ${tile.text_class}`}
                    >
                      {language === 'uz' ? "Ko'rish" : 'Смотреть'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Progress indikator */}
      <div className="mt-5 h-[3px] w-full max-w-[240px] rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground transition-transform duration-200 ease-out origin-left"
          style={{ transform: `scaleX(${Math.max(0.15, progress || 0.15)})` }}
        />
      </div>
    </section>
  );
}
