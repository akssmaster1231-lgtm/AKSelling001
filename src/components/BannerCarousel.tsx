import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/types';

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goPrev = () => setIndex(prev => (prev - 1 + banners.length) % banners.length);
  const goNext = () => setIndex(prev => (prev + 1) % banners.length);

  return (
    <div className="relative w-full h-44 sm:h-56 rounded-xl overflow-hidden shadow-card">
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map(banner => (
          <div
            key={banner.id}
            className={`relative w-full h-full shrink-0 bg-gradient-to-br ${banner.gradient}`}
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
            <div className="relative h-full flex flex-col justify-center px-6 sm:px-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
                {banner.title}
              </h2>
              <p className="text-sm sm:text-base text-white/90 mt-1.5 max-w-xs">
                {banner.subtitle}
              </p>
              <button className="mt-3 w-fit bg-white text-flipkart-700 text-sm font-bold px-5 py-2 rounded-full shadow-md hover:bg-flipkart-50 transition-colors">
                {banner.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={goPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full p-1.5 text-white transition-colors"
        aria-label="Previous banner"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={goNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full p-1.5 text-white transition-colors"
        aria-label="Next banner"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
            }`}
            aria-label={`Banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
