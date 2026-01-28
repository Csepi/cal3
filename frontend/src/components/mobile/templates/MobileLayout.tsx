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

import React, { useRef } from 'react';
import { useScreenSize } from '../../../hooks/useScreenSize';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
  noPadding?: boolean;
  themeColor?: string;
  surfaceLabel?: string;
  userName?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showBottomNav = true,
  onRefresh,
  className = '',
  noPadding = false,
  themeColor = '#3b82f6',
  surfaceLabel,
  userName,
}) => {
  const { isMobile } = useScreenSize();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const withAlpha = (color: string, alpha: number) => {
    if (!color.startsWith('#')) return color;
    const hex = color.replace('#', '');
    const normalized = hex.length === 3
      ? hex.split('').map(char => char + char).join('')
      : hex;
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const initials = userName
    ? userName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : '';

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

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
      {isMobile && (
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                {todayLabel}
              </p>
              <p
                className="text-base font-semibold leading-tight"
                style={{ color: themeColor }}
              >
                {surfaceLabel || 'PrimeCal mobile'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: withAlpha(themeColor, 0.12),
                  color: themeColor,
                  border: `1px solid ${withAlpha(themeColor, 0.18)}`,
                }}
              >
                Live
              </span>
              {initials && (
                <div
                  className="h-9 w-9 rounded-full bg-white shadow-sm flex items-center justify-center text-sm font-semibold"
                  style={{
                    color: themeColor,
                    border: `1px solid ${withAlpha(themeColor, 0.22)}`,
                    backgroundColor: withAlpha(themeColor, 0.08),
                  }}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        onTouchCancel={handleTouchEnd}
        className={`
          ${isMobile && showBottomNav ? 'pb-16' : ''}
          ${isMobile ? 'overflow-y-auto' : ''}
          ${noPadding ? '' : 'px-4 md:px-0'}
          ${isMobile ? 'min-h-screen' : ''}
        `}
        style={{
          paddingBottom: isMobile && showBottomNav
            ? 'calc(5.25rem + env(safe-area-inset-bottom))'
            : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
