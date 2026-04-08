"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function getDashboardStats() {
  const supabase = await createServerSupabaseClient();
  
  try {
    // 1. Get Total Backups count
    const { count: totalBackups } = await supabase
      .from('mcdbackup_backups')
      .select('*', { count: 'exact', head: true });

    // 2. Get Security Events in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: securityAlerts } = await supabase
      .from('mcd_system_logs')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'SECURITY')
      .gt('created_at', yesterday);

    // 3. System Integrity Check (ENVs)
    const integrity = {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      gdrive: !!process.env.GOOGLE_DRIVE_FOLDER_ID && !!process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      ai: !!process.env.GROQ_API_KEY
    };

    const isHealthy = Object.values(integrity).every(v => v);

    return {
      success: true,
      data: {
        totalBackups: totalBackups || 0,
        securityAlerts: securityAlerts || 0,
        systemStatus: isHealthy ? 'Stable' : 'Degraded',
        integrityInfo: integrity
      }
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      success: false,
      error: "Failed to aggregate system statistics"
    };
  }
}
