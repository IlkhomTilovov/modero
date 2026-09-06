import { Link } from 'react-router-dom';
import { ShoppingBag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
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
}

export function ProductCard({ product, eager = false, imageAspect = 'aspect-square', imageFit = 'cover', compact = false }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product.id);


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


      <div className={`flex flex-col flex-1 ${compact ? 'p-1.5 md:p-2' : 'p-3 md:p-5'}`}>
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
              const cartProduct = {
                id: product.id,
                name_uz: product.name_uz,
                name_ru: product.name_ru,
                price,
                images,
              };
              addItem(cartProduct as any);
            }
          }}
        >
          {inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : (language === 'uz' ? "Buyurtma berish" : 'Заказать')}
        </Button>
      </div>
    </article>
  );
}
