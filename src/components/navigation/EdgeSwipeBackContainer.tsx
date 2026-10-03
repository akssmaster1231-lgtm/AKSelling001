import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';

interface EdgeSwipeBackContainerProps {
  canGoBack: boolean;
  onBack: () => void;
  children: React.ReactNode;
}

/**
 * Native Edge-Swipe & Hardware Back Navigation Container
 * Provides Flipkart-grade seamless back gestures without interfering with vertical page scrolling or card clicks.
 */
export default function EdgeSwipeBackContainer({
  canGoBack,
  onBack,
  children,
}: EdgeSwipeBackContainerProps) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [touchY, setTouchY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isEdgeSwipeRef = useRef(false);
  const swipeDistanceRef = useRef(0);
  const canGoBackRef = useRef(canGoBack);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    canGoBackRef.current = canGoBack;
    onBackRef.current = onBack;
  }, [canGoBack, onBack]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only capture gesture if there is a screen/modal to go back to
    if (!canGoBackRef.current) {
      isEdgeSwipeRef.current = false;
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    // Strict left-edge touch boundary: only within 24px of the screen's left edge
    // This ensures product cards, shelves, and buttons are never hijacked
    if (touch.clientX <= 24) {
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      isEdgeSwipeRef.current = true;
      swipeDistanceRef.current = 0;
      setTouchY(touch.clientY);
    } else {
      isEdgeSwipeRef.current = false;
      startXRef.current = null;
      startYRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isEdgeSwipeRef.current || startXRef.current === null || startYRef.current === null) {
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    // If there is noticeable vertical scroll, instantly release edge swipe so page scrolls naturally
    if (Math.abs(deltaY) > 12 && Math.abs(deltaY) >= Math.abs(deltaX)) {
      isEdgeSwipeRef.current = false;
      setIsSwiping(false);
      setSwipeProgress(0);
      return;
    }

    // Pure horizontal swipe from the edge
    if (deltaX > 20 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      setIsSwiping(true);
      swipeDistanceRef.current = Math.max(0, deltaX);
      const progress = Math.min(1, Math.max(0, deltaX / 80));
      setSwipeProgress(progress);
      setTouchY(touch.clientY);

      // Only prevent horizontal drag conflict when clearly executing a swipe
      if (e.cancelable && deltaX > 35) {
        e.preventDefault();
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isEdgeSwipeRef.current) {
      setIsSwiping(false);
      setSwipeProgress(0);
      return;
    }

    const distance = swipeDistanceRef.current;
    isEdgeSwipeRef.current = false;
    startXRef.current = null;
    startYRef.current = null;
    swipeDistanceRef.current = 0;

    // Threshold to complete back gesture
    if (distance >= 50 && canGoBackRef.current) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // ignore
        }
      }
      onBackRef.current();
    }

    setIsSwiping(false);
    setSwipeProgress(0);
  }, []);

  useEffect(() => {
    // Passive touchstart and touchend to guarantee 0-latency touch dispatch
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Sync with browser popstate (Android physical / software back button)
  useEffect(() => {
    const handlePopState = () => {
      if (canGoBackRef.current) {
        onBackRef.current();
        try {
          window.history.pushState({ akselling_in_app_route: true }, '');
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="relative w-full min-h-screen">
      {children}

      {/* Floating Edge Swipe Indicator */}
      {isSwiping && swipeProgress > 0.05 && (
        <div
          className="fixed left-0 z-[9999] pointer-events-none transition-transform duration-75 ease-out"
          style={{
            top: `${Math.max(80, Math.min(window.innerHeight - 100, touchY - 24))}px`,
            transform: `translateX(${Math.min(65, swipeProgress * 55)}px) scale(${0.75 + swipeProgress * 0.35})`,
            opacity: Math.min(1, swipeProgress * 1.5),
          }}
        >
          <div
            className={`w-11 h-11 rounded-full shadow-2xl flex items-center justify-center transition-all ${
              swipeProgress >= 0.7
                ? 'bg-[#1b365d] text-amber-300 ring-4 ring-amber-400/40 shadow-blue-900/50 scale-110'
                : 'bg-white/95 text-slate-800 border border-slate-300 backdrop-blur-md'
            }`}
          >
            <ChevronLeft
              size={22}
              className={`transition-transform ${
                swipeProgress >= 0.7 ? 'stroke-[3] -translate-x-0.5' : 'stroke-[2]'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
