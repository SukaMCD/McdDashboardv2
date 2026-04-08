"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const phone_number = formData.get("phone_number") as string;
  const bio = formData.get("bio") as string;

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      username,
      phone_number,
      bio,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/profile");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  
  const password = formData.get("password") as string;
  const passwordConfirmation = formData.get("password_confirmation") as string;

  if (password !== passwordConfirmation) {
    return { success: false, error: "Passwords do not match" };
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateAvatarUrl(url: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("profiles")
    .update({
      profile_picture: url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/profile");
  return { success: true };
}
