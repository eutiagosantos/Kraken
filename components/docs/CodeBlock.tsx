"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
};

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [code]);

  return (
    <div className={cn("relative group", className)}>
      {language ? (
        <span className="absolute left-3 top-2.5 z-10 text-[10px] font-medium uppercase tracking-wider text-white/40">
          {language}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onCopy}
        className="absolute right-2 top-2 z-10 rounded-btn border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80 opacity-0 transition hover:bg-white/10 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copiar código"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
      <pre
        className={cn(
          "overflow-x-auto rounded-card bg-neutral-black p-4 pt-8 text-sm leading-relaxed text-white/90",
          language && "pt-10"
        )}
      >
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
