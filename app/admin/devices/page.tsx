import PageHeader from "@/components/layout/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DevicesClient from "./devices-client";

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
    id: string;
    model_name: string | null;
    device_category?: { 
      name: string | null; 
      project_device_categories?: { project_id: string }[] 
    } | null;
  } | null;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  image_path: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  image_path: string | null;
  project_id: string | null; // This will now come from joining the mapping table
};

type DeviceModelRow = {
  id: string;
  model_name: string;
  manufacturer: string | null;
  model_code: string;
  description: string | null;
  specs: unknown | null;
  category_name: string | null;
};

type DevicesPageProps = {
  searchParams?: Promise<{
    project?: string | string[];
    category?: string | string[];
    model?: string | string[];
  }>;
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createSupabaseServerClient();
  
  const [deviceResult, categoryResult, modelResult, projectResult] = await Promise.all([
    supabase
      .from("devices")
      .select(
        "id, serial_number, ownership_type, usage_type, status, demo_status, demo_last_used_at, current_location_type, current_hospital:current_hospital_id(name), current_warehouse:current_warehouse_id(name), device_model:device_model_id(id, model_name, device_category:category_id(name, project_device_categories(project_id)))"
      )
      .order("serial_number", { ascending: true }),
    supabase
      .from("device_categories")
      .select("id, name, image_path, project_device_categories(project_id)")
      .order("name", { ascending: true }),
    supabase
      .from("device_models")
      .select("id, model_name, manufacturer, model_code, description, specs, category:category_id(name)")
      .order("model_name", { ascending: true }),
    supabase
      .from("projects")
      .select("id, name, description, image_path")
      .order("name", { ascending: true })
  ]);

  const devices: DeviceRow[] = (deviceResult.data ?? []).map((device: any) => {
    const deviceModel = normalizeRelation(device.device_model) as DeviceRow["device_model"];
    return {
      ...device,
      current_hospital: normalizeRelation(device.current_hospital) as DeviceRow["current_hospital"],
      current_warehouse: normalizeRelation(device.current_warehouse) as DeviceRow["current_warehouse"],
      device_model: deviceModel,
    };
  });
  const categories = (categoryResult.data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    image_path: c.image_path,
    project_id: c.project_device_categories?.[0]?.project_id ?? null,
  })) as CategoryRow[];
  const models: DeviceModelRow[] = (modelResult.data ?? []).map((model: any) => {
    const category = normalizeRelation(model.category) as { name: string | null } | null;
    return {
      id: model.id,
      model_name: model.model_name,
      manufacturer: model.manufacturer ?? null,
      model_code: model.model_code,
      description: model.description ?? null,
      specs: model.specs ?? null,
      category_name: category?.name ?? null,
    };
  });
  const projects = (projectResult.data ?? []) as ProjectRow[];

  const initialProject = Array.isArray(resolvedSearchParams?.project)
    ? resolvedSearchParams?.project[0]
    : resolvedSearchParams?.project;
  const initialCategory = Array.isArray(resolvedSearchParams?.category)
    ? resolvedSearchParams?.category[0]
    : resolvedSearchParams?.category;
  const initialModelId = Array.isArray(resolvedSearchParams?.model)
    ? resolvedSearchParams?.model[0]
    : resolvedSearchParams?.model;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Device Assets"
        description="Track serialized device units, ownership, and deployment status across projects."
      />
      <DevicesClient
        projects={projects}
        categories={categories}
        models={models}
        devices={devices}
        initialProjectId={initialProject ?? null}
        initialCategory={initialCategory ?? null}
        initialModelId={initialModelId ?? null}
      />
    </div>
  );
}
