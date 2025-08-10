import { useEffect } from "react";
import { clearScrollPosition, getScrollPosition } from "~/lib/utils/scrollPosition";

export const useScrollRestoration = (key: string) => {
  useEffect(() => {
    const saved = getScrollPosition(key);
    console.log(saved, "saved");
    if (saved != null) {
      // Ensure layout is ready before scrolling
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
      });
      // Scroll again shortly after mount to account for async content/image layout
      const t = setTimeout(() => {
        window.scrollTo(0, saved);
        clearScrollPosition(key);
      }, 300);
      return () => clearTimeout(t);
    } else {
      window.scrollTo(0, 0);
    }
  }, [key]);
};
