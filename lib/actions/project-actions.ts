"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { recordLog } from "@/lib/actions/log-actions";

export async function getProjects() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("mcd_projects")
    .select("*")
    .order("display_order", { ascending: true });
    
  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  return data;
}

export async function createProject(projectData: any) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Unauthorized" };

  const { error, data } = await supabase
    .from("mcd_projects")
    .insert([{
      ...projectData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  
  await recordLog(
    "PROJECT_CREATED",
    "USER_ACTION",
    `Created project: ${projectData.title || 'New Project'}`,
    { project_id: data?.id, projectData }
  );

  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function updateProject(id: string, projectData: any) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("mcd_projects")
    .update({
      ...projectData,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  
  await recordLog(
    "PROJECT_UPDATED",
    "USER_ACTION",
    `Updated project ID: ${id}`,
    { id, changes: projectData }
  );

  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("mcd_projects")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  
  await recordLog(
    "PROJECT_DELETED",
    "USER_ACTION",
    `Deleted project ID: ${id}`,
    { id }
  );

  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
