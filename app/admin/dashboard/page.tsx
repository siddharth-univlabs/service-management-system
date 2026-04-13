import Link from "next/link";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricCard from "@/components/ui/metric-card";
import PageHeader from "@/components/layout/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DemoRegionChart from "@/components/ui/demo-region-chart";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  
  // Custom query to get demo devices grouped by region directly
  const { data: demoByRegionData } = await supabase
    .from("devices")
    .select(`
      id,
      hospitals!inner (
        regions!inner (
          name
        )
      )
    `)
    .eq("usage_type", "DEMO")
    .eq("status", "DEPLOYED");

  // Transform data for the pie chart
  const regionCounts: Record<string, number> = {};
  if (demoByRegionData) {
    demoByRegionData.forEach((device: any) => {
      const regionName = device.hospitals?.regions?.name;
      if (regionName) {
        regionCounts[regionName] = (regionCounts[regionName] || 0) + 1;
      }
    });
  }

  const chartData = Object.entries(regionCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort by value descending

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
            <p className="text-sm text-muted">
              Track asset distribution and capacity by deployment state.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground">
            <div className="flex items-center justify-between">
              <span className="text-muted">In inventory</span>
              <span className="font-semibold">
                {inventoryMetrics.in_inventory}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Deployed</span>
              <span className="font-semibold">
                {inventoryMetrics.deployed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Under service</span>
              <span className="font-semibold">
                {inventoryMetrics.under_service}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Scrapped</span>
              <span className="font-semibold">
                {inventoryMetrics.scrapped}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo Fleet by Region</CardTitle>
            <p className="text-sm text-muted">
              Active demo deployments across operational zones.
            </p>
          </CardHeader>
          <CardContent>
            <DemoRegionChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo Fleet Activity</CardTitle>
            <p className="text-sm text-muted">
              Live demo device utilization and last movement signals.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground">
            <div className="flex items-center justify-between">
              <span className="text-muted">In use</span>
              <span className="font-semibold">{demoMetrics.in_use}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Idle deployed</span>
              <span className="font-semibold">{demoMetrics.idle_deployed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Returned</span>
              <span className="font-semibold">{demoMetrics.returned}</span>
            </div>
            <div className="rounded-xl bg-surface-muted/50 px-4 py-3 mt-4 text-xs font-medium text-muted text-center">
              Last movement: {demoMetrics.last_used_at ?? "-"}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
