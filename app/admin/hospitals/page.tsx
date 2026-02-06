import PageHeader from "@/components/layout/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import HospitalsClient from "./hospitals-client";

type HospitalRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zone: string | null;
  subregion: string | null;
  latitude: number | null;
  longitude: number | null;
  devices_deployed: number | null;
  engineers_assigned: number | null;
};

type HospitalRegionRow = {
  id: string;
  region_id: string | null;
  poc: any;
};

type RegionRow = {
  id: string;
  name: string;
  code: string;
  parent_region_id: string | null;
  is_locked: boolean;
};

type DeviceRow = {
  id: string;
  serial_number: string;
  ownership_type: string;
  usage_type: string;
  status: string;
  current_location_type: string;
  current_hospital_id: string | null;
  current_warehouse_id: string | null;
  device_model?: {
    model_name: string | null;
    device_categories?: { name: string | null } | null;
  } | null;
};

type EngineerOption = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
};

type DeviceOption = {
  id: string;
  serial_number: string;
  ownership_type: string;
  usage_type: string;
  status: string;
  current_location_type: string;
  current_hospital_id: string | null;
  current_warehouse_id: string | null;
  model_name: string | null;
  category_name: string | null;
};

type WarehouseOption = {
  id: string;
  name: string;
};

type EngineerAssignmentRow = {
  hospital_id: string;
  engineer?: { user_id: string; full_name: string | null; phone: string | null; is_active: boolean } | null;
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function HospitalsPage() {
  const supabase = await createSupabaseServerClient();
  const [hospitalResult, hospitalRegionResult, regionResult, deviceResult, assignmentResult, engineerResult, warehouseResult] =
    await Promise.all([
    supabase
      .from("hospital_overview")
      .select("*")
      .order("name", { ascending: true }),
    supabase.from("hospitals").select("id, region_id, poc"),
    supabase
      .from("regions")
      .select("id, name, code, parent_region_id, is_locked")
      .order("name", { ascending: true }),
    supabase
      .from("devices")
      .select(
        "id, serial_number, ownership_type, usage_type, status, current_location_type, current_hospital_id, current_warehouse_id, device_model:device_model_id(model_name, device_categories(name))"
      ),
    supabase
      .from("engineer_hospitals")
      .select(
        "hospital_id, engineer:engineer_id(user_id, full_name, phone, is_active)"
      ),
    supabase
      .from("profiles")
      .select("user_id, full_name, phone, is_active")
      .eq("role", "ENGINEER")
      .order("full_name"),
    supabase.from("warehouses").select("id, name").order("name"),
  ]);

  const rows = (hospitalResult.data ?? []) as HospitalRow[];
  const regionRows = (regionResult.data ?? []) as RegionRow[];
  const hospitalRegions = (hospitalRegionResult.data ?? []) as HospitalRegionRow[];
  const regionIdByHospitalId = hospitalRegions.reduce<Record<string, string | null>>((acc, row) => {
    acc[row.id] = row.region_id;
    return acc;
  }, {});

  const pocByHospitalId = hospitalRegions.reduce<Record<string, any>>((acc, row) => {
    acc[row.id] = row.poc;
    return acc;
  }, {});

  const regionById = regionRows.reduce<Record<string, RegionRow>>((acc, region) => {
    acc[region.id] = region;
    return acc;
  }, {});

  const deriveSubregion = (regionId: string | null) => {
    if (!regionId) return null;
    const region = regionById[regionId];
    if (!region) return null;
    return region.parent_region_id ? region.name : null;
  };
  const devices = (deviceResult.data ?? []).map((device: any) => ({
    ...device,
    device_model: normalizeRelation(device.device_model),
  })) as DeviceRow[];
  const assignments = (assignmentResult.data ?? []).map((assignment: any) => ({
    ...assignment,
    engineer: normalizeRelation(assignment.engineer),
  })) as EngineerAssignmentRow[];
  const engineers = (engineerResult.data ?? []) as EngineerOption[];
  const warehouses = (warehouseResult.data ?? []) as WarehouseOption[];

  const devicesByHospital = devices.reduce<Record<string, DeviceRow[]>>((acc, device) => {
    if (!device.current_hospital_id) {
      return acc;
    }
    if (!acc[device.current_hospital_id]) {
      acc[device.current_hospital_id] = [];
    }
    acc[device.current_hospital_id].push(device);
    return acc;
  }, {});

  const engineersByHospital = assignments.reduce<
    Record<string, NonNullable<EngineerAssignmentRow["engineer"]>[]>
  >((acc, assignment) => {
    if (!assignment.engineer) {
      return acc;
    }
    if (!acc[assignment.hospital_id]) {
      acc[assignment.hospital_id] = [];
    }
    acc[assignment.hospital_id].push(assignment.engineer);
    return acc;
  }, {});

  const hospitals = rows.map((hospital) => {
    const hospitalDevices = devicesByHospital[hospital.id] ?? [];
    const hospitalEngineers = engineersByHospital[hospital.id] ?? [];
    const regionId = regionIdByHospitalId[hospital.id] ?? null;
    const poc = pocByHospitalId[hospital.id] ?? [];

    return {
      ...hospital,
      region_id: regionId,
      subregion: deriveSubregion(regionId),
      state: hospital.state ?? null,
      poc,
      devices: hospitalDevices.map((device) => ({
        id: device.id,
        serial_number: device.serial_number,
        ownership_type: device.ownership_type,
        usage_type: device.usage_type,
        status: device.status,
        model_name: device.device_model?.model_name ?? null,
        category_name: device.device_model?.device_categories?.name ?? null,
      })),
      engineers: hospitalEngineers,
    };
  });

  const deviceOptions: DeviceOption[] = devices.map((device) => ({
    id: device.id,
    serial_number: device.serial_number,
    ownership_type: device.ownership_type,
    usage_type: device.usage_type,
    status: device.status,
    current_location_type: device.current_location_type,
    current_hospital_id: device.current_hospital_id,
    current_warehouse_id: device.current_warehouse_id,
    model_name: device.device_model?.model_name ?? null,
    category_name: device.device_model?.device_categories?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Hospitals"
        description="Manage hospital sites, zones, and engineering coverage assignments."
      />

      <HospitalsClient
        hospitals={hospitals}
        engineers={engineers}
        devices={deviceOptions}
        warehouses={warehouses}
        regions={regionRows}
      />
    </div>
  );
}
