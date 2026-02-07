"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!email || !password) {
    redirect("/login?error=Missing%20credentials");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Login failed")}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent(profileError.message)}`);
  }

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/login?error=Profile%20not%20found");
  }

  const role = (profile as any).role as string | null | undefined;
  const isActive = (profile as any).is_active as boolean | null | undefined;
  const approvalStatus = (profile as any).approval_status as
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | null
    | undefined;

  if (isActive === false) {
    await supabase.auth.signOut();
    redirect("/login?error=Account%20is%20deactivated");
  }

  if (approvalStatus === "PENDING") {
    await supabase.auth.signOut();
    redirect("/login?error=Application%20under%20process");
  }

  if (approvalStatus === "REJECTED") {
    await supabase.auth.signOut();
    redirect("/login?error=Application%20rejected");
  }

  if (!role) {
    await supabase.auth.signOut();
    redirect("/login?error=Profile%20missing%20role");
  }

  if (role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (role === "REGIONAL_MANAGER") {
    redirect("/manager/dashboard");
  }

  redirect("/engineer/dashboard");
}
