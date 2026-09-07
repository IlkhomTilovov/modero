import { Link } from 'react-router-dom';
import { Heart, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { LazyImage } from '@/components/LazyImage';
import type { Product } from '@/hooks/useProducts';

// Support both database and static data types
interface ProductCardProps {
  product: Product | {
    id: string;
    name_uz: string;
    name_ru: string;
    price: number;
    originalPrice?: number;
    images: string[];
    rating?: number;
    reviewCount?: number;
    slug?: string | null;
    original_price?: number | null;
  };
  eager?: boolean;
  imageAspect?: string;
  imageFit?: 'cover' | 'contain';
  compact?: boolean;
  /** 'grid' renders a compact price + round add-to-cart button row, for dense mobile grids. */
  variant?: 'default' | 'grid';
}

export function ProductCard({ product, eager = false, imageAspect = 'aspect-square', imageFit = 'cover', compact = false, variant = 'default' }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { addItem, isInCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const inCart = isInCart(product.id);
  const wishlisted = isWishlisted(product.id);


  const name = language === 'uz' ? product.name_uz : product.name_ru;
  const formatPrice = (price: number) => price.toLocaleString('uz-UZ');

  const price = product.price || 0;
  const originalPrice = 'originalPrice' in product ? product.originalPrice : product.original_price;
  const images = product.images || [];
  const productUrl = 'slug' in product && product.slug
    ? `/product/${product.slug}`
    : `/product/${product.id}`;

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPct = hasDiscount ? Math.round((1 - price / (originalPrice as number)) * 100) : 0;
  

  return (
    <article className={`group relative h-full flex flex-col bg-background rounded-2xl overflow-hidden border border-border/40 shadow-soft-sm hover:shadow-soft transition-shadow duration-300 ${compact ? 'rounded-xl' : 'rounded-2xl'}`}>
      <Link to={productUrl} className={`block relative ${imageAspect} overflow-hidden bg-background`}>
        {/* Primary image */}
        <LazyImage
          src={images[0] || '/placeholder.svg'}
          alt={name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={eager}
          className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover object-center'} bg-card transition-transform duration-500 ease-out group-hover:scale-105`}
          wrapperClassName="w-full h-full absolute inset-0"
        />

        {/* Discount badge */}
        {hasDiscount && (
          <span className={`absolute left-3 bg-foreground text-background text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-soft-sm ${compact ? 'top-2' : 'top-3'}`}>
            −{discountPct}%
          </span>
        )}
      </Link>

      <button
        type="button"
        aria-label={wishlisted ? (language === 'uz' ? "Sevimlilardan o'chirish" : 'Убрать из избранного') : (language === 'uz' ? 'Sevimlilarga qo\'shish' : 'В избранное')}
        aria-pressed={wishlisted}
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
        className={`absolute right-2 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-soft-sm transition-transform hover:scale-105 ${compact ? 'top-2 w-7 h-7' : 'top-3 w-9 h-9'}`}
      >
        <Heart
          className={compact ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'}
          strokeWidth={2}
          fill={wishlisted ? 'currentColor' : 'none'}
          style={wishlisted ? { color: 'hsl(var(--destructive))' } : undefined}
        />
      </button>

      <div className={`flex flex-col flex-1 ${compact ? 'p-1.5 md:p-2' : 'p-3 md:p-5'}`}>
        {variant === 'grid' ? (
          <div className="flex items-end justify-between gap-2 mt-1">
            <div className="flex flex-col leading-tight min-w-0">
              {hasDiscount && (
                <span className="text-muted-foreground line-through tabular-nums text-[10px]">
                  {formatPrice(originalPrice as number)} {t.products.currency}
                </span>
              )}
              <span className="font-sans font-bold text-foreground tracking-tight tabular-nums text-sm truncate">
                {formatPrice(price)} {t.products.currency}
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant={inCart ? 'secondary' : 'default'}
              aria-label={inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : (language === 'uz' ? "Buyurtma berish" : 'Заказать')}
              className="shrink-0 w-8 h-8 rounded-full shadow-soft-sm"
              onClick={(e) => {
                e.preventDefault();
                if (!inCart) {
                  const cartProduct = { id: product.id, name_uz: product.name_uz, name_ru: product.name_ru, price, images };
                  addItem(cartProduct as any);
                }
              }}
            >
              {inCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <>
            {price > 0 && (
              <div className={`flex flex-col leading-tight ${compact ? 'mt-0.5' : 'mt-1.5'}`}>
                {hasDiscount && (
                  <span className={`text-muted-foreground line-through tabular-nums ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    {formatPrice(originalPrice as number)} {t.products.currency}
                  </span>
                )}
                <span className={`font-sans font-bold text-foreground tracking-tight tabular-nums ${compact ? 'text-xs' : 'text-base md:text-lg'}`}>
                  {formatPrice(price)} {t.products.currency}
                </span>
              </div>
            )}

            <Button
              variant={inCart ? 'secondary' : 'outline'}
              aria-label={inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : (language === 'uz' ? "Buyurtma berish" : 'Заказать')}
              className={`mt-auto w-full rounded-full shadow-soft-sm hover:shadow-soft-md transition-all duration-300 ${compact ? 'h-8 text-xs' : 'h-10'}`}
              onClick={(e) => {
                e.preventDefault();
                if (!inCart) {
                  const cartProduct = { id: product.id, name_uz: product.name_uz, name_ru: product.name_ru, price, images };
                  addItem(cartProduct as any);
                }
              }}
            >
              {inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : (language === 'uz' ? "Buyurtma berish" : 'Заказать')}
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
