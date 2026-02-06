import { createSupabaseServerClient } from "@/lib/supabase/server";
import DemoManagementClient from "./demo-management-client";

type DemoSummary = {
  in_use: number;
  idle_deployed: number;
  returned: number;
  last_used_at: string | null;
};

type DemoDeviceRow = {
  id: string;
  serial_number: string;
  status: string;
  demo_status: string | null;
  demo_last_used_at: string | null;
  demo_assigned_hospital?: { name: string | null } | null;
  current_location_type?: string | null;
  current_hospital_id?: string | null;
  current_hospital?: { name: string | null } | null;
  device_model?: {
    id: string;
    model_name: string | null;
    device_category?: { name: string | null } | null;
  } | null;
};

type MovementRow = {
  id: string;
  moved_at: string | null;
  reason: string | null;
  device?: { serial_number: string | null } | null;
  from_hospital?: { name: string | null } | null;
  to_hospital?: { name: string | null } | null;
  from_warehouse?: { name: string | null } | null;
  to_warehouse?: { name: string | null } | null;
};

type HospitalRow = {
  id: string;
  region_id: string;
  name: string;
  subregion: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
};

type DeviceModelRow = {
  id: string;
  model_name: string | null;
  category_name: string | null;
};

type DemoSessionRow = {
  id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  owner_profile_id: string | null;
  owner?: { user_id: string; full_name: string | null } | { user_id: string; full_name: string | null }[] | null;
  hospital?: { name: string | null } | { name: string | null }[] | null;
  demo_session_devices?: {
    device?:
      | { id: string; serial_number: string | null; demo_status: string | null }
      | { id: string; serial_number: string | null; demo_status: string | null }[]
      | null;
  }[] | null;
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function DemoManagementPage() {
  const supabase = await createSupabaseServerClient();
  const [
    summaryResult,
    deviceResult,
    movementResult,
    hospitalResult,
    categoryResult,
    sessionResult,
    modelResult,
    teamResult,
    regionalManagerResult,
    fieldEngineerResult,
  ] = await Promise.all([
    supabase.from("demo_summary").select("*").single(),
    supabase
      .from("devices")
      .select(
        "id, serial_number, status, demo_status, demo_last_used_at, current_location_type, current_hospital_id, current_hospital:current_hospital_id(name), demo_assigned_hospital:demo_assigned_hospital_id(name), device_model:device_model_id(id, model_name, device_category:category_id(name))"
      )
      .eq("usage_type", "DEMO")
      .order("serial_number", { ascending: true }),
    supabase
      .from("device_movements")
      .select(
        "id, moved_at, reason, device:device_id(serial_number), from_hospital:from_hospital_id(name), to_hospital:to_hospital_id(name), from_warehouse:from_warehouse_id(name), to_warehouse:to_warehouse_id(name)"
      )
      .order("moved_at", { ascending: false })
      .limit(10),
    supabase.from("hospital_overview").select("id, region_id, name, subregion").order("name"),
    supabase.from("device_categories").select("id, name").order("name"),
    supabase
      .from("demo_sessions")
      .select(
        "id, start_date, end_date, created_at, owner_profile_id, owner:owner_profile_id(user_id, full_name), hospital:hospital_id(name), demo_session_devices:demo_session_devices(device:device_id(id, serial_number, demo_status))"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("device_models")
      .select("id, model_name, category:category_id(name)")
      .order("model_name", { ascending: true }),
    supabase
      .from("profiles")
      .select("user_id, full_name, role, is_active, approval_status")
      .neq("role", "ADMIN")
      .eq("is_active", true),
    supabase.from("regional_managers").select("user_id, region_id"),
    supabase.from("field_engineers").select("user_id, regional_manager_id"),
  ]);

  const summary =
    (summaryResult.data as DemoSummary | null) ??
    ({
      in_use: 0,
      idle_deployed: 0,
      returned: 0,
      last_used_at: null,
    } satisfies DemoSummary);

  const demoDevices: DemoDeviceRow[] = (deviceResult.data ?? []).map((device: any) => {
    const deviceModel = normalizeRelation(device.device_model) as DemoDeviceRow["device_model"];
    const deviceCategory = deviceModel
      ? normalizeRelation(deviceModel.device_category)
      : null;

    return {
      id: device.id,
      serial_number: device.serial_number,
      status: device.status,
      demo_status: device.demo_status,
      demo_last_used_at: device.demo_last_used_at,
      current_location_type: device.current_location_type ?? null,
      current_hospital_id: device.current_hospital_id ?? null,
      current_hospital: normalizeRelation(device.current_hospital),
      demo_assigned_hospital: normalizeRelation(device.demo_assigned_hospital),
      device_model: deviceModel
        ? {
            ...deviceModel,
            device_category: deviceCategory,
          }
        : null,
    };
    }
  );
  const demoMovements: MovementRow[] = (movementResult.data ?? []).map(
    (movement: any) => ({
      id: movement.id,
      moved_at: movement.moved_at,
      reason: movement.reason,
      device: normalizeRelation(movement.device),
      from_hospital: normalizeRelation(movement.from_hospital),
      to_hospital: normalizeRelation(movement.to_hospital),
      from_warehouse: normalizeRelation(movement.from_warehouse),
      to_warehouse: normalizeRelation(movement.to_warehouse),
    })
  );
  const hospitals = (hospitalResult.data ?? []) as HospitalRow[];
  const categories = (categoryResult.data ?? []) as CategoryRow[];
  const models = (modelResult.data ?? []).map((model: any) => {
    const category = normalizeRelation(model.category) as { name: string | null } | null;
    return {
      id: model.id,
      model_name: model.model_name,
      category_name: category?.name ?? null,
    } satisfies DeviceModelRow;
  });
  const demoSessions = (sessionResult.data ?? []).map((session: DemoSessionRow) => {
    const devices = (session.demo_session_devices ?? [])
      .map((entry) => normalizeRelation(entry.device))
      .filter(Boolean)
      .map((device) => ({
        id: device!.id,
        serial_number: device!.serial_number,
        demo_status: device!.demo_status,
      }));

    return {
      id: session.id,
      start_date: session.start_date,
      end_date: session.end_date,
      created_at: session.created_at,
      owner_profile_id: session.owner_profile_id,
      owner: normalizeRelation(session.owner),
      hospital: normalizeRelation(session.hospital),
      devices,
    };
  });

  const teamMembers = ((teamResult.data ?? []) as any[])
    .filter((profile) => profile.approval_status !== "REJECTED")
    .map((profile) => ({
      user_id: profile.user_id as string,
      full_name: (profile.full_name as string | null) ?? null,
    }));

  const regionalManagers = (regionalManagerResult.data ?? []) as {
    user_id: string;
    region_id: string;
  }[];
  const fieldEngineers = (fieldEngineerResult.data ?? []) as {
    user_id: string;
    regional_manager_id: string;
  }[];

  const regionMemberIdsByRegionId = regionalManagers.reduce<Record<string, string[]>>(
    (acc, manager) => {
      const memberIds = new Set<string>();
      memberIds.add(manager.user_id);
      fieldEngineers
        .filter((engineer) => engineer.regional_manager_id === manager.user_id)
        .forEach((engineer) => memberIds.add(engineer.user_id));
      acc[manager.region_id] = Array.from(memberIds);
      return acc;
    },
    {}
  );

  return (
    <DemoManagementClient
      summary={summary}
      demoDevices={demoDevices}
      demoMovements={demoMovements}
      hospitals={hospitals}
      categories={categories}
      models={models}
      demoSessions={demoSessions}
      teamMembers={teamMembers}
      regionMemberIdsByRegionId={regionMemberIdsByRegionId}
    />
  );
}
