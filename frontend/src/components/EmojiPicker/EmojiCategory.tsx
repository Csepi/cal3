import React, { useEffect, useMemo, useRef, useState } from 'react';

import { EmojiItem } from './EmojiItem';
import type { EmojiOption } from './types';

const GRID_COLUMNS = 8;
const ROW_HEIGHT = 48;
const OVERSCAN_ROWS = 3;

interface EmojiCategoryProps {
  title: string;
  emojis: EmojiOption[];
  activeIndex: number;
  onSelect: (option: EmojiOption) => void;
  onActivateIndex: (index: number) => void;
  emptyLabel: string;
}

export const EmojiCategory: React.FC<EmojiCategoryProps> = ({
  title,
  emojis,
  activeIndex,
  onSelect,
  onActivateIndex,
  emptyLabel,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(280);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const firstEntry = entries[0];
      if (!firstEntry) {
        return;
      }
      setContainerHeight(firstEntry.contentRect.height || 280);
    });

    observer.observe(container);
    setContainerHeight(container.clientHeight || 280);

    return () => {
      observer.disconnect();
    };
  }, []);

  const totalRows = Math.max(1, Math.ceil(emojis.length / GRID_COLUMNS));
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS);
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN_ROWS,
  );

  const visibleRange = useMemo(() => {
    const startIndex = startRow * GRID_COLUMNS;
    const endIndex = Math.min(emojis.length, (endRow + 1) * GRID_COLUMNS);
    return {
      startIndex,
      endIndex,
      items: emojis.slice(startIndex, endIndex),
    };
  }, [emojis, endRow, startRow]);

  return (
    <section className="space-y-2" aria-label={title}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div
        ref={containerRef}
        className="h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {emojis.length === 0 ? (
          <div className="flex h-full items-center justify-center px-3 text-sm text-slate-500">
            {emptyLabel}
          </div>
        ) : (
          <div style={{ height: totalRows * ROW_HEIGHT, position: 'relative' }}>
            <div
              className="absolute left-0 right-0 grid gap-1.5 p-2"
              style={{
                transform: `translateY(${startRow * ROW_HEIGHT}px)`,
                gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
              }}
            >
              {visibleRange.items.map((emoji, index) => {
                const absoluteIndex = visibleRange.startIndex + index;
                return (
                  <EmojiItem
                    key={`${emoji.key}-${absoluteIndex}`}
                    emoji={emoji}
                    isActive={activeIndex === absoluteIndex}
                    onSelect={onSelect}
                    onMouseEnter={() => onActivateIndex(absoluteIndex)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
