/**
 * MobileLayout - Template Component
 *
 * Main layout wrapper that adapts to screen size
 * Handles:
 * - Safe areas (notch, home bar)
 * - Bottom navigation spacing
 * - Scroll behavior
 * - Pull-to-refresh
 *
 * Works on ALL screen sizes!
 */

import React, { useEffect, useRef } from 'react';
import { useScreenSize } from '../../../hooks/useScreenSize';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
  noPadding?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showBottomNav = true,
  onRefresh,
  className = '',
  noPadding = false,
}) => {
  const { isMobile } = useScreenSize();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh logic (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || !onRefresh) return;
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !onRefresh) return;
    if (scrollRef.current && scrollRef.current.scrollTop === 0 && touchStartY.current > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(currentY - touchStartY.current, 100));
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isMobile || !onRefresh) return;
    if (pullDistance > 60) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    touchStartY.current = 0;
  };

  return (
    <div
      className={`
        ${isMobile ? 'min-h-screen' : 'relative'}
        ${className}
      `}
    >
      {/* Pull-to-refresh indicator */}
      {isMobile && onRefresh && pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex justify-center transition-opacity"
          style={{
            transform: `translateY(${pullDistance - 60}px)`,
            opacity: pullDistance / 60,
          }}
        >
          <div className="bg-white rounded-full p-3 shadow-lg">
            <svg
              className={`w-6 h-6 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          ${isMobile && showBottomNav ? 'pb-16' : ''}
          ${isMobile ? 'overflow-y-auto' : ''}
          ${noPadding ? '' : 'px-4 md:px-0'}
          ${isMobile ? 'min-h-screen' : ''}
        `}
        style={{
          paddingBottom: isMobile && showBottomNav
            ? 'calc(4rem + env(safe-area-inset-bottom))'
            : undefined,
        }}
      >
        {isMobile && (
          <div className="flex items-center justify-center gap-3 py-5">
            <img src="/primecal-icon.svg" alt="PrimeCal logo" className="h-10 w-10" />
            <div className="text-center leading-tight">
              <p className="text-lg font-semibold text-gray-900">PrimeCal</p>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Be in sync with Reality</p>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
