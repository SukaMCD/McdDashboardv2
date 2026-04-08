"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { encryptBuffer } from "@/lib/crypt/aes";
import { v4 as uuidv4 } from "uuid";

export async function getFiles(parentId: string | null = null) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("mcdcrypt_files")
    .select("*")
    .eq("user_id", user.id);

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.is("parent_id", null);
  }

  const { data, error } = await query.order("is_folder", { ascending: false }).order("original_name");

  if (error) {
    console.error("Error fetching crypt files:", error);
    return [];
  }

  return data;
}

export async function createFolder(name: string, parentId: string | null = null) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("mcdcrypt_files")
    .insert([{
      user_id: user.id,
      original_name: name,
      is_folder: true,
      parent_id: parentId
    }]);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/mcdcrypt");
  return { success: true };
}

export async function uploadFile(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const file = formData.get("file") as File;
  const parentId = formData.get("parent_id") as string | null;

  if (!file) return { success: false, error: "No file provided" };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Enkripsi file menggunakan AES-256
    const encryptedBuffer = encryptBuffer(buffer);
    
    const storagePath = `${user.id}/${uuidv4()}.enc`;

    // Upload ke bucket 'mcdcrypt'
    const { error: uploadError } = await supabase.storage
      .from("mcdcrypt")
      .upload(storagePath, encryptedBuffer, {
        contentType: "application/octet-stream",
        cacheControl: "3600"
      });

    if (uploadError) throw uploadError;

    // Simpan metadata ke DB
    const { error: dbError } = await supabase
      .from("mcdcrypt_files")
      .insert([{
        user_id: user.id,
        original_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size: file.size,
        is_folder: false,
        parent_id: parentId
      }]);

    if (dbError) throw dbError;

    revalidatePath("/admin/mcdcrypt");
    return { success: true };

  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteItem(id: string) {
  const supabase = await createServerSupabaseClient();
  
  // Ambil metadata untuk cek apakah folder atau file
  const { data: item } = await supabase
    .from("mcdcrypt_files")
    .select("*")
    .eq("id", id)
    .single();

  if (!item) return { success: false, error: "Item not found" };

  try {
    if (item.is_folder) {
      // Rekursif hapus isi folder ditangani oleh CASCADE di database
      // Tapi file di storage harus dihapus manual
      await deleteFolderContents(id, supabase);
    } else if (item.storage_path) {
      await supabase.storage.from("mcdcrypt").remove([item.storage_path]);
    }

    const { error } = await supabase
      .from("mcdcrypt_files")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/mcdcrypt");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function deleteFolderContents(folderId: string, supabase: any) {
  const { data: children } = await supabase
    .from("mcdcrypt_files")
    .select("*")
    .eq("parent_id", folderId);

  if (children) {
    for (const child of children) {
      if (child.is_folder) {
        await deleteFolderContents(child.id, supabase);
      } else if (child.storage_path) {
        await supabase.storage.from("mcdcrypt").remove([child.storage_path]);
      }
    }
  }
}

export async function renameItem(id: string, newName: string) {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from("mcdcrypt_files")
    .update({ original_name: newName, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/mcdcrypt");
  return { success: true };
}

export async function moveItem(id: string, newParentId: string | null) {
  const supabase = await createServerSupabaseClient();
  
  // Prevent cycles or same parent
  if (id === newParentId) return { success: false, error: "Cannot move item into itself" };

  const { error } = await supabase
    .from("mcdcrypt_files")
    .update({ parent_id: newParentId, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/mcdcrypt");
  return { success: true };
}

export async function getBreadcrumbs(folderId: string | null) {
  if (!folderId) return [];

  const supabase = await createServerSupabaseClient();
  const breadcrumbs: { id: string; original_name: string }[] = [];
  
  let currentId: string | null = folderId;

  while (currentId) {
    const { data, error }: { data: any, error: any } = await supabase
      .from("mcdcrypt_files")
      .select("id, original_name, parent_id")
      .eq("id", currentId)
      .single();

    if (error || !data) break;

    breadcrumbs.unshift({ id: data.id, original_name: data.original_name });
    currentId = data.parent_id;
  }

  return breadcrumbs;
}

export async function duplicateItem(id: string, targetParentId: string | null) {
  const supabase = await createServerSupabaseClient();
  
  // 1. Get source item
  const { data: source, error: fetchError }: { data: any, error: any } = await supabase
    .from("mcdcrypt_files")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !source) return { success: false, error: "Item not found" };
  if (source.is_folder) return { success: false, error: "Folder duplication not yet supported" };

  try {
    const newId = crypto.randomUUID();
    let newStoragePath = null;

    // 2. Duplicate Storage if it's a file
    if (source.storage_path) {
      const pathParts = source.storage_path.split("/");
      const fileName = pathParts.pop();
      const userDir = pathParts.join("/");
      const newFileName = `${crypto.randomUUID()}.enc`;
      newStoragePath = `${userDir}/${newFileName}`;

      const { error: copyError } = await supabase.storage
        .from("mcdcrypt")
        .copy(source.storage_path, newStoragePath);

      if (copyError) throw copyError;
    }

    // 3. Insert new DB record
    const { error: insertError } = await supabase
      .from("mcdcrypt_files")
      .insert([{
        id: newId,
        user_id: source.user_id,
        original_name: `${source.original_name} - Copy`,
        storage_path: newStoragePath,
        mime_type: source.mime_type,
        size: source.size,
        is_folder: false,
        parent_id: targetParentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) throw insertError;

    revalidatePath("/admin/mcdcrypt");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
