"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type InventoryModelRow = {
  model_id: string;
  model_name: string;
  category: string;
  total: number;
  in_inventory: number;
  deployed: number;
  demo_deployed: number;
  sold_deployed: number;
  model_code: string | null;
  manufacturer: string | null;
  description: string | null;
};

type InventoryClientProps = {
  rows: InventoryModelRow[];
};

export default function InventoryClient({ rows }: InventoryClientProps) {
  const [currentRows, setCurrentRows] = useState(rows);

  const grouped = useMemo(() => {
    return currentRows.reduce<Record<string, InventoryModelRow[]>>((acc, row) => {
      const key = row.category || "Uncategorized";
      acc[key] = acc[key] ?? [];
      acc[key].push(row);
      return acc;
    }, {});
  }, [currentRows]);

  const categories = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  if (!currentRows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
        No inventory data yet. Add device models and devices to populate the view.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <section
          key={category}
          className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.45)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Category
              </p>
              <h3 className="text-2xl font-semibold text-slate-100">
                {category}
              </h3>
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {grouped[category].length} models
            </div>
          </div>
          <div className="mt-5">
            <Table className="bg-slate-950/70 shadow-none">
              <TableHeader>
                <tr>
                  <TableHead>SKU / Model</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>In Inventory</TableHead>
                  <TableHead>Deployed</TableHead>
                  <TableHead>Demo</TableHead>
                  <TableHead>Sold</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {grouped[category].map((model) => (
                  <TableRow key={model.model_id}>
                    <TableCell className="font-medium text-slate-100">
                      <Link
                        href={`/admin/inventory/${model.model_id}`}
                        className="text-slate-100 underline-offset-4 hover:underline"
                      >
                        {model.model_name}
                      </Link>
                    </TableCell>
                    <TableCell>{model.total}</TableCell>
                    <TableCell>{model.in_inventory}</TableCell>
                    <TableCell>{model.deployed}</TableCell>
                    <TableCell>{model.demo_deployed}</TableCell>
                    <TableCell>{model.sold_deployed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
  );
}
