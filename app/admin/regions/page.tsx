import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RegionsTableClient from "./regions-table-client";

export const dynamic = "force-dynamic";

type RegionRow = {
  id: string;
  name: string;
  code: string;
  created_at: string;
  parent_region_id: string | null;
  is_locked: boolean;
};

type ManagerRow = {
  region_id: string;
  profiles: {
    full_name: string | null;
  }[] | null;
};

export default async function RegionsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: parentData, error: parentError } = await supabase
    .from("regions")
    .select("id, name, code, created_at, parent_region_id, is_locked")
    .eq("is_locked", true)
    .is("parent_region_id", null)
    .order("name", { ascending: true });

  if (parentError) {
    throw new Error(parentError.message);
  }

  const parentRegions = (parentData ?? []) as RegionRow[];
  const parentIds = parentRegions.map((region) => region.id);

  const { data: subregionData, error: subregionError } = await supabase
    .from("regions")
    .select("id, name, code, created_at, parent_region_id, is_locked")
    .in("parent_region_id", parentIds.length ? parentIds : ["00000000-0000-0000-0000-000000000000"])
    .order("name", { ascending: true });

  if (subregionError) {
    throw new Error(subregionError.message);
  }

  const subregions = (subregionData ?? []) as RegionRow[];

  const { data: managerData, error: managerError } = await supabase
    .from("regional_managers")
    .select("region_id, profiles:profiles!regional_managers_user_id_fkey(full_name)")
    .in("region_id", parentIds.length ? parentIds : ["00000000-0000-0000-0000-000000000000"]);

  const managers = managerError ? [] : ((managerData ?? []) as ManagerRow[]);
  const managerByRegionId = managers.reduce<Record<string, string | null>>((acc, row) => {
    acc[row.region_id] = row.profiles?.[0]?.full_name ?? null;
    return acc;
  }, {});
  const subregionsByParentId = subregions.reduce<Record<string, RegionRow[]>>((acc, subregion) => {
    if (!subregion.parent_region_id) return acc;
    acc[subregion.parent_region_id] ??= [];
    acc[subregion.parent_region_id].push(subregion);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Regions"
        description="The 8 main regions are locked. Create and manage subregions inside them."
      />

      <Card>
        <CardHeader>
          <CardTitle>Primary Regions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegionsTableClient
            parentRegions={parentRegions}
            subregionsByParentId={subregionsByParentId}
            managerByRegionId={managerByRegionId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
