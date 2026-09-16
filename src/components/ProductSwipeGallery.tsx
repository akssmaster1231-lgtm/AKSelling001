import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn } from 'lucide-react';

interface ProductSwipeGalleryProps {
  images: string[];
  title: string;
  discount?: number;
  neckType?: string;
  fitType?: string;
}

const CLEAN_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f8fafc'/%3E%3Cpath d='M140 260 L180 200 L210 240 L250 180 L300 260 Z' fill='%23e2e8f0'/%3E%3Ccircle cx='170' cy='160' r='20' fill='%23e2e8f0'/%3E%3C/svg%3E";

export default function ProductSwipeGallery({
  images,
  title,
  discount,
  neckType,
  fitType,
}: ProductSwipeGalleryProps) {
  // Sanitize images to ensure no broken or placeholder glitch urls
  const safeImages = (images && images.length > 0 ? images : [CLEAN_IMAGE_PLACEHOLDER]).map(
    img => (typeof img === 'string' && img.includes('8532616') ? CLEAN_IMAGE_PLACEHOLDER : img)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // Scroll to index smoothly
  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(index, safeImages.length - 1));
    setCurrentIndex(clamped);
    const targetScroll = clamped * container.clientWidth;
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });

    // Scroll thumbnail into view
    if (thumbnailsContainerRef.current) {
      const thumb = thumbnailsContainerRef.current.children[clamped] as HTMLElement;
      if (thumb) {
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [safeImages.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToIndex(currentIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToIndex(currentIndex + 1);
  };

  // Synchronize index on user manual swipe / scroll
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || container.clientWidth === 0) return;
    const newIndex = Math.round(container.scrollLeft / container.clientWidth);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < safeImages.length) {
      setCurrentIndex(newIndex);
    }
  };

  // Touch gesture handlers for fast swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

    // Horizontal intent check (more horizontal than vertical and > 40px)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0 && currentIndex < safeImages.length - 1) {
        scrollToIndex(currentIndex + 1);
      } else if (diffX < 0 && currentIndex > 0) {
        scrollToIndex(currentIndex - 1);
      }
    }
  };

  // Keyboard navigation when focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollToIndex(currentIndex - 1);
      if (e.key === 'ArrowRight') scrollToIndex(currentIndex + 1);
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, scrollToIndex]);

  return (
    <div className="bg-white select-none">
      {/* Main Carousel Viewport */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden group">
        {/* Scroll / Swipe Container with CSS Scroll Snap */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {safeImages.map((imgUrl, idx) => {
            const isLoaded = loadedImages[idx];
            return (
              <div
                key={idx}
                className="w-full h-full shrink-0 snap-center relative flex items-center justify-center bg-slate-50 cursor-zoom-in"
                onClick={() => {
                  setCurrentIndex(idx);
                  setLightboxOpen(true);
                }}
              >
                {/* Shimmering Skeleton Loader */}
                {!isLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse z-0" />
                )}

                <img
                  src={imgUrl}
                  alt={`${title} - Angle ${idx + 1}`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  onLoad={() => setLoadedImages(prev => ({ ...prev, [idx]: true }))}
                  onError={() => setLoadedImages(prev => ({ ...prev, [idx]: true }))}
                  className={`w-full h-full object-cover transition-opacity duration-300 relative z-10 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Discount & Spec Badges */}
        {discount !== undefined && discount > 0 && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-md z-20">
            {discount}% OFF
          </span>
        )}

        {(neckType || fitType) && (
          <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm z-20">
            {[neckType, fitType].filter(Boolean).join(' • ')}
          </span>
        )}

        {/* Desktop Navigation Chevrons */}
        {safeImages.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Image"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-md backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:opacity-90 z-20 cursor-pointer"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
            )}

            {currentIndex < safeImages.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Image"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-md backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:opacity-90 z-20 cursor-pointer"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            )}
          </>
        )}

        {/* Flipkart-Style Counter Badge */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-slate-950/70 backdrop-blur-xs text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shadow-sm z-20 flex items-center gap-1 pointer-events-none">
            <span>{currentIndex + 1}</span>
            <span className="text-slate-400">/</span>
            <span>{safeImages.length}</span>
          </div>
        )}

        {/* Tap to Zoom Hint Button */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute bottom-3 left-3 bg-white/80 hover:bg-white text-slate-700 p-1.5 rounded-full shadow-sm backdrop-blur-xs transition-colors z-20"
          title="Inspect Full Image"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {/* Flipkart-Style Dot Pagination */}
      {safeImages.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 py-2.5 bg-white">
          {safeImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentIndex ? 'w-6 bg-flipkart-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Horizontal Thumbnail Row */}
      {safeImages.length > 1 && (
        <div
          ref={thumbnailsContainerRef}
          className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-t border-slate-100"
        >
          {safeImages.map((imgUrl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToIndex(i)}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer relative bg-slate-100 ${
                currentIndex === i
                  ? 'border-flipkart-600 shadow-sm scale-105 ring-2 ring-flipkart-200'
                  : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Full-Screen Zoom Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-between p-4 animate-fade-in">
          {/* Header Controls */}
          <div className="w-full flex items-center justify-between text-white z-10 px-2 py-1">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
              {currentIndex + 1} of {safeImages.length} Photos
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom(!lightboxZoom)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={lightboxZoom ? 'Reset Zoom' : 'Zoom In'}
              >
                <ZoomIn size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false);
                  setLightboxZoom(false);
                }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={safeImages[currentIndex]}
              alt={title}
              className={`max-h-[85vh] max-w-full object-contain transition-transform duration-300 ${
                lightboxZoom ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
              }`}
              onClick={() => setLightboxZoom(!lightboxZoom)}
            />

            {/* Previous Photo */}
            {safeImages.length > 1 && currentIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(currentIndex - 1);
                  setLightboxZoom(false);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-all cursor-pointer"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Next Photo */}
            {safeImages.length > 1 && currentIndex < safeImages.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(currentIndex + 1);
                  setLightboxZoom(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-all cursor-pointer"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {safeImages.length > 1 && (
            <div className="flex gap-2 max-w-full overflow-x-auto py-2 px-3 no-scrollbar z-10">
              {safeImages.map((thumb, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setLightboxZoom(false);
                  }}
                  className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    currentIndex === idx ? 'border-white scale-110' : 'border-white/30 opacity-60'
                  }`}
                >
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
