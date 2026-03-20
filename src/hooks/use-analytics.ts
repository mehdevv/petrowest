import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const VISITOR_KEY = "pw_visitor_id";
const LAST_VISIT_TRACK_KEY = "pw_last_visit_track_at";
const VISIT_TRACK_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function shouldTrackVisitNow(): boolean {
  const raw = localStorage.getItem(LAST_VISIT_TRACK_KEY);
  const now = Date.now();

  if (!raw) {
    localStorage.setItem(LAST_VISIT_TRACK_KEY, String(now));
    return true;
  }

  const last = Number(raw);
  if (!Number.isFinite(last) || now - last >= VISIT_TRACK_WINDOW_MS) {
    localStorage.setItem(LAST_VISIT_TRACK_KEY, String(now));
    return true;
  }

  return false;
}

export function usePageTracking() {
  const [location] = useLocation();
  const prevLocation = useRef<string | null>(null);

  useEffect(() => {
    if (prevLocation.current === location) return;
    prevLocation.current = location;
    if (!shouldTrackVisitNow()) return;

    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_path: location,
        page_title: document.title,
      });
    }

    supabase
      .rpc("record_page_view", {
        p_page_path: location,
        p_referrer: document.referrer || null,
        p_visitor_id: getVisitorId(),
      })
      .then(({ error }) => {
        if (error) console.warn("[Analytics] Failed to record page view:", error.message);
      });
  }, [location]);
}
