"use client";

import { useEffect, useRef, useCallback } from "react";

type SwipeDirection = "left" | "right" | "up" | "down";

interface UseSwipeOptions {
  onSwipe?: (direction: SwipeDirection) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe (default: 50px)
  maxTime?: number; // Maximum time for swipe in ms (default: 500ms)
}

interface UseSwipeReturn {
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useSwipe(options: UseSwipeOptions): UseSwipeReturn {
  const {
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    maxTime = 500,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const diffX = endX - startX.current;
      const diffY = endY - startY.current;
      const timeDiff = endTime - startTime.current;

      // Check if swipe was fast enough
      if (timeDiff > maxTime) return;

      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);

      // Determine if horizontal or vertical swipe
      if (absX > absY && absX >= threshold) {
        // Horizontal swipe
        if (diffX > 0) {
          onSwipeRight?.();
          onSwipe?.("right");
        } else {
          onSwipeLeft?.();
          onSwipe?.("left");
        }
      } else if (absY > absX && absY >= threshold) {
        // Vertical swipe
        if (diffY > 0) {
          onSwipeDown?.();
          onSwipe?.("down");
        } else {
          onSwipeUp?.();
          onSwipe?.("up");
        }
      }
    },
    [onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, maxTime]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return { ref };
}
