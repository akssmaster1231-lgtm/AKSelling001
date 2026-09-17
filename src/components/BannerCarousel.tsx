import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/types';

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const safeBanners = banners && banners.length > 0 ? banners : [];
  const [index, setIndex] = useState(0);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // Safe index bounds
  const activeIndex = safeBanners.length > 0 ? Math.min(index, safeBanners.length - 1) : 0;

  useEffect(() => {
    if (safeBanners.length <= 1) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setIndex(prev => (prev + 1) % safeBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [safeBanners.length]);

  const goPrev = () => {
    if (safeBanners.length <= 1) return;
    setIndex(prev => (prev - 1 + safeBanners.length) % safeBanners.length);
  };

  const goNext = () => {
    if (safeBanners.length <= 1) return;
    setIndex(prev => (prev + 1) % safeBanners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) goNext();
      else goPrev();
    }
  };

  if (safeBanners.length === 0) return null;

  return (
    <div
      className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden shadow-card select-none group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
      >
        {safeBanners.map((banner, idx) => (
          <div
            key={banner.id}
            className={`relative w-full h-full shrink-0 bg-gradient-to-br ${banner.gradient || 'from-blue-600 to-indigo-800'}`}
          >
            {/* Banner Image with rich presentation and subtle text contrast overlay */}
            {banner.image && (
              <img
                src={banner.image}
                alt={banner.title}
                loading={idx === 0 ? 'eager' : 'lazy'}
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            )}

            {/* Gradient Scrim for crystal clear text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />

            <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 max-w-xl z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-md leading-tight">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-xs sm:text-sm text-white/90 mt-1.5 line-clamp-2 max-w-sm drop-shadow-xs">
                  {banner.subtitle}
                </p>
              )}
              {banner.cta && (
                <button
                  type="button"
                  className="mt-3.5 w-fit bg-white text-flipkart-700 text-xs sm:text-sm font-extrabold px-5 py-2 rounded-full shadow-md hover:bg-flipkart-50 active:scale-95 transition-all cursor-pointer"
                >
                  {banner.cta}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {safeBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-xs rounded-full p-2 text-white transition-all opacity-0 group-hover:opacity-100 sm:opacity-90 z-20 cursor-pointer"
            aria-label="Previous banner"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-xs rounded-full p-2 text-white transition-all opacity-0 group-hover:opacity-100 sm:opacity-90 z-20 cursor-pointer"
            aria-label="Next banner"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {safeBanners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeIndex ? 'w-6 bg-white shadow-xs' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
