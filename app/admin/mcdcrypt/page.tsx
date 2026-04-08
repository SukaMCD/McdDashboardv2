import { getFiles, getBreadcrumbs } from "@/lib/actions/mcdcrypt-actions";
import McdCryptExplorer from "@/components/admin/McdCryptExplorer";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "McdCrypt | Secure Storage",
  description: "Advanced AES-256 encrypted file management system for SukaMCD.",
};

export default async function McdCryptPage(props: { searchParams: Promise<{ folder?: string }> }) {
  const searchParams = await props.searchParams;
  const currentFolderId = searchParams.folder || null;
  
  const files = await getFiles(currentFolderId);
  const breadcrumbs = await getBreadcrumbs(currentFolderId);
  
  const supabase = await createServerSupabaseClient();
  let currentFolder = null;
  
  if (currentFolderId) {
    const { data } = await supabase
      .from("mcdcrypt_files")
      .select("*")
      .eq("id", currentFolderId)
      .single();
    currentFolder = data;
  }

  return (
    <div className="h-[calc(100%+4rem)] -m-8 flex flex-col overflow-hidden bg-black">
      <McdCryptExplorer initialFiles={files} currentFolder={currentFolder} breadcrumbs={breadcrumbs} />
    </div>
  );
}
