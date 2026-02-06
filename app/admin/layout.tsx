import type { ReactNode } from "react";
import AppShell from "@/components/layout/app-shell";
import { adminNav } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name").eq("user_id", user.id).single()
    : { data: null };

  const userName = profile?.full_name ?? user?.email ?? null;

  return (
    <AppShell roleLabel="Admin Control" navItems={adminNav} userName={userName}>
      {children}
    </AppShell>
  );
}
