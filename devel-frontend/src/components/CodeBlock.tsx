import { useRef, useEffect, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ children }: { children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(preRef.current?.textContent ?? "");
    setCopied(true);
  }

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="relative">
      <pre ref={preRef}>{children}</pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-2 right-2 rounded bg-white/10 p-1.5 text-zinc-300 hover:bg-white/20"
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
