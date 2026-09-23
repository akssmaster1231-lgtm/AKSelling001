import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Zap,
  ChevronUp,
  ChevronDown,
  Play,
  Star,
  Flame,
} from 'lucide-react';
import { FASHION_REELS, type VideoReelItem } from './reelsData';
import { formatPrice } from '@/data';
import type { Product } from '@/types';

interface VideoReelsFeedProps {
  onProductClick: (product: Product) => void;
  onBuyNow: (product: Product, size?: string, color?: string) => void;
}

export default function VideoReelsFeed({ onProductClick, onBuyNow }: VideoReelsFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    FASHION_REELS.forEach((r) => {
      initial[r.id] = r.likesCount;
    });
    return initial;
  });
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  const currentReel = FASHION_REELS[currentIndex];

  // Sync video play/pause on index change
  useEffect(() => {
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      if (idx === currentIndex) {
        vid.currentTime = 0;
        vid.play().catch(() => {
          // autoplay policy catch
        });
      } else {
        vid.pause();
      }
    });
    setIsPlaying(true);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < FASHION_REELS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) {
      // Swiped UP -> Next
      handleNext();
    } else if (diff < -50) {
      // Swiped DOWN -> Previous
      handlePrev();
    }
    touchStartY.current = null;
  };

  // Double tap to like
  const lastTapRef = useRef<number>(0);
  const handleVideoTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap!
      handleToggleLike(currentReel.id, true);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 900);
    } else {
      // Single tap -> Play / Pause
      const vid = videoRefs.current[currentIndex];
      if (vid) {
        if (vid.paused) {
          vid.play();
          setIsPlaying(true);
        } else {
          vid.pause();
          setIsPlaying(false);
        }
      }
    }
    lastTapRef.current = now;
  };

  const handleToggleLike = (reelId: string, forceLike = false) => {
    const isCurrentlyLiked = likedReels[reelId];
    if (forceLike && isCurrentlyLiked) return;

    const nextState = forceLike ? true : !isCurrentlyLiked;
    setLikedReels((prev) => ({ ...prev, [reelId]: nextState }));
    setLikeCounts((prev) => ({
      ...prev,
      [reelId]: (prev[reelId] || 0) + (nextState ? 1 : -1),
    }));
  };

  const handleShare = async (reel: VideoReelItem) => {
    const shareUrl = `${window.location.origin}?productId=${reel.productId}&reels=true`;
    const shareText = `Check out this trending ${reel.product.title} on AKSelling Video Shopping! Only ${formatPrice(reel.product.price)}: ${shareUrl}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: reel.product.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // ignore
      }
    }

    // WhatsApp Direct Fallback
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    setShareToast('Shared to WhatsApp!');
    setTimeout(() => setShareToast(null), 2500);
  };

  const mapReelProduct = (reel: VideoReelItem): Product => {
    return {
      id: reel.product.id,
      title: reel.product.title,
      brand: reel.product.brand,
      price: reel.product.price,
      mrp: reel.product.mrp,
      discount: reel.product.discount,
      rating: reel.product.rating,
      ratingCount: 124,
      image: reel.product.image,
      images: [reel.product.image],
      category: 'clothing',
      description: reel.caption,
      inStock: true,
      sizes: reel.product.sizes,
      colors: reel.product.colors,
    };
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[calc(100vh-120px)] sm:h-[calc(100vh-128px)] bg-black overflow-hidden flex flex-col items-center justify-center select-none"
    >
      {/* Top Floating Category & Audio Bar */}
      <div className="absolute top-3 left-0 right-0 z-30 px-3 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-md">
          <Flame size={14} className="text-amber-400 fill-amber-400 animate-pulse" />
          <span className="text-xs font-black text-white tracking-wide uppercase">Shop By Video</span>
          <span className="bg-gradient-to-r from-red-600 to-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
            LIVE
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
          title={isMuted ? 'Tap to Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={17} className="text-amber-400" /> : <Volume2 size={17} className="text-emerald-400" />}
        </button>
      </div>

      {/* Main Video Presentation */}
      <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
        {FASHION_REELS.map((reel, idx) => {
          const isCurrent = idx === currentIndex;
          const hasError = videoErrors[reel.id];
          return (
            <div
              key={reel.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {!hasError ? (
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  poster={reel.posterUrl}
                  muted={isMuted}
                  loop
                  playsInline
                  preload="auto"
                  onClick={handleVideoTap}
                  onError={(e) => {
                    e.preventDefault();
                    setVideoErrors((prev) => ({ ...prev, [reel.id]: true }));
                  }}
                  className="w-full h-full object-cover cursor-pointer"
                >
                  <source src={reel.videoUrl} type="video/mp4" />
                </video>
              ) : (
                <div
                  onClick={handleVideoTap}
                  className="w-full h-full relative cursor-pointer overflow-hidden flex items-center justify-center bg-black"
                >
                  <img
                    src={reel.posterUrl}
                    alt={reel.caption}
                    className={`w-full h-full object-cover transition-transform duration-1000 ${
                      isPlaying && isCurrent ? 'scale-105 filter brightness-95' : 'scale-100'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
                </div>
              )}

              {/* Pause Overlay indicator */}
              {!isPlaying && isCurrent && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-xl animate-scale-up">
                    <Play size={28} className="fill-white ml-1" />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Double-tap Floating Heart Animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-ping">
            <Heart size={96} className="text-rose-500 fill-rose-500 drop-shadow-2xl" />
          </div>
        )}

        {/* Right Side Social Actions (Likes, Comments, Share, Next/Prev) */}
        <div className="absolute right-3 bottom-28 z-30 flex flex-col items-center gap-4 pointer-events-auto">
          {/* Like */}
          <button
            type="button"
            onClick={() => handleToggleLike(currentReel.id)}
            className="flex flex-col items-center gap-1 group active:scale-125 transition-transform"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-colors ${
                likedReels[currentReel.id]
                  ? 'bg-rose-500 text-white'
                  : 'bg-black/50 text-white border border-white/20'
              }`}
            >
              <Heart
                size={22}
                className={likedReels[currentReel.id] ? 'fill-white' : ''}
              />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">
              {likeCounts[currentReel.id] || 0}
            </span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => handleShare(currentReel)}
            className="flex flex-col items-center gap-1 group active:scale-110 transition-transform"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg backdrop-blur-md border border-emerald-400/40">
              <Share2 size={20} />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">
              {currentReel.sharesCount}
            </span>
          </button>

          {/* Quick Vertical Switch Controls */}
          <div className="flex flex-col gap-1.5 pt-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md active:scale-90 transition-all ${
                currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'
              }`}
              title="Previous Video"
            >
              <ChevronUp size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md hover:bg-white/20 active:scale-90 transition-all"
              title="Next Video"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </div>

        {/* Bottom Product Overlay Card & 1-Tap Buy Now */}
        <div className="absolute left-0 right-0 bottom-0 z-30 p-3 pt-6 bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-auto">
          {/* Creator & Caption */}
          <div className="mb-2.5 max-w-[80%]">
            <div className="flex items-center gap-2 mb-1">
              <img
                src={currentReel.creatorAvatar}
                alt={currentReel.creatorName}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-400"
              />
              <span className="text-xs font-bold text-white drop-shadow-md">
                {currentReel.creatorName}
              </span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-400/30">
                Verified Stylist
              </span>
            </div>
            <p className="text-xs text-white/90 line-clamp-2 leading-relaxed font-medium drop-shadow">
              {currentReel.caption}
            </p>
          </div>

          {/* Interactive Floating Product Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-2.5 shadow-2xl border border-white/40 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onProductClick(mapReelProduct(currentReel))}
              className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 cursor-pointer"
            >
              <img
                src={currentReel.product.image}
                alt={currentReel.product.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-[#1b365d] text-amber-300 text-[9px] font-black text-center py-0.5">
                {currentReel.product.discount}% OFF
              </span>
            </button>

            <div
              onClick={() => onProductClick(mapReelProduct(currentReel))}
              className="flex-1 min-w-0 cursor-pointer text-left"
            >
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {currentReel.product.brand}
              </p>
              <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                {currentReel.product.title}
              </h4>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-black text-slate-950">
                  {formatPrice(currentReel.product.price)}
                </span>
                <span className="text-[11px] text-slate-400 line-through">
                  {formatPrice(currentReel.product.mrp)}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <Star size={10} className="fill-emerald-600 text-emerald-600" />
                  {currentReel.product.rating}
                </span>
              </div>
            </div>

            {/* 1-Tap Buy Now Button */}
            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onBuyNow(
                    mapReelProduct(currentReel),
                    currentReel.product.sizes[0],
                    currentReel.product.colors[0]
                  )
                }
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                id="reels-buy-now-btn"
              >
                <Zap size={13} className="fill-slate-950" />
                <span>1-Tap Buy</span>
              </button>
              <button
                type="button"
                onClick={() => onProductClick(mapReelProduct(currentReel))}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 text-center"
              >
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Progress Dots Indicator */}
        <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1 z-30 pointer-events-none">
          {FASHION_REELS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-5 bg-amber-400' : 'w-1 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="absolute top-16 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-emerald-500/50 animate-bounce">
          {shareToast}
        </div>
      )}
    </div>
  );
}
