import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import PageHeader from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoStatusTone, deviceStatusTone } from "@/lib/utils/status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: { id: string };
};

type HospitalRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  zone: string | null;
  subregion: string | null;
  latitude: number | null;
  longitude: number | null;
  devices_deployed: number | null;
  engineers_assigned: number | null;
};

type DeviceRow = {
  id: string;
  serial_number: string;
  usage_type: string;
  status: string;
  demo_status: string | null;
  device_model?: { model_name: string | null } | null;
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function EngineerHospitalDetailPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: hospital } = await supabase
    .from("hospital_overview")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!hospital) {
    notFound();
  }

  const { data: hospitalDevices } = await supabase
    .from("devices")
    .select("id, serial_number, usage_type, status, demo_status, device_model:device_model_id(model_name)")
    .eq("current_hospital_id", params.id)
    .order("serial_number", { ascending: true });

  const devices = (hospitalDevices ?? []).map((device: any) => ({
    ...device,
    device_model: normalizeRelation(device.device_model),
  })) as DeviceRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Engineer"
        title={hospital.name}
        description={`${hospital.address}, ${hospital.city} · Zone ${hospital.zone}${hospital.subregion ? ` · ${hospital.subregion}` : ""}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_22px_55px_rgba(2,6,23,0.55)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Site Summary
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">
            {hospital.devices_deployed ?? 0} devices deployed
          </p>
          <p className="text-sm text-slate-400">
            {hospital.engineers_assigned ?? 0} engineers assigned
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_22px_55px_rgba(2,6,23,0.55)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Zone coverage
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{hospital.zone}</p>
          <Badge tone="brand">Active</Badge>
        </div>
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_22px_55px_rgba(2,6,23,0.55)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            GPS Coordinates
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-100">
            {hospital.latitude ?? "-"}, {hospital.longitude ?? "-"}
          </p>
          <p className="text-sm text-slate-400">Lat / Long</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Serial</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Demo Status</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell className="font-medium text-slate-100">
                {device.serial_number}
              </TableCell>
              <TableCell>{device.device_model?.model_name ?? "-"}</TableCell>
              <TableCell>
                <Badge tone={deviceStatusTone(device.status)}>{device.status}</Badge>
              </TableCell>
              <TableCell>{device.usage_type}</TableCell>
              <TableCell>
                {device.demo_status ? (
                  <Badge tone={demoStatusTone(device.demo_status ?? undefined)}>
                    {device.demo_status}
                  </Badge>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <Button asChild variant="secondary">
                  <Link href={`/engineer/devices/${device.id}`}>View Device</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
