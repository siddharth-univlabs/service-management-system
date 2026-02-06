import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import PageHeader from "@/components/layout/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import InventoryModelDevicesClient from "./model-devices-client";

type PageProps = {
  params: Promise<{ modelId: string }>;
};

type ModelRow = {
  id: string;
  model_name: string;
  model_code: string | null;
  manufacturer: string | null;
  description: string | null;
  category?: { name: string | null } | { name: string | null }[] | null;
};

type DeviceRow = {
  id: string;
  serial_number: string;
  barcode: string | null;
  ownership_type: string;
  usage_type: string;
  status: string;
  current_location_type: string;
  current_hospital_id?: string | null;
  current_warehouse_id?: string | null;
  current_hospital?: { name: string | null } | { name: string | null }[] | null;
  current_warehouse?: { name: string | null } | { name: string | null }[] | null;
  demo_status: string | null;
};

type WarehouseRow = {
  id: string;
  name: string;
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function InventoryModelPage({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = await createSupabaseServerClient();

  const [modelResult, deviceResult, warehouseResult] = await Promise.all([
    supabase
      .from("device_models")
      .select("id, model_name, model_code, manufacturer, description, category:category_id(name)")
      .eq("id", resolvedParams.modelId)
      .single(),
    supabase
      .from("devices")
      .select(
        "id, serial_number, barcode, ownership_type, usage_type, status, current_location_type, current_hospital_id, current_warehouse_id, demo_status, current_hospital:current_hospital_id(name), current_warehouse:current_warehouse_id(name)"
      )
      .eq("device_model_id", resolvedParams.modelId)
      .order("serial_number", { ascending: true }),
    supabase.from("warehouses").select("id, name").order("name", { ascending: true }),
  ]);

  if (modelResult.error || !modelResult.data) {
    notFound();
  }

  const model = modelResult.data as ModelRow;
  const categoryName = normalizeRelation(model.category)?.name ?? null;
  const devices: DeviceRow[] = (deviceResult.data ?? []) as any;
  const warehouses: WarehouseRow[] = (warehouseResult.data ?? []) as WarehouseRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Inventory"
        description="Add serialized devices and review units for this model."
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/inventory">Back to inventory</Link>
          </Button>
        }
      />

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 px-6 py-5 shadow-[0_20px_50px_rgba(2,6,23,0.5)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Model
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-100">{model.model_name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
              {categoryName ? <span>Category: {categoryName}</span> : null}
              {model.model_code ? (
                <Badge tone="neutral">{model.model_code}</Badge>
              ) : null}
              {model.manufacturer ? <span>Manufacturer: {model.manufacturer}</span> : null}
            </div>
          </div>

          <div className="text-right text-sm text-slate-400">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Total units
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-100">{devices.length}</div>
          </div>
        </div>
      </section>

      <InventoryModelDevicesClient
        modelId={model.id}
        modelName={model.model_name}
        devices={devices.map((device: any) => ({
          id: device.id,
          serial_number: device.serial_number,
          barcode: device.barcode ?? null,
          ownership_type: device.ownership_type,
          usage_type: device.usage_type,
          status: device.status,
          current_location_type: device.current_location_type,
          current_hospital_id: device.current_hospital_id ?? null,
          current_warehouse_id: device.current_warehouse_id ?? null,
          current_hospital: normalizeRelation(device.current_hospital),
          current_warehouse: normalizeRelation(device.current_warehouse),
          demo_status: device.demo_status ?? null,
        }))}
        warehouses={warehouses}
      />
    </div>
  );
}
