import { useEffect } from "react";

export function useScroll() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}
