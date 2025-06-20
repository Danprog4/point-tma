import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

export function ScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    // Restore scroll position to top when route changes
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}
