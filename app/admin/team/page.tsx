import Link from "next/link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/layout/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TeamTabsClient from "./team-tabs-client";
import {
  assignEngineerHospital,
  removeEngineerHospital,
  removeRegionalManager,
} from "./actions";

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
  manager_id: string | null;
  is_regional_manager: boolean;
  is_active: boolean;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  role: string | null;
  rejection_reason?: string | null;
};

type HospitalRow = {
  id: string;
  name: string;
  city: string | null;
  zone: string | null;
};

type AssignmentRow = {
  id: string;
  engineer_id: string;
  hospital_id: string;
  engineer?: { user_id: string; full_name: string | null } | null;
  hospital?: { id: string; name: string; city: string | null; zone: string | null } | null;
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function AdminTeamPage() {
  const supabase = await createSupabaseServerClient();
  const [
    managerResult,
    allProfilesResult,
    hospitalResult,
    assignmentResult,
    activeResult,
    pendingResult,
    rejectedResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, full_name, phone, is_active")
      .eq("is_regional_manager", true)
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("profiles")
      .select(
        "user_id, full_name, phone, manager_id, is_regional_manager, is_active, approval_status, role"
      )
      .order("full_name"),
    supabase.from("hospitals").select("id, name, city, zone").order("name"),
    supabase
      .from("engineer_hospitals")
      .select(
        "id, engineer_id, hospital_id, engineer:engineer_id(user_id, full_name), hospital:hospital_id(id, name, city, zone)"
      )
      .order("assigned_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("user_id, full_name, phone, approval_status, role, is_active")
      .eq("approval_status", "APPROVED")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("profiles")
      .select("user_id, full_name, phone, approval_status, role, is_active")
      .eq("approval_status", "PENDING")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("user_id, full_name, phone, approval_status, role, is_active, rejection_reason")
      .eq("approval_status", "REJECTED")
      .order("decision_at", { ascending: false }),
  ]);

  const managers = (managerResult.data ?? []) as ManagerRow[];
  const engineers = (allProfilesResult.data ?? []) as EngineerRow[];
  const hospitals = (hospitalResult.data ?? []) as HospitalRow[];
  const activeMembers = (activeResult.data ?? []) as EngineerRow[];
  const pendingMembers = (pendingResult.data ?? []) as EngineerRow[];
  const rejectedMembers = (rejectedResult.data ?? []) as EngineerRow[];
  const assignments = (assignmentResult.data ?? []).map((assignment: any) => ({
    ...assignment,
    engineer: normalizeRelation(assignment.engineer),
    hospital: normalizeRelation(assignment.hospital),
  })) as AssignmentRow[];

  const managerCounts = engineers.reduce<Record<string, number>>(
    (acc, engineer) => {
      if (!engineer.is_active || !engineer.manager_id) {
        return acc;
      }
      acc[engineer.manager_id] = (acc[engineer.manager_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Team Management"
        description="Review signup requests, assign roles, and manage active team accounts."
      />

      <TeamTabsClient
        activeMembers={activeMembers}
        pendingMembers={pendingMembers}
        rejectedMembers={rejectedMembers}
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">Regional Managers</h3>
            <Badge tone="brand">{managers.length} active</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {managers.map((manager) => (
              <Card key={manager.user_id} className="flex flex-col">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {manager.full_name ?? "Regional Manager"}
                  </CardTitle>
                  <p className="text-base font-semibold text-slate-100">
                    {manager.phone ?? "No phone on record"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {managerCounts[manager.user_id] ?? 0} engineers assigned
                  </p>
                </CardHeader>
                <CardContent className="mt-auto flex items-center gap-3">
                  <Button asChild variant="secondary">
                    <Link href={`/admin/team/${manager.user_id}`}>View Team</Link>
                  </Button>
                  <form action={removeRegionalManager}>
                    <input type="hidden" name="userId" value={manager.user_id} />
                    <Button variant="ghost" type="submit">
                      Remove Manager
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
            {managers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800/70 p-6 text-sm text-slate-400">
                No regional managers yet. Add one using the form on the right.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Engineer Assignments</h3>
            <p className="text-sm text-slate-400">
              Map engineers to hospital coverage areas.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <form action={assignEngineerHospital} className="grid gap-4 md:grid-cols-3">
              <Select label="Engineer" name="engineerId" required>
                <option value="">Select engineer</option>
                {engineers
                  .filter((engineer) => engineer.is_active)
                  .map((engineer) => (
                    <option key={engineer.user_id} value={engineer.user_id}>
                      {engineer.full_name ?? engineer.user_id}
                    </option>
                  ))}
              </Select>
              <Select label="Hospital" name="hospitalId" required>
                <option value="">Select hospital</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </Select>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  Assign hospital
                </Button>
              </div>
            </form>

            {assignments.length ? (
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Engineer</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium text-slate-100">
                        {assignment.engineer?.full_name ?? assignment.engineer_id}
                      </TableCell>
                      <TableCell>{assignment.hospital?.name ?? assignment.hospital_id}</TableCell>
                      <TableCell>
                        {assignment.hospital?.city ?? ""}
                        {assignment.hospital?.zone ? ` · ${assignment.hospital.zone}` : ""}
                      </TableCell>
                      <TableCell>
                        <form action={removeEngineerHospital}>
                          <input type="hidden" name="engineerId" value={assignment.engineer_id} />
                          <input type="hidden" name="hospitalId" value={assignment.hospital_id} />
                          <Button variant="ghost" type="submit">
                            Remove
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-800/70 p-6 text-sm text-slate-400">
                No assignments yet. Add the first hospital assignment above.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
