import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bold } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { markdownBoldToSafeHtml, htmlToMarkdownBold } from "@/lib/spec-markdown-html";
import { cn } from "@/lib/utils";

type SpecRichInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  autoFocus?: boolean;
};

const editableClass =
  "relative z-[1] min-h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring md:text-sm " +
  "[&_strong]:font-black [&_strong]:text-gray-950 [&_strong]:dark:text-gray-50 [&_b]:font-black [&_b]:text-gray-950 [&_b]:dark:text-gray-50";

export function SpecRichInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  onKeyDown,
  autoFocus,
}: SpecRichInputProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  const emitMarkdown = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    let md = htmlToMarkdownBold(el.innerHTML);
    if (!md) {
      el.innerHTML = "";
    }
    onChange(md);
  }, [onChange]);

  useLayoutEffect(() => {
    if (focused) return;
    const el = ref.current;
    if (!el) return;
    const currentMd = htmlToMarkdownBold(el.innerHTML);
    if (currentMd !== value) {
      el.innerHTML = markdownBoldToSafeHtml(value);
    }
  }, [value, focused]);

  useLayoutEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  const applyBold = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (
      !sel ||
      sel.rangeCount === 0 ||
      sel.isCollapsed ||
      !el.contains(sel.anchorNode)
    ) {
      toast({
        title: t("admin.specRichInput.toastNoSelectionTitle"),
        description: t("admin.specRichInput.toastNoSelectionDesc"),
        variant: "destructive",
      });
      return;
    }
    try {
      document.execCommand("bold");
    } catch {
      /* ignore */
    }
    emitMarkdown();
  };

  const showPlaceholder = !value.trim() && !focused && !!placeholder;

  return (
    <div className={cn("flex min-w-0 gap-1 items-center", className)}>
      <div className="relative min-w-0 flex-1">
        {showPlaceholder && (
          <span className="pointer-events-none absolute left-3 top-1/2 z-0 -translate-y-1/2 text-sm text-muted-foreground">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="false"
          aria-placeholder={placeholder}
          contentEditable
          suppressContentEditableWarning
          className={cn(editableClass, inputClassName)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            emitMarkdown();
          }}
          onInput={emitMarkdown}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            const el = ref.current;
            if (!el) return;
            el.focus();
            try {
              document.execCommand("insertText", false, text);
            } catch {
              /* ignore */
            }
            emitMarkdown();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
            onKeyDown?.(e);
          }}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onMouseDown={(e) => e.preventDefault()}
        onClick={applyBold}
        title={t("admin.specRichInput.boldTitle")}
        aria-label={t("admin.specRichInput.boldTitle")}
      >
        <Bold className="h-4 w-4" />
      </Button>
    </div>
  );
}
