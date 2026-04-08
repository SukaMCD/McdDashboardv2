import { createServerSupabaseClient } from "@/lib/supabase-server";
import { decryptBuffer } from "@/lib/crypt/aes";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 1. Ambil metadata dari DB
    const { data: mcdFile, error: dbError } = await supabase
      .from("mcdcrypt_files")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (dbError || !mcdFile || mcdFile.is_folder) {
      return new Response("File not found", { status: 404 });
    }

    // 2. Download encrypted blob dari storage
    const { data: blob, error: storageError } = await supabase.storage
      .from("mcdcrypt")
      .download(mcdFile.storage_path);

    if (storageError || !blob) {
      return new Response("Storage error", { status: 500 });
    }

    // 3. Dekripsi data
    const encryptedArrayBuffer = await blob.arrayBuffer();
    const encryptedBuffer = Buffer.from(encryptedArrayBuffer);
    const decryptedBuffer = decryptBuffer(encryptedBuffer);

    // 4. Return response dengan MIME type asli
    const searchParams = new URL(req.url).searchParams;
    const download = searchParams.get("download");

    const headers = new Headers();
    headers.set("Content-Type", mcdFile.mime_type || "application/octet-stream");
    
    if (download === "1") {
      headers.set("Content-Disposition", `attachment; filename="${mcdFile.original_name}"`);
    } else {
      headers.set("Content-Disposition", `inline; filename="${mcdFile.original_name}"`);
    }

    return new Response(new Uint8Array(decryptedBuffer), { headers });

  } catch (error: any) {
    console.error("Serve decryption error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
