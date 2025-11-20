import React, { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";

interface WheelPickerProps {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (value: string | number) => void;
  className?: string;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5; // Keep odd number
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export const WheelPicker = ({
  options,
  value,
  onChange,
  className,
}: WheelPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const isDragging = useRef(false);

  // Initial scroll position
  useEffect(() => {
    if (scrollRef.current) {
      const index = options.findIndex((o) => o.value === value);
      if (index !== -1) {
        scrollRef.current.scrollTop = index * ITEM_HEIGHT;
        setScrollTop(index * ITEM_HEIGHT);
      }
    }
  }, []);

  useEffect(() => {
    // Sync external value changes if not dragging and only if significant difference
    if (scrollRef.current && !isDragging.current) {
      const index = options.findIndex((o) => o.value === value);
      if (index !== -1) {
        const target = index * ITEM_HEIGHT;
        // Don't scroll if we are already approximately there (within 1px)
        if (Math.abs(scrollRef.current.scrollTop - target) > 1) {
          // Use 'auto' instead of 'smooth' to prevent fighting with user scroll or ongoing animations
          // causing weird re-render jumps if value updates rapidly
          scrollRef.current.scrollTo({ top: target, behavior: "auto" });
          setScrollTop(target);
        }
      }
    }
  }, [value]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    setScrollTop(top);

    // Debounce the value update to avoid spamming
    if (scrollRef.current) {
      clearTimeout((scrollRef.current as any)._timeout);
      (scrollRef.current as any)._timeout = setTimeout(() => {
        const index = Math.round(top / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, options.length - 1));

        // Only call onChange if the value actually changes
        if (options[clampedIndex] && options[clampedIndex].value !== value) {
          onChange(options[clampedIndex].value);
        }
      }, 200); // Increased debounce time slightly
    }
  };

  return (
    <div
      className={cn(
        "scrollbar-hidden relative w-full overflow-hidden bg-white select-none",
        className,
      )}
      style={{ height: CONTAINER_HEIGHT, perspective: "1000px" }}
    >
      {/* Selection Highlight (Glassmorphism-ish) */}
      <div
        className="scrollbar-hidden pointer-events-none absolute top-1/2 left-0 z-10 w-full -translate-y-1/2 border-y border-gray-200"
        style={{ height: ITEM_HEIGHT, background: "rgba(0,0,0,0.03)" }}
      />

      {/* Gradient Masks for Depth */}
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 h-20 bg-gradient-to-b from-white via-white/90 to-transparent" />
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 h-20 bg-gradient-to-t from-white via-white/90 to-transparent" />

      <div
        ref={scrollRef}
        className="scrollbar-hidden h-full w-full snap-y snap-mandatory overflow-y-auto"
        onScroll={handleScroll}
        onMouseDown={() => {
          isDragging.current = true;
        }}
        onMouseUp={() => {
          isDragging.current = false;
        }}
        onTouchStart={() => {
          isDragging.current = true;
        }}
        onTouchEnd={() => {
          isDragging.current = false;
        }}
        style={{
          paddingTop: CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2,
          paddingBottom: CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2,
        }}
      >
        {options.map((option, i) => {
          // Calculate distance from center for 3D effect
          const itemCenter = i * ITEM_HEIGHT + ITEM_HEIGHT / 2;
          const containerCenter =
            scrollTop + CONTAINER_HEIGHT / 2 - (CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2); // Adjusted for padding
          // Actually, simpler: scrollTop correlates to index * ITEM_HEIGHT
          // Center of view in scroll coordinates:
          const centerScroll = scrollTop + CONTAINER_HEIGHT / 2;
          // Center of item in scroll coordinates (including padding):
          // The padding pushes the first item down.
          // First item (i=0) is at paddingTop.
          // So item Y = paddingTop + i * ITEM_HEIGHT
          const paddingTop = CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2;
          const itemY = paddingTop + i * ITEM_HEIGHT;
          const itemMiddle = itemY + ITEM_HEIGHT / 2;

          // Viewport middle relative to scroll content
          const viewportMiddle = scrollTop + CONTAINER_HEIGHT / 2;

          const distance = Math.abs(viewportMiddle - itemMiddle);
          const isSelected = distance < ITEM_HEIGHT / 2;

          // Scale and Rotate
          // Max distance for effect ~ 100px
          const maxDist = 100;
          const scale = Math.max(0.8, 1 - distance / (CONTAINER_HEIGHT * 1.2));
          const opacity = Math.max(0.3, 1 - distance / (CONTAINER_HEIGHT * 0.8));
          const rotateX = Math.min(45, Math.max(-45, (itemMiddle - viewportMiddle) / 5));

          return (
            <div
              key={`${option.value}-${i}`}
              className="scrollbar-hidden flex snap-center items-center justify-center"
              style={{
                height: ITEM_HEIGHT,
                transform: `scale(${scale}) rotateX(${-rotateX}deg)`,
                opacity: opacity,
                transformStyle: "preserve-3d",
                transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
              }}
            >
              <span
                className={cn(
                  "truncate px-2 text-lg transition-colors duration-200",
                  isSelected ? "font-semibold text-black" : "font-normal text-gray-400",
                )}
              >
                {option.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
