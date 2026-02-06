import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/70 px-6 py-6 shadow-[0_26px_60px_rgba(2,6,23,0.6)] backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
