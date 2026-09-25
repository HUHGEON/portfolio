"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Copies the address to the clipboard so a reader doesn't have to select it by hand. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={`${email} 복사`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // clipboard blocked (http, permissions) — the address stays selectable
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-[12px] text-[var(--faint)] transition hover:border-[var(--accent-line)] hover:text-[var(--accent)]"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "복사됨" : "복사"}
    </button>
  );
}
