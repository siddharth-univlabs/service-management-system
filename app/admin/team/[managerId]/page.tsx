import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/layout/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TeamDetails from "./team-details";

type PageProps = {
  params: { managerId: string };
};

type ManagerRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
};

type EngineerRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
};

type AssignmentRow = {
  engineer_id: string;
  hospital?: { id: string; name: string; city: string | null; zone: string | null } | null;
};

type DeviceRow = {
  id: string;
  serial_number: string;
  status: string;
  usage_type: string;
  current_hospital_id: string | null;
  device_model?: { model_name: string | null } | null;
};

type Hospital = {
  id: string;
  name: string;
  city: string | null;
  zone: string | null;
  devices: DeviceRow[];
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function ManagerTeamPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: manager } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone, is_active")
    .eq("user_id", params.managerId)
    .single();

  if (!manager) {
    notFound();
  }

  const { data: engineers } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone, is_active")
    .eq("manager_id", params.managerId)
    .eq("role", "FIELD_ENGINEER")
    .order("full_name");

  const engineerRows = (engineers ?? []) as EngineerRow[];
  const engineerIds = engineerRows.map((row) => row.user_id);

  const assignmentResult = await (engineerIds.length
    ? supabase
        .from("engineer_hospitals")
        .select("engineer_id, hospital:hospital_id(id, name, city, zone)")
        .in("engineer_id", engineerIds)
    : Promise.resolve({ data: [] }));
  const assignments = (assignmentResult.data ?? []).map((assignment: any) => ({
    ...assignment,
    hospital: normalizeRelation(assignment.hospital),
  })) as AssignmentRow[];

  const hospitalMap = new Map<string, Hospital>();
  const engineerHospitalMap = new Map<string, string[]>();

  assignments.forEach((assignment) => {
    if (!assignment.hospital) {
      return;
    }
    const hospitalId = assignment.hospital.id;
    if (!hospitalMap.has(hospitalId)) {
      hospitalMap.set(hospitalId, {
        ...assignment.hospital,
        devices: [],
      });
    }
    const list = engineerHospitalMap.get(assignment.engineer_id) ?? [];
    if (!list.includes(hospitalId)) {
      list.push(hospitalId);
    }
    engineerHospitalMap.set(assignment.engineer_id, list);
  });

  const hospitalIds = Array.from(hospitalMap.keys());
  if (hospitalIds.length) {
    const { data: devices } = await supabase
      .from("devices")
      .select(
        "id, serial_number, status, usage_type, current_hospital_id, device_model:device_model_id(model_name)"
      )
      .in("current_hospital_id", hospitalIds);

    (devices ?? []).forEach((device: any) => {
      const row = {
        ...device,
        device_model: normalizeRelation(device.device_model),
      } as DeviceRow;
      if (!row.current_hospital_id) {
        return;
      }
      const hospital = hospitalMap.get(row.current_hospital_id);
      if (hospital) {
        hospital.devices.push(row);
      }
    });
  }

  const engineerDetails = engineerRows.map((engineer) => {
    const assignedHospitalIds = engineerHospitalMap.get(engineer.user_id) ?? [];
    const hospitals = assignedHospitalIds
      .map((id) => hospitalMap.get(id))
      .filter((hospital): hospital is Hospital => Boolean(hospital));

    return {
      ...engineer,
      hospitalCount: hospitals.length,
      hospitals,
    };
  });

  const managerRow = manager as ManagerRow;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={managerRow.full_name ?? "Regional Manager"}
        description="Engineer roster, ticket history, and hospital coverage for this manager."
        actions={
          <Button asChild variant="secondary">
            <Link href="/admin/team">Back to Team</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Manager Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Name</span>
              <span className="font-semibold text-slate-100">
                {managerRow.full_name ?? "Regional Manager"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Phone</span>
              <span className="font-semibold text-slate-100">
                {managerRow.phone ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge tone={managerRow.is_active ? "success" : "warning"}>
                {managerRow.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Engineers</span>
              <span className="font-semibold text-slate-100">
                {engineerDetails.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hospitals assigned</span>
              <span className="font-semibold text-slate-100">
                {engineerDetails.reduce((acc, engineer) => acc + engineer.hospitalCount, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>Manage team members, assignments, and access status.</p>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/admin/team">Edit assignments</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-100">Engineers under this manager</h3>
        {engineerDetails.length ? (
          <TeamDetails engineers={engineerDetails} />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-800/70 p-6 text-sm text-slate-400">
            No engineers assigned to this manager yet.
          </div>
        )}
      </section>
    </div>
  );
}
