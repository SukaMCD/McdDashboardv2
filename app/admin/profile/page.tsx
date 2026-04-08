import { createServerSupabaseClient } from "@/lib/supabase-server";
import AdminProfileClient from "@/components/admin/AdminProfileClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Profile | SukaMCD",
  description: "Manage your administrative identity and security settings.",
};

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile matching the authenticated user
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Jika profil belum ada (kemungkinan user lama sebelum ada trigger)
  if (!profile || error) {
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert([
        { 
          id: user.id, 
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          username: user.email?.split('@')[0],
          role: 'admin'
        }
      ])
      .select("*")
      .single();

    if (createError) {
      console.error("Profile creation error:", createError);
      return (
        <div className="flex items-center justify-center h-[60vh] text-zinc-500 font-mono uppercase tracking-widest text-xs text-center px-8">
          Error initializing profile: {createError.message}<br/>Please try again later.
        </div>
      );
    }
    profile = newProfile;
  }

  return (
    <div className="p-4">
      <AdminProfileClient profile={profile} userEmail={user.email || ""} />
    </div>
  );
}
