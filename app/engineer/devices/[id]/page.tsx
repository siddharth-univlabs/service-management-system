import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import PageHeader from "@/components/layout/page-header";
import { demoStatusTone, deviceStatusTone } from "@/lib/utils/status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: { id: string };
};

type DeviceRow = {
  id: string;
  serial_number: string;
  ownership_type: string;
  usage_type: string;
  status: string;
  demo_status: string | null;
  demo_last_used_at: string | null;
  current_location_type: string;
  current_hospital?: { name: string | null } | null;
  current_warehouse?: { name: string | null } | null;
  device_model?: {
    model_name: string | null;
    device_category?: { name: string | null } | null;
  } | null;
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function EngineerDeviceDetailPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: device } = await supabase
    .from("devices")
    .select(
      "id, serial_number, ownership_type, usage_type, status, demo_status, demo_last_used_at, current_location_type, current_hospital:current_hospital_id(name), current_warehouse:current_warehouse_id(name), device_model:device_model_id(model_name, device_category:category_id(name))"
    )
    .eq("id", params.id)
    .single();

  if (!device) {
    notFound();
  }

  const row = {
    ...device,
    current_hospital: normalizeRelation((device as any).current_hospital),
    current_warehouse: normalizeRelation((device as any).current_warehouse),
    device_model: normalizeRelation((device as any).device_model),
  } as DeviceRow;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Engineer"
        title={row.serial_number}
        description={`${row.device_model?.model_name ?? "-"} · ${row.device_model?.device_category?.name ?? "-"}`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_22px_55px_rgba(2,6,23,0.55)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Device Overview
          </h3>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Ownership</span>
              <span className="font-medium text-slate-100">{row.ownership_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Usage type</span>
              <span className="font-medium text-slate-100">{row.usage_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge tone={deviceStatusTone(row.status)}>{row.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Location</span>
              <span className="font-medium text-slate-100">
                {row.current_location_type === "HOSPITAL"
                  ? row.current_hospital?.name ?? "Hospital"
                  : row.current_warehouse?.name ?? "Warehouse"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_22px_55px_rgba(2,6,23,0.55)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Demo Tracking
          </h3>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Demo status</span>
              <Badge tone={demoStatusTone(row.demo_status ?? undefined)}>
                {row.demo_status ?? "-"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Last used</span>
              <span className="font-medium text-slate-100">
                {row.demo_last_used_at?.slice(0, 10) ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Assigned hospital</span>
              <span className="font-medium text-slate-100">
                {row.current_hospital?.name ?? "Warehouse"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
