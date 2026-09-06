import { useState, useEffect } from 'react';
import { X, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  platform?: 'youtube' | 'instagram';
}

export function VideoPlayerModal({ isOpen, onClose, videoUrl, platform }: VideoPlayerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Ensure proper embed URL format
  const getEmbedUrl = () => {
    if (platform === 'youtube') {
      // Add autoplay parameter
      const url = new URL(videoUrl);
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('rel', '0');
      return url.toString();
    }
    return videoUrl;
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/95 backdrop-blur-sm",
        "transition-opacity duration-200",
        isAnimating ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-media-foreground/10 hover:bg-media-foreground/20 text-media-foreground transition-colors"
        aria-label="Yopish"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Video container */}
      <div
        className={cn(
          "relative mx-4 overflow-hidden rounded-xl bg-black",
          platform === 'instagram'
            ? "w-full max-w-[420px] aspect-[4/5] max-h-[85vh]"
            : "w-full max-w-5xl aspect-video",
          "transition-transform duration-200",
          isAnimating ? "scale-100" : "scale-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black rounded-xl z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-media-foreground/60 mx-auto mb-2" />
              <p className="text-media-foreground/60 text-sm">Video yuklanmoqda...</p>
            </div>
          </div>
        )}

        {/* Video iframe — Instagram chrome (header/footer) cropped out */}
        {platform === 'instagram' ? (
          <div className="absolute inset-0 overflow-hidden rounded-xl bg-black">
            <iframe
              src={getEmbedUrl()}
              className="absolute left-0 w-full border-0"
              style={{ top: '-54px', height: '2400px' }}
              scrolling="no"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          </div>
        ) : (
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full rounded-xl border-0"
            scrolling="no"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        )}
      </div>


      {/* Mobile swipe hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:hidden">
        <p className="text-media-foreground/40 text-xs">Yopish uchun tepaga bosing</p>
      </div>
    </div>
  );
}
