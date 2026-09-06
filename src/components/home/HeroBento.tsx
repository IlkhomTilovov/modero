import { Link } from 'react-router-dom';
import { ArrowUpRight, ShoppingCart } from 'lucide-react';
import { LazyImage } from '@/components/LazyImage';

type Lang = 'uz' | 'ru';

interface SetLike {
  id: string;
  title_uz: string;
  title_ru: string;
  image?: string | null;
  href?: string | null;
}

/** Har bir to'plam faqat o'z mahsulotlarini ko'rsatishi uchun ?set= havolasi ustuvor. */
function setHref(set: SetLike) {
  const href = set.href?.trim();
  if (href && href.includes('set=')) return href;
  return `/catalog?set=${set.id}`;
}

const TINTS = ['bg-secondary', 'bg-muted', 'bg-accent/15'];

/**
 * Bento uslubidagi hero: chapda katta to'q kartochka (birinchi to'plam),
 * o'ngda kichik to'plam kartochkalari.
 */
export function HeroBento({
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
      <section className="container mx-auto px-4 lg:px-8 pt-6 lg:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="h-[320px] lg:h-[560px] rounded-[2rem] bg-muted/50 animate-pulse" />
          <div className="grid grid-rows-2 gap-4 lg:gap-6">
            <div className="h-[150px] lg:h-auto rounded-[2rem] bg-muted/50 animate-pulse" />
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="h-[150px] lg:h-auto rounded-[2rem] bg-muted/50 animate-pulse" />
              <div className="h-[150px] lg:h-auto rounded-[2rem] bg-muted/50 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (sets.length === 0) return null;

  const [main, ...rest] = sets;
  const mainTitle = language === 'uz' ? main.title_uz : main.title_ru;
  const mainHref = setHref(main);
  const wide = rest[0];
  const small = rest.slice(1, 3);

  return (
    <section className="container mx-auto px-4 lg:px-8 pt-6 lg:pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Katta to'q kartochka */}
        <Link
          to={mainHref}
          className="group relative overflow-hidden rounded-[2rem] bg-foreground min-h-[340px] lg:min-h-[560px] shadow-soft hover:shadow-soft-lg transition-shadow duration-500 ease-luxe"
        >
          {main.image && (
            <LazyImage
              src={main.image}
              alt={mainTitle}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              width={1200}
              height={840}
              wrapperClassName="absolute inset-0"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-luxe"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-foreground/10" />

          <div className="relative h-full p-6 lg:p-12 flex flex-col justify-between">
            <div>
              <span className="text-[10px] lg:text-xs font-semibold uppercase tracking-[0.24em] text-background/60">
                {language === 'uz' ? "To'plamlar" : 'Комплекты'}
              </span>
              <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-6xl font-bold leading-[1.05] text-background max-w-[16ch]">
                {mainTitle}
              </h1>
            </div>
            <div className="inline-flex items-center gap-3 self-start bg-background/95 rounded-full pl-5 pr-2 py-2">
              <span className="text-xs lg:text-sm font-medium text-foreground">
                {language === 'uz' ? "To'plamni ko'rish" : 'Смотреть комплект'}
              </span>
              <span className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-primary-foreground" />
              </span>
            </div>
          </div>
        </Link>

        {/* O'ng ustun */}
        <div className="grid grid-rows-2 gap-4 lg:gap-6">
          {wide ? (
            <SetTile set={wide} language={language} tint={TINTS[0]} wide />
          ) : (
            <div className="hidden lg:block" />
          )}
          <div className={`grid gap-4 lg:gap-6 ${small.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {small.map((s, i) => (
              <SetTile key={s.id} set={s} language={language} tint={TINTS[i + 1]} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SetTile({
  set,
  language,
  tint,
  wide = false,
}: {
  set: SetLike;
  language: Lang;
  tint: string;
  wide?: boolean;
}) {
  const title = language === 'uz' ? set.title_uz : set.title_ru;
  return (
    <Link
      to={setHref(set)}
      className={`group relative overflow-hidden rounded-[2rem] ${tint} min-h-[170px] lg:min-h-0 shadow-soft hover:shadow-soft-lg transition-all duration-500 ease-luxe`}
    >
      {set.image && (
        <LazyImage
          src={set.image}
          alt={title}
          wrapperClassName="absolute inset-0"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-luxe"
        />
      )}
      {!wide && <div className="absolute inset-0 bg-black/45" />}
      {wide && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
      )}

      <div className="relative h-full p-5 lg:p-7 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-media-foreground/70">
            {language === 'uz' ? 'Tayyor to‘plam' : 'Готовый комплект'}
          </span>
          <ArrowUpRight className="w-4 h-4 shrink-0 text-media-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <h2
          className={`font-serif text-xl lg:text-3xl font-bold leading-tight text-media-foreground ${
            wide ? 'max-w-[14ch]' : ''
          }`}
        >
          {title}
        </h2>
      </div>

    </Link>
  );
}
