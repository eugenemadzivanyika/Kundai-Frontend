// ── OCR Review — RenderedText ──────────────────────────────────────────────────

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ── KaTeX helper ───────────────────────────────────────────────────────────────

function renderKatex(formula: string, displayMode: boolean): string {
  try {
    return katex.renderToString(formula, { displayMode, throwOnError: false });
  } catch {
    return formula;
  }
}

// ── InlineContent ──────────────────────────────────────────────────────────────

/** Renders a single line: $$...$$, $...$, ~~strikethrough~~, [illegible]. */
export function InlineContent({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|~~([^~]+?)~~|\[illegible\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[1] !== undefined) {
      // Display math $$...$$
      parts.push(
        <span
          key={`m${match.index}`}
          className="inline-block align-middle"
          dangerouslySetInnerHTML={{ __html: renderKatex(match[1].trim(), true) }}
        />
      );
    } else if (match[2] !== undefined) {
      // Inline math $...$
      parts.push(
        <span
          key={`m${match.index}`}
          dangerouslySetInnerHTML={{ __html: renderKatex(match[2], false) }}
        />
      );
    } else if (match[3] !== undefined) {
      // Strikethrough ~~...~~
      parts.push(
        <span
          key={`s${match.index}`}
          className="line-through text-slate-400 decoration-red-400 decoration-2"
          title="Crossed out by student"
        >
          <InlineContent text={match[3]} />
        </span>
      );
    } else {
      // [illegible]
      parts.push(
        <span
          key={`il${match.index}`}
          className="italic text-amber-500 text-[11px] font-semibold"
          title="Illegible handwriting"
        >
          [illegible]
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

// ── RenderedText ───────────────────────────────────────────────────────────────

/** Render multi-line OCR text with heading support and inline math/markup. */
export function RenderedText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div
      className="text-[13px] text-slate-800 leading-[1.85]"
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      {lines.map((line, i) => {
        const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const content = headerMatch[2];
          const cls =
            level === 1 ? 'text-[15px] font-extrabold text-slate-800 mt-4 mb-1' :
            level === 2 ? 'text-[13px] font-extrabold text-slate-700 mt-3 mb-1 pb-0.5 border-b border-slate-200' :
                          'text-[12px] font-bold text-slate-700 mt-2 mb-0.5';
          return (
            <div key={i} className={cls}>
              <InlineContent text={content} />
            </div>
          );
        }

        if (!line.trim()) return <div key={i} className="h-2" />;

        return (
          <div key={i} className="whitespace-pre-wrap">
            <InlineContent text={line} />
          </div>
        );
      })}
    </div>
  );
}