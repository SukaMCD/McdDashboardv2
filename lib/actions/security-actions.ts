"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { recordLog } from "@/lib/actions/log-actions";
import { revalidatePath } from "next/cache";

/**
 * Mengambil ringkasan status keamanan sistem
 */
export async function getSecurityOverview() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Mocking integrity checks (can be expanded with real database metadata queries)
    const securityStatus = {
      rlsStatus: [
        { table: 'mcd_projects', status: 'ARMED' },
        { table: 'profiles', status: 'ARMED' },
        { table: 'mcd_system_logs', status: 'ARMED' },
        { table: 'mcdbackup_backups', status: 'ARMED' }
      ],
      envIntegrity: {
        supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        gdrive: !!process.env.GOOGLE_DRIVE_CLIENT_ID && !!process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        ai: !!process.env.GROQ_API_KEY
      },
      mfaStatus: user.factors?.length ? 'ENABLED' : 'DISABLED',
      lastSecurityEvent: null // Will be filled from logs
    };

    return { success: true, data: securityStatus };
  } catch (error: any) {
    console.error("Security Overview Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mengeluarkan semua sesi aktif untuk pengguna saat ini (Global Sign-out)
 */
export async function revokeAllSessions() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Log the intent before revoking
    await recordLog(
      "SECURITY_REVOKE_SESSIONS",
      "SECURITY",
      "Global session revocation triggered by admin. All active devices will be signed out.",
      { timestamp: new Date().toISOString() }
    );

    // Global sign out
    const { error } = await supabase.auth.signOut({ scope: 'global' });

    if (error) throw error;

    revalidatePath("/admin/security");
    return { success: true };
  } catch (error: any) {
    console.error("Revoke Failed:", error);
    return { success: false, error: error.message };
  }
}
