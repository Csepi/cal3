/**
 * useSwipeGesture - Swipe detection hook
 *
 * Detects left/right swipe gestures for navigation
 * Threshold: 50px minimum swipe distance
 * Velocity-aware for better UX
 */

import { useRef, TouchEvent } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels
  preventScroll?: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export function useSwipeGesture(options: SwipeGestureOptions): SwipeHandlers {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScroll = false,
  } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };
  };

  const onTouchMove = (e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };

    // Prevent scroll if needed (for horizontal swipes)
    if (preventScroll && touchStart.current) {
      const deltaX = Math.abs(touchEnd.current.x - touchStart.current.x);
      const deltaY = Math.abs(touchEnd.current.y - touchStart.current.y);

      // If horizontal swipe is dominant, prevent scroll
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    // Determine if it's a horizontal or vertical swipe
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

    // Horizontal swipes
    if (isHorizontal) {
      if (deltaX > threshold && onSwipeRight) {
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
        onSwipeRight();
      } else if (deltaX < -threshold && onSwipeLeft) {
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
        onSwipeLeft();
      }
    }

    // Vertical swipes
    if (isVertical) {
      if (deltaY > threshold && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < -threshold && onSwipeUp) {
        onSwipeUp();
      }
    }

    // Reset
    touchStart.current = null;
    touchEnd.current = null;
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
