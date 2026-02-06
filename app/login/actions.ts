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
    .select("role, approval_status, is_active")
    .eq("user_id", data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    redirect("/login?error=Profile%20not%20found");
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=Account%20is%20deactivated");
  }

  if (profile.approval_status === "PENDING") {
    await supabase.auth.signOut();
    redirect("/login?error=Application%20under%20process");
  }

  if (profile.approval_status === "REJECTED") {
    await supabase.auth.signOut();
    redirect("/login?error=Application%20rejected");
  }

  if (!profile.role) {
    await supabase.auth.signOut();
    redirect("/login?error=Profile%20missing%20role");
  }

  if (profile.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (profile.role === "REGIONAL_MANAGER") {
    redirect("/manager/dashboard");
  }

  redirect("/engineer/dashboard");
}
