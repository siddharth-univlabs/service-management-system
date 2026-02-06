import Link from "next/link";
import Button from "@/components/ui/button";
import PageHeader from "@/components/layout/page-header";
import MetricCard from "@/components/ui/metric-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type HospitalRow = {
  id: string;
  name: string;
  city: string | null;
  zone: string | null;
  subregion: string | null;
  devices_deployed: number | null;
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function EngineerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? "Service Engineer";

  const [hospitalResult] = await Promise.all([
    supabase.from("hospital_overview").select("*").order("name"),
  ]);

  const assignedHospitals = (hospitalResult.data ?? []) as HospitalRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Engineer"
        title={`Welcome, ${displayName}`}
        description="Monitor assigned hospitals and your active service coverage."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Assigned Hospitals"
          value={assignedHospitals.length.toString()}
          helper="Active service coverage"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Assigned Hospitals</h3>
          <Button variant="secondary">View All</Button>
        </div>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Hospital</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Subregion</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {assignedHospitals.map((hospital) => (
              <TableRow key={hospital.id}>
                <TableCell className="font-medium text-slate-100">
                  {hospital.name}
                </TableCell>
                <TableCell>{hospital.zone}</TableCell>
                <TableCell>{hospital.subregion ?? "-"}</TableCell>
                <TableCell>{hospital.city}</TableCell>
                <TableCell>{hospital.devices_deployed ?? 0}</TableCell>
                <TableCell>
                  <Button asChild variant="secondary">
                    <Link href={`/engineer/hospitals/${hospital.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
