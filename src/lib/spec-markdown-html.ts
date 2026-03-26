/** Escape text for safe insertion into HTML (non-bold segments). */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `**bold**` → HTML with <strong> only (safe). */
export function markdownBoldToSafeHtml(text: string): string {
  if (!text) return "";
  const parts: string[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    parts.push(escapeHtml(text.slice(last, m.index)));
    parts.push(`<strong>${escapeHtml(m[1])}</strong>`);
    last = m.index + m[0].length;
  }
  parts.push(escapeHtml(text.slice(last)));
  return parts.join("");
}

/**
 * Read contenteditable HTML back to markdown ** **.
 * Handles <strong>, <b>, <br>; flattens other wrappers to text.
 */
export function htmlToMarkdownBold(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<br>" || trimmed === "<div><br></div>" || trimmed === "<br/>") {
    return "";
  }
  const doc = new DOMParser().parseFromString(`<div id="spec-root">${html}</div>`, "text/html");
  const root = doc.getElementById("spec-root");
  if (!root) return "";

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? "").replace(/\u00a0/g, " ");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName;
    if (tag === "STRONG" || tag === "B") {
      return "**" + (el.textContent ?? "").replace(/\u00a0/g, " ") + "**";
    }
    if (tag === "SPAN") {
      const w = el.style.fontWeight;
      if (w === "bold" || w === "700" || w === "600" || w === "800" || w === "900") {
        return "**" + (el.textContent ?? "").replace(/\u00a0/g, " ") + "**";
      }
    }
    if (tag === "BR") return " ";
    return Array.from(el.childNodes).map(walk).join("");
  }

  return walk(root).trimEnd();
}
