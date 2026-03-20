import type { Locale } from "date-fns";
import { fr, enUS, ar } from "date-fns/locale";

export function getDateFnsLocale(lang: string | undefined): Locale {
  if (lang === "en") return enUS;
  if (lang === "ar") return ar;
  return fr;
}

export function getHtmlLocale(lang: string | undefined): string {
  if (lang === "en") return "en";
  if (lang === "ar") return "ar";
  return "fr";
}
