"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const normalizeText = (value: FormDataEntryValue | null) => {
  const text = value?.toString().trim();
  return text ? text : null;
};

export async function signUp(formData: FormData) {
  const fullName = normalizeText(formData.get("fullName"));
  const phone = normalizeText(formData.get("phone"));
  const email = normalizeText(formData.get("email"));
  const password = normalizeText(formData.get("password"));

  if (!fullName || !email || !password) {
    redirect("/signup?error=Missing%20required%20fields");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email: email!,
    password: password!,
    options: {
      data: {
        full_name: fullName!,
        phone,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?success=Request%20submitted.%20Wait%20for%20admin%20approval.");
}
