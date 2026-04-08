"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateBackupFilename, uploadToDrive } from "@/lib/gdrive";
import { recordLog } from "@/lib/actions/log-actions";
import archiver from "archiver";
import { PassThrough } from "stream";

export async function getBackupHistory() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("mcdbackup_backups")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    return { success: true, history: data };
  } catch (error: any) {
    console.error("Failed to fetch backup history:", error);
    return { success: false, error: error.message };
  }
}

export async function triggerManualBackup() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Fetch Data
    const { data: projects, error: pError } = await supabase
      .from("mcd_projects")
      .select("*")
      .order("display_order", { ascending: true });

    if (pError) throw new Error("Gagal mengambil data proyek: " + pError.message);

    const { data: profiles, error: prError } = await supabase
      .from("profiles")
      .select("*");

    // 2. Generate SQL Dump String (Simple Helper)
    const generateSQL = (tableName: string, rows: any[]) => {
      if (!rows || rows.length === 0) return `-- No data for ${tableName}\n`;
      
      const columns = Object.keys(rows[0]).join(", ");
      const values = rows.map(row => {
        const val = Object.values(row).map(v => {
          if (v === null) return "NULL";
          if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
          if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
          return v;
        }).join(", ");
        return `(${val})`;
      }).join(",\n");

      return `INSERT INTO ${tableName} (${columns}) VALUES\n${values};\n\n`;
    };

    const sqlDump = [
      `-- SukaMCD Strategic Backup SQL Dump\n`,
      `-- Generated at: ${new Date().toISOString()}\n\n`,
      generateSQL("profiles", profiles || []),
      generateSQL("mcd_projects", projects || []),
    ].join("");

    // 3. Prepare Backup Metadata
    const filename = generateBackupFilename();
    const metadata = {
      backup_name: filename.replace(".zip", ""),
      version: "2.1.0",
      created_at: new Date().toISOString(),
      created_by: user.email,
      project_count: projects?.length || 0,
      profile_count: profiles?.length || 0,
      environment: "Production"
    };

    // 4. Create ZIP Stream
    const passthrough = new PassThrough();
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.pipe(passthrough);

    // Add database data
    archive.append(JSON.stringify(projects, null, 2), { name: 'database/projects.json' });
    archive.append(sqlDump, { name: 'database/sukamcd.sql' });
    
    // Add metadata
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
    
    // Create empty mcdcrypt_files folder inside zip
    archive.append('', { name: 'mcdcrypt_files/.gitkeep' });

    // Finalize archive
    const finalizePromise = archive.finalize();

    // 5. Upload to Drive
    const uploadResult = await uploadToDrive(filename, passthrough);
    await finalizePromise; // Ensure archive is finalized

    // 6. Persist to Database
    const fileSize = (archive.pointer() / 1024).toFixed(2) + " KB";
    
    const { error: dbError } = await supabase
      .from("mcdbackup_backups")
      .insert({
        filename: filename,
        size: fileSize,
        type: "manual"
      });

    if (dbError) {
       console.error("Database logging failed:", dbError);
       // We don't throw here because gdrive upload was successful
    }

    // 7. Success log
    await recordLog(
      "BACKUP_SUCCESS",
      "SYSTEM",
      `Cloud backup completed successfully. Filename: ${filename}`,
      { filename, size: fileSize, driveId: uploadResult.id }
    );

    return { 
      success: true, 
      filename: filename,
      driveId: uploadResult.id,
      size: fileSize,
      created_at: new Date().toISOString()
    };

  } catch (error: any) {
    console.error("Backup failed:", error);
    
    // Log Failure
    await recordLog(
      "BACKUP_FAILED",
      "SECURITY",
      `Strategic backup failed: ${error.message}`,
      { error: error.message }
    );

    return { success: false, error: error.message };
  }
}
