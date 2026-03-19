import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function usePageTracking() {
  const [location] = useLocation();
  const prevLocation = useRef<string | null>(null);

  useEffect(() => {
    if (prevLocation.current === location) return;
    prevLocation.current = location;

    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_path: location,
        page_title: document.title,
      });
    }
  }, [location]);
}
