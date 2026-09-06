import { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

const loadedImageSources = new Set<string>();

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  sizes?: string;
  priority?: boolean;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  placeholder = '/placeholder.svg',
  className,
  wrapperClassName,
  sizes: sizesProp,
  priority = false,
  ...props
}: LazyImageProps) {
  const resolvedSrc = src || placeholder;
  const [isLoaded, setIsLoaded] = useState(() => priority || loadedImageSources.has(resolvedSrc));
  const [isInView, setIsInView] = useState(() => priority || loadedImageSources.has(resolvedSrc));
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const finalSizes = sizesProp || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';

  useEffect(() => {
    setError(false);
    setIsLoaded(priority || loadedImageSources.has(resolvedSrc));
    setIsInView((wasInView) => priority || wasInView || loadedImageSources.has(resolvedSrc));
  }, [resolvedSrc, priority]);

  useEffect(() => {
    if (priority || isInView || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority, isInView, resolvedSrc]);

  const handleLoad = () => {
    loadedImageSources.add(imgSrc);
    setIsLoaded(true);
  };
  const handleError = () => { setError(true); setIsLoaded(true); };

  const imgSrc = error ? placeholder : resolvedSrc;

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', !priority && 'bg-muted', wrapperClassName)}
    >
      {/* Skeleton placeholder */}
      {!isLoaded && !priority && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}

      {/* Simple img tag - browser handles format via storage URL */}
      {isInView && (
        <img
          src={imgSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={priority ? 'high' : 'auto'}
          sizes={finalSizes}
          width={props.width ?? 600}
          height={props.height ?? 625}
          className={cn(
            priority ? 'opacity-100' : 'transition-opacity duration-300',
            !priority && (isLoaded ? 'opacity-100' : 'opacity-0'),
            className
          )}
          {...props}
        />
      )}
    </div>
  );
});

// Thumbnail version for product cards
interface ThumbnailImageProps extends LazyImageProps {
  size?: 'sm' | 'md' | 'lg';
}

export const ThumbnailImage = memo(function ThumbnailImage({
  src,
  size = 'md',
  className,
  ...props
}: ThumbnailImageProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-full h-full',
    lg: 'w-full h-full',
  };

  const sizesMap = {
    sm: '48px',
    md: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
    lg: '(max-width: 640px) 100vw, 50vw',
  };

  return (
    <LazyImage
      src={src}
      sizes={sizesMap[size]}
      className={cn('object-cover', sizeClasses[size], className)}
      {...props}
    />
  );
});

// Hero image with priority loading
export const HeroImage = memo(function HeroImage({
  src,
  className,
  ...props
}: LazyImageProps) {
  return (
    <LazyImage
      src={src}
      priority
      sizes="100vw"
      className={cn('object-cover', className)}
      {...props}
    />
  );
});
