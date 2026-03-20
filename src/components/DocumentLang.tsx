import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function DocumentLang() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = (i18n.language || "fr").split("-")[0];
    const html = document.documentElement;
    html.lang = lang === "en" ? "en" : lang === "ar" ? "ar" : "fr";
    html.dir = lang === "ar" ? "rtl" : "ltr";
    html.classList.toggle("locale-ar", lang === "ar");
    html.classList.toggle("locale-fr", lang === "fr");
    html.classList.toggle("locale-en", lang === "en");
    document.title = i18n.t("meta.title");
  }, [i18n, i18n.language]);

  return null;
}
