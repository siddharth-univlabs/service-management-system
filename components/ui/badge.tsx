import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "critical"
  | "brand";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
};

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-slate-900/70 text-slate-200 border-slate-700",
  info: "bg-sky-500/15 text-sky-200 border-sky-500/40",
  success: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
  warning: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  critical: "bg-rose-500/15 text-rose-200 border-rose-500/40",
  brand: "bg-teal-500/15 text-teal-200 border-teal-500/40",
};

export default function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneStyles[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
