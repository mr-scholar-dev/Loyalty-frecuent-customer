"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

interface TokenCopyProps {
  token: string;
}

/**
 * Shows the card token below the QR so it can be copied and pasted into the
 * scan console when scanning isn't possible (§10 Flujo C). Falls back to the
 * text being selectable when the Clipboard API is unavailable.
 */
export function TokenCopy({ token }: TokenCopyProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (old browser / blocked) — select the token so
      // the user can copy it manually.
      const node = codeRef.current;
      const selection = window.getSelection();
      if (node && selection) {
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  return (
    <div className="w-full space-y-1.5">
      <p className="text-center text-[11px] text-slate-500">
        ¿No puedes escanear? Copia el código y díctalo o pégalo:
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left"
        aria-label="Copiar código de la tarjeta"
      >
        <code
          ref={codeRef}
          className="min-w-0 flex-1 select-all truncate font-mono text-xs text-slate-700"
        >
          {token}
        </code>
        {copied ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
            <Check className="h-3.5 w-3.5" aria-hidden /> Copiado
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500">
            <Copy className="h-3.5 w-3.5" aria-hidden /> Copiar
          </span>
        )}
      </button>
    </div>
  );
}
