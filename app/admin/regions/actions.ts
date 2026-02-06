"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const normalizeText = (value: FormDataEntryValue | null) => {
  const text = value?.toString().trim();
  return text ? text : null;
};

export type ActionResult = {
  success: boolean;
  message?: string;
};

export async function createSubregion(formData: FormData) {
  const parentRegionId = normalizeText(formData.get("parent_region_id"));
  const name = normalizeText(formData.get("name"));
  const code = normalizeText(formData.get("code"));

  if (!parentRegionId) {
    return { success: false, message: "Parent region id is required." } satisfies ActionResult;
  }

  if (!name || !code) {
    return { success: false, message: "Subregion name and code are required." } satisfies ActionResult;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("regions").insert({ parent_region_id: parentRegionId, name, code });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "You cannot add a region with the same name or code. This region already exists.",
      } satisfies ActionResult;
    }

    throw new Error(error.message);
  }

  revalidatePath("/admin/regions");
  return { success: true } satisfies ActionResult;
}

export async function updateSubregion(formData: FormData) {
  const id = normalizeText(formData.get("id"));
  const name = normalizeText(formData.get("name"));
  const code = normalizeText(formData.get("code"));

  if (!id) {
    throw new Error("Region id is required.");
  }

  if (!name || !code) {
    throw new Error("Subregion name and code are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("regions").update({ name, code }).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/regions");
}

export async function deleteSubregion(formData: FormData) {
  const id = normalizeText(formData.get("id"));

  if (!id) {
    throw new Error("Region id is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("regions").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/regions");
}
