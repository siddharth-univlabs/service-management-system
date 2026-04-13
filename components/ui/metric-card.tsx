import React from "react";

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
};

export default function MetricCard({
  label,
  value,
  helper,
  trend,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">{label}</h3>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold tracking-tight text-foreground font-display">
            {value}
          </span>
          {trend ? (
            <span
              className={`text-sm font-medium ${
                trend.direction === "up"
                  ? "text-brand"
                  : trend.direction === "down"
                    ? "text-critical"
                    : "text-muted"
              }`}
            >
              {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}{" "}
              {trend.value}
            </span>
          ) : null}
        </div>
        {helper ? (
          <p className="text-xs text-muted leading-relaxed mt-1">
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  );
}
