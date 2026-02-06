"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const normalizeId = (value: FormDataEntryValue | null) => {
  const text = value?.toString().trim();
  return text ? text : null;
};

export async function upsertProfile(formData: FormData) {
  const userId = normalizeId(formData.get("userId"));
  const fullName = normalizeId(formData.get("fullName"));
  const phone = normalizeId(formData.get("phone"));
  const managerId = normalizeId(formData.get("managerId"));
  const isRegionalManager = formData.get("isRegionalManager") === "on";
  const isActive = formData.get("isActive") !== "off";

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      full_name: fullName,
      phone,
      manager_id: managerId,
      is_regional_manager: isRegionalManager,
      is_active: isActive,
      role: "FIELD_ENGINEER",
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/team");
  if (managerId) {
    revalidatePath(`/admin/team/${managerId}`);
  }
}

export async function createTeamUser(formData: FormData) {
  const email = normalizeId(formData.get("email"));
  const password = normalizeId(formData.get("password"));
  const fullName = normalizeId(formData.get("fullName"));
  const phone = normalizeId(formData.get("phone"));
  const managerId = normalizeId(formData.get("managerId"));
  const isRegionalManager = formData.get("isRegionalManager") === "on";
  const isActive = formData.get("isActive") !== "off";

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create auth user.");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      user_id: data.user.id,
      full_name: fullName,
      phone,
      manager_id: managerId,
      is_regional_manager: isRegionalManager,
      is_active: isActive,
      role: "FIELD_ENGINEER",
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  revalidatePath("/admin/team");
  if (managerId) {
    revalidatePath(`/admin/team/${managerId}`);
  }
}

export async function deactivateProfile(formData: FormData) {
  const userId = normalizeId(formData.get("userId"));

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false, is_regional_manager: false, manager_id: null })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/team");
}

export async function activateProfile(formData: FormData) {
  const userId = normalizeId(formData.get("userId"));

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/team");
}

export async function deleteTeamUser(formData: FormData) {
  const userId = normalizeId(formData.get("userId"));

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/team");
}

export async function removeRegionalManager(formData: FormData) {
  const userId = normalizeId(formData.get("userId"));

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_regional_manager: false })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("profiles").update({ manager_id: null }).eq("manager_id", userId);

  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${userId}`);
}

export async function assignEngineerHospital(formData: FormData) {
  const engineerId = normalizeId(formData.get("engineerId"));
  const hospitalId = normalizeId(formData.get("hospitalId"));

  if (!engineerId || !hospitalId) {
    throw new Error("Engineer and hospital are required.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("engineer_hospitals").upsert(
    {
      engineer_id: engineerId,
      hospital_id: hospitalId,
      assigned_by: user?.id ?? null,
    },
    { onConflict: "engineer_id,hospital_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/team");
  revalidatePath("/admin/hospitals");
}

export async function approveSignupRequest(formData: FormData) {
  const userId = normalizeId(formData.get("userId"));
  const role = normalizeId(formData.get("role"));

  if (!userId || !role) {
    throw new Error("User ID and role are required.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: "APPROVED",
      rejection_reason: null,
      decision_by: user?.id ?? null,
      decision_at: new Date().toISOString(),
      role,
      is_active: true,
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/team");
}

export async function rejectSignupRequest(formData: FormData) {
  const userId = normalizeId(formData.get("userId"));
  const reason = normalizeId(formData.get("reason"));

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: "REJECTED",
      rejection_reason: reason,
      decision_by: user?.id ?? null,
      decision_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/team");
}

export async function removeEngineerHospital(formData: FormData) {
  const engineerId = normalizeId(formData.get("engineerId"));
  const hospitalId = normalizeId(formData.get("hospitalId"));

  if (!engineerId || !hospitalId) {
    throw new Error("Engineer and hospital are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("engineer_hospitals")
    .delete()
    .eq("engineer_id", engineerId)
    .eq("hospital_id", hospitalId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/team");
  revalidatePath("/admin/hospitals");
}
