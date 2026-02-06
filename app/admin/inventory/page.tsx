import MetricCard from "@/components/ui/metric-card";
import PageHeader from "@/components/layout/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import InventoryClient from "./inventory-client";

type InventorySummary = {
  total_devices: number;
  in_inventory: number;
  deployed: number;
  demo_deployed: number;
  sold_deployed: number;
};

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

type ModelDetailRow = {
  id: string;
  model_name: string;
  model_code: string | null;
  manufacturer: string | null;
  description: string | null;
  category: { name: string | null } | { name: string | null }[] | null;
};

export default async function InventoryPage() {
  const supabase = await createSupabaseServerClient();
  const [summaryResult, modelResult, modelDetailsResult] = await Promise.all([
    supabase.from("inventory_summary").select("*").single(),
    supabase
      .from("inventory_by_model")
      .select("*")
      .order("model_name", { ascending: true }),
    supabase
      .from("device_models")
      .select("id, model_name, model_code, manufacturer, description, category:category_id(name)")
      .order("model_name", { ascending: true }),
  ]);

  const summary =
    (summaryResult.data as InventorySummary | null) ??
    ({
      total_devices: 0,
      in_inventory: 0,
      deployed: 0,
      demo_deployed: 0,
      sold_deployed: 0,
    } satisfies InventorySummary);

  const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return value ?? null;
  };

  const modelDetails = (modelDetailsResult.data ?? []) as ModelDetailRow[];
  const modelDetailMap = new Map(
    modelDetails.map((detail) => [detail.id, detail])
  );

  const rows: InventoryModelRow[] = (modelResult.data ?? []).map((row: any) => {
    const detail = modelDetailMap.get(row.model_id);
    return {
      model_id: row.model_id,
      model_name: detail?.model_name ?? row.model_name,
      category:
        normalizeRelation(detail?.category)?.name ?? row.category ?? "Uncategorized",
      total: row.total,
      in_inventory: row.in_inventory,
      deployed: row.deployed,
      demo_deployed: row.demo_deployed,
      sold_deployed: row.sold_deployed,
      model_code: detail?.model_code ?? null,
      manufacturer: detail?.manufacturer ?? null,
      description: detail?.description ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Inventory Insights"
        description="Monitor model-level availability and deployed inventory mix across hospitals."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Devices"
          value={summary.total_devices.toString()}
          helper="Across every model"
        />
        <MetricCard
          label="In Inventory"
          value={summary.in_inventory.toString()}
          helper="Available for deployment"
        />
        <MetricCard
          label="Demo Deployed"
          value={summary.demo_deployed.toString()}
          helper="Active demo fleet"
        />
        <MetricCard
          label="Sold Deployed"
          value={summary.sold_deployed.toString()}
          helper="Customer-owned units"
        />
      </section>

      <InventoryClient rows={rows} />
    </div>
  );
}
