import type { ReactNode } from "react";
import { Card } from "./card";

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
};

export default function MetricCard({ label, value, helper, icon }: MetricCardProps) {
  return (
    <Card className="flex h-full flex-col gap-4 px-6 py-5">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span>{label}</span>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>
      <div>
        <p className="text-3xl font-semibold text-slate-100">{value}</p>
        {helper ? <p className="text-sm text-slate-400">{helper}</p> : null}
      </div>
    </Card>
  );
}
