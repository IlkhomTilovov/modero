import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useHeroSlides, type HeroSlide } from '@/hooks/useHeroSlides';
import { useLanguage } from '@/hooks/useLanguage';
import { EditableImage } from '@/components/EditableImage';
import { EditableText } from '@/components/EditableText';

const AUTOPLAY_MS = 6000;

interface HeroCarouselProps {
  fallbackImage: string;
  fallbackMobileImage?: string;
}

export function HeroCarousel({ fallbackImage, fallbackMobileImage }: HeroCarouselProps) {
  const { language } = useLanguage();
  const { data: slides = [] } = useHeroSlides();
  const [current, setCurrent] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => {
      if (Date.now() < pausedUntil) return;
      setCurrent((c) => (c + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [count, pausedUntil]);

  const pause = () => setPausedUntil(Date.now() + 8000);
  const go = (n: number) => {
    if (count === 0) return;
    pause();
    setCurrent(((n % count) + count) % count);
  };

  // No skeleton: when there are no cached slides, render the fallback hero immediately
  // so the LCP element paints on first frame. Once real slides arrive, they take over.

  // Fallback: no DB slides → keep old editable hero so admin can still edit it
  if (count === 0) {
    return (
      <div className="relative bg-card rounded-[2rem] overflow-hidden shadow-soft h-[260px] sm:h-[360px] lg:h-auto lg:min-h-[620px]">
        <EditableImage
          contentKey="hero_product_image"
          fallbackSrc={fallbackImage}
          mobileSrc={fallbackMobileImage}
          alt="OrisHome premium furniture"
          className="absolute inset-0 w-full h-full object-cover object-center"
          wrapperClassName="absolute inset-0 w-full h-full"
          section="hero"
          priority
          width={1600}
          height={900}
          sizes="(max-width: 640px) 100vw, 100vw"
        />
        <div className="relative h-full hidden sm:flex flex-col justify-center p-8 lg:p-14 max-w-3xl z-10">
          <h1 className="font-serif font-bold leading-[1.05] text-media-foreground text-4xl sm:text-5xl lg:text-6xl tracking-tight drop-shadow-md">
            <EditableText contentKey="hero_title_line1" fallback="SOFA" as="span" className="block" section="hero" />
          </h1>
          <p className="mt-4 text-media-foreground/80 text-lg lg:text-xl font-sans drop-shadow-sm">
            <EditableText contentKey="hero_subtitle" fallback="Design by OrisHome" as="span" section="hero" />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative bg-card rounded-[2rem] overflow-hidden shadow-soft h-[260px] sm:h-[360px] lg:h-auto lg:min-h-[620px] group"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
        touchStartX.current = null;
      }}
    >
      {slides.map((slide, idx) => (
        <SlideView
          key={slide.id}
          slide={slide}
          language={language}
          isActive={idx === current}
          isFirst={idx === 0}
          fallbackImage={fallbackImage}
        />
      ))}

      {count > 1 && (
        <>
          {/* Prev/Next — desktop only, fade in on hover */}
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Previous slide"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-background/80 backdrop-blur border border-border/20 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Next slide"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-background/80 backdrop-blur border border-border/20 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-500 ${i === current ? 'w-10 bg-media-foreground' : 'w-2 bg-media-foreground/40 hover:bg-background/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SlideView({
  slide,
  language,
  isActive,
  isFirst,
  fallbackImage,
}: {
  slide: HeroSlide;
  language: 'uz' | 'ru';
  isActive: boolean;
  isFirst: boolean;
  fallbackImage: string;
}) {
  const title = language === 'uz' ? slide.title_uz : slide.title_ru;
  const subtitle = language === 'uz' ? slide.subtitle_uz : slide.subtitle_ru;
  const ctaText = language === 'uz' ? slide.cta_text_uz : slide.cta_text_ru;
  const desktopSrc = slide.image || fallbackImage;
  const mobileSrc = slide.mobile_image || desktopSrc;

  return (
    <div
      className="absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }}
      aria-hidden={!isActive}
    >
      <picture>
        <source media="(max-width: 640px)" srcSet={mobileSrc} />
        <img
          src={desktopSrc}
          alt={title || 'Hero slide'}
          fetchPriority={isFirst ? 'high' : 'auto'}
          loading={isFirst ? 'eager' : 'lazy'}
          decoding="async"
          width={1600}
          height={900}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </picture>
      <div className="relative h-full hidden sm:flex flex-col justify-center p-8 lg:p-14 max-w-3xl z-10">
        {title && (
          <h1 className="font-serif font-bold leading-[1.05] text-media-foreground text-4xl sm:text-5xl lg:text-6xl tracking-tight drop-shadow-md">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-4 text-media-foreground/80 text-lg lg:text-xl font-sans max-w-xl drop-shadow-sm">
            {subtitle}
          </p>
        )}
        {ctaText && (
          <div className="mt-8">
            <Link
              to={slide.cta_link || '/catalog'}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-medium text-sm lg:text-base hover:bg-primary/90 transition-all hover:gap-3 shadow-soft"
            >
              {ctaText}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Mobile: CTA fixed to bottom-left, above dots */}
      {ctaText && (
        <div className="sm:hidden absolute bottom-14 left-4 z-10">
          <Link
            to={slide.cta_link || '/catalog'}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium text-xs shadow-soft"
          >
            {ctaText}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
