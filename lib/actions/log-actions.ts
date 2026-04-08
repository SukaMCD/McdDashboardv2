"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export type LogCategory = 'SYSTEM' | 'SECURITY' | 'USER_ACTION' | 'DATABASE';

/**
 * Merekam aktivitas sistem ke dalam mcd_system_logs
 */
export async function recordLog(
  action: string,
  category: LogCategory,
  description?: string,
  metadata: any = {}
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("mcd_system_logs")
      .insert({
        user_id: user?.id || null,
        action,
        category,
        description,
        metadata: {
          ...metadata,
          ip: "Server-Side", // IP monitoring could be added here if needed
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      console.error("Logger Error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Critical Logger Failure:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mendapatkan daftar log terbaru dari database
 */
export async function getSystemLogs(limit = 50) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Join dengan profiles untuk mendapatkan info pengguna
    const { data, error } = await supabase
      .from("mcd_system_logs")
      .select(`
        *,
        profiles (
          id,
          profile_picture
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, logs: data };
  } catch (error: any) {
    console.error("Failed to fetch logs:", error);
    return { success: false, error: error.message };
  }
}
