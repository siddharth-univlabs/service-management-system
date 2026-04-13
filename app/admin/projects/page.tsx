import PageHeader from "@/components/layout/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProjectsClient from "./projects-client";

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: projects }, { data: categories }, { data: projectCategories }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: true }),
    supabase.from("device_categories").select("*").order("name", { ascending: true }),
    supabase.from("project_device_categories").select("*")
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Projects Management"
        description="Manage projects and assign device categories to them."
      />
      <ProjectsClient 
        initialProjects={projects ?? []} 
        initialCategories={categories ?? []} 
        initialProjectCategories={projectCategories ?? []} 
      />
    </div>
  );
}
