"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const LIGHT_COLORS = ['#0ea5e9', '#2dd4bf', '#8b5cf6', '#f43f5e', '#f59e0b', '#84cc16'];
const DARK_COLORS = ['#38bdf8', '#2dd4bf', '#a78bfa', '#fb7185', '#fbbf24', '#a3e635'];

export default function DemoRegionChart({ data }: { data: { name: string; value: number }[] }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[250px] w-full animate-pulse bg-surface-muted/20 rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-muted">
        No demo devices deployed
      </div>
    );
  }

  const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'var(--border)', 
              borderRadius: '8px',
              color: 'var(--foreground)'
            }}
            itemStyle={{ color: 'var(--foreground)' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
