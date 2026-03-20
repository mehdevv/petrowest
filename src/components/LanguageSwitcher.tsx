import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

const LOCALES = [
  { code: "fr", labelKey: "lang.fr" },
  { code: "en", labelKey: "lang.en" },
  { code: "ar", labelKey: "lang.ar" },
] as const;

type Variant = "default" | "ghost" | "outline";
type Size = "default" | "sm" | "lg" | "icon";

export function LanguageSwitcher({
  variant = "outline",
  size = "sm",
  className = "",
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const { i18n, t } = useTranslation();
  const current = (i18n.language || "fr").split("-")[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={`gap-1.5 shrink-0 ${className}`}
          aria-label={t("lang.switch")}
        >
          <Languages className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold uppercase">
            {current}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        {LOCALES.map(({ code, labelKey }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => void i18n.changeLanguage(code)}
            className={current === code ? "font-semibold bg-muted" : ""}
          >
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
