import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-800/70 bg-slate-950/70 shadow-[0_24px_60px_rgba(2,6,23,0.65)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700/80 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

type CardSectionProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={`border-b border-slate-800/70 px-6 py-4 ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardSectionProps) {
  return (
    <h3
      className={`text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 ${className ?? ""}`}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardSectionProps) {
  return <div className={`px-6 py-5 ${className ?? ""}`}>{children}</div>;
}

export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={`border-t border-slate-800/70 px-6 py-4 ${className ?? ""}`}>
      {children}
    </div>
  );
}
