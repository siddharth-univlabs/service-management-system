import Link from "next/link";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricCard from "@/components/ui/metric-card";
import PageHeader from "@/components/layout/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const [inventoryResult, demoResult] = await Promise.all([
    supabase.from("inventory_summary").select("*").single(),
    supabase.from("demo_summary").select("*").single(),
  ]);

  const inventoryMetrics = inventoryResult.data ?? {
    total_devices: 0,
    in_inventory: 0,
    deployed: 0,
    under_service: 0,
    scrapped: 0,
    demo_deployed: 0,
    sold_deployed: 0,
  };

  const demoMetrics = demoResult.data ?? {
    in_use: 0,
    idle_deployed: 0,
    returned: 0,
    last_used_at: null,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Operations Overview"
        description="Monitor fleet health, demo utilization, and service demand across every hospital."
        actions={
          <>
            <Button variant="secondary">Download Report</Button>
            <Button asChild>
              <Link href="/admin/hospitals">New Hospital</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Assets"
          value={inventoryMetrics.total_devices.toString()}
          helper="Serialized devices across all models"
        />
        <MetricCard
          label="In Inventory"
          value={inventoryMetrics.in_inventory.toString()}
          helper="Available in warehouses"
        />
        <MetricCard
          label="Deployed"
          value={inventoryMetrics.deployed.toString()}
          helper={`${inventoryMetrics.demo_deployed} demo, ${inventoryMetrics.sold_deployed} sold`}
        />
        <MetricCard
          label="Under Service"
          value={inventoryMetrics.under_service.toString()}
          helper="Active repair cases"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Health</CardTitle>
            <p className="text-sm text-slate-400">
              Track asset distribution and capacity by deployment state.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>In inventory</span>
              <span className="font-semibold text-slate-100">
                {inventoryMetrics.in_inventory}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Deployed</span>
              <span className="font-semibold text-slate-100">
                {inventoryMetrics.deployed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Under service</span>
              <span className="font-semibold text-slate-100">
                {inventoryMetrics.under_service}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Scrapped</span>
              <span className="font-semibold text-slate-100">
                {inventoryMetrics.scrapped}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo Fleet</CardTitle>
            <p className="text-sm text-slate-400">
              Live demo device utilization and last movement signals.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>In use</span>
              <span className="font-semibold text-slate-100">{demoMetrics.in_use}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Idle deployed</span>
              <span className="font-semibold text-slate-100">{demoMetrics.idle_deployed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Returned</span>
              <span className="font-semibold text-slate-100">{demoMetrics.returned}</span>
            </div>
            <div className="rounded-2xl bg-slate-900/70 px-4 py-3 text-xs text-slate-400">
              Last movement: {demoMetrics.last_used_at ?? "-"}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
