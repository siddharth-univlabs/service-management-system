import type { ReactNode } from "react";

type TableProps = {
  children: ReactNode;
  className?: string;
};

export function Table({ children, className }: TableProps) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70 shadow-[0_24px_60px_rgba(2,6,23,0.6)] ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-200">{children}</table>
      </div>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </th>
  );
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={`border-t border-slate-800/70 transition-colors hover:bg-slate-900/60 ${className ?? ""}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`px-6 py-4 text-sm text-slate-200 ${className ?? ""}`}
    >
      {children}
    </td>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-900/70 text-slate-400">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}
