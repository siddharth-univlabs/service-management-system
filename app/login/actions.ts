"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const ROLE_COOKIE_NAME = "sms_role";

export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const cookieStore = await cookies();
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
    cookieStore.set(ROLE_COOKIE_NAME, role, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/admin/dashboard");
  }

  if (role === "REGIONAL_MANAGER") {
    cookieStore.set(ROLE_COOKIE_NAME, role, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/manager/dashboard");
  }

  cookieStore.set(ROLE_COOKIE_NAME, "FIELD_ENGINEER", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/engineer/dashboard");
}
