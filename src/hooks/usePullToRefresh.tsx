import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

// Type guard for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        HapticFeedback?: {
          impactOccurred: (
            style: "light" | "medium" | "heavy" | "rigid" | "soft",
          ) => void;
        };
      };
    };
  }
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let currentY = 0;
    let isAtTop = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Check if we're at the top of the page
      isAtTop = container.scrollTop === 0;

      if (isAtTop) {
        startY = e.touches[0].clientY;
        touchStartY.current = startY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      // Only allow pull down
      if (diff > 0 && container.scrollTop === 0) {
        // Prevent default scroll behavior
        e.preventDefault();

        // Apply resistance to make it feel natural
        const distance = Math.min(diff * 0.5, threshold * 1.5);
        setPullDistance(distance);
        setIsPulling(true);

        // Trigger haptic feedback when reaching threshold
        if (distance >= threshold && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);

        // Trigger haptic feedback
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
        }

        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh failed:", error);
        } finally {
          setIsRefreshing(false);
        }
      }

      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    containerRef,
    isPulling: isPulling || isRefreshing,
    isRefreshing,
    pullDistance,
    threshold,
  };
}
