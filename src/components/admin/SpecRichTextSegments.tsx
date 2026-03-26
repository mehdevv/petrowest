import { Fragment, type ReactNode } from "react";

/** Renders plain text with `**segments**` shown as <strong>. */
export function SpecRichTextSegments({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const nodes: ReactNode[] = [];
  let k = 0;
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    }
    nodes.push(
      <strong
        key={k++}
        className="font-black text-gray-950 dark:text-gray-50 tracking-tight"
      >
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  }
  if (nodes.length === 0) {
    return <span className={className}>{text}</span>;
  }
  return <span className={className}>{nodes}</span>;
}
