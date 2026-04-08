import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/gateway");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_picture")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden bg-black text-zinc-100">
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} profile={profile} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
