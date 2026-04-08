"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, FileText, Shield, Key, Camera, Check, X, Loader2 } from "lucide-react";
import { updateProfile, updatePassword, updateAvatarUrl } from "@/lib/actions/profile-actions";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useRef } from "react";

interface Profile {
  id: string;
  name: string | null;
  username: string | null;
  phone_number: string | null;
  bio: string | null;
  profile_picture: string | null;
  role: string;
  created_at: string;
}

interface AdminProfileClientProps {
  profile: Profile;
  userEmail: string;
}

export default function AdminProfileClient({ profile, userEmail }: AdminProfileClientProps) {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Auto-hide success messages
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditingInfo(false);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update profile" });
    }
    setIsLoading(false);
  }

  async function handlePasswordUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);

    if (result.success) {
      setMessage({ type: "success", text: "Password updated successfully!" });
      setIsEditingPassword(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update password" });
    }
    setIsLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: "error", text: "Please upload an image file." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // 1. Upload ke Storage Bucket
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Ambil Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update URL di tabel profiles via Server Action
      const result = await updateAvatarUrl(publicUrl);
      
      if (result.success) {
        setMessage({ type: "success", text: "Profile picture updated successfully!" });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setMessage({ type: "error", text: err.message || "Failed to upload image." });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="relative group">
          <div className="w-32 h-32 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-zinc-500">
            {profile.profile_picture ? (
              <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-16 h-16 text-zinc-700" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all rounded-3xl cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black tracking-tight text-white mb-1">
            {profile.name || "Administrator"}
          </h2>
          <p className="text-zinc-500 font-mono text-lg lowercase">@{profile.username || "admin"}</p>
          <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-bold tracking-widest text-zinc-400">
            {profile.role}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-medium border animate-in zoom-in-95 duration-300 ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
            : "bg-red-500/10 border-red-500/20 text-red-500"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Quick Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <section className="glass-panel rounded-3xl p-8 border-zinc-800/40">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
              <Shield className="w-3 h-3 text-zinc-600" /> Quick Stats
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-zinc-950/20 p-3 rounded-xl border border-zinc-900/50">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Member Since</span>
                <span className="text-sm text-zinc-200">
                  {new Date(profile.created_at).toLocaleDateString('idx', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950/20 p-3 rounded-xl border border-zinc-900/50">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Status</span>
                <span className="text-emerald-500 flex items-center gap-2 text-xs font-black uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  Active
                </span>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-8 border-zinc-800/40">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Account Verification</h3>
            <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl space-y-3">
              <div className="flex items-center gap-3 text-emerald-500">
                <Check className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Identity Verified</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">Your administrative credentials have been securely validated by the Gateway.</p>
            </div>
          </section>
        </div>

        {/* Right: Forms */}
        <div className="lg:col-span-8 space-y-8">
          {/* Personal Information */}
          <div className="glass-panel rounded-3xl overflow-hidden border-zinc-800/40">
            <div className="px-8 py-5 border-b border-zinc-800/50 bg-zinc-950/30 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200 flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-500" /> Personal Identity
              </h3>
              {!isEditingInfo && (
                <button 
                  onClick={() => setIsEditingInfo(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            <div className="p-8">
              {!isEditingInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Full Name</p>
                    <p className="text-lg text-zinc-100 font-light">{profile.name || "Not set"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Username</p>
                    <p className="text-lg text-zinc-300 font-mono tracking-tighter">@{profile.username || "not_set"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Email Access</p>
                    <p className="text-lg text-zinc-100 font-light">{userEmail}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Phone Identity</p>
                    <p className="text-lg text-zinc-100 font-light">{profile.phone_number || "Not set"}</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">System Biography</p>
                    <p className="text-base text-zinc-400 font-light leading-relaxed whitespace-pre-line">
                      {profile.bio || "No biography provided in the database records."}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        defaultValue={profile.name || ""} 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zinc-600 transition-all text-white"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Username (Handle)</label>
                      <input 
                        type="text" 
                        name="username" 
                        defaultValue={profile.username || ""} 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-mono focus:outline-none focus:border-zinc-600 transition-all text-white"
                        placeholder="admin_handle"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Phone Link</label>
                      <input 
                        type="text" 
                        name="phone_number" 
                        defaultValue={profile.phone_number || ""} 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zinc-600 transition-all text-white"
                        placeholder="+62..."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">System Bio</label>
                      <textarea 
                        name="bio" 
                        rows={4} 
                        defaultValue={profile.bio || ""} 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zinc-600 transition-all text-white resize-none"
                        placeholder="Tell the system about yourself..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingInfo(false)}
                      className="px-6 py-3 rounded-2xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="px-8 py-3 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      Sync Database
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Security / Password */}
          <div className="glass-panel rounded-3xl overflow-hidden border-zinc-800/40">
            <div className="px-8 py-5 border-b border-zinc-800/50 bg-zinc-950/30 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200 flex items-center gap-3">
                <Key className="w-4 h-4 text-zinc-500" /> Security Layers
              </h3>
              {!isEditingPassword && (
                <button 
                  onClick={() => setIsEditingPassword(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700"
                >
                  Update Access Key
                </button>
              )}
            </div>
            
            <div className="p-8">
              {!isEditingPassword ? (
                <div className="flex items-center gap-6 p-6 bg-zinc-950/30 border border-zinc-900 rounded-2xl">
                  <div className="p-4 rounded-2xl bg-zinc-900/50 text-zinc-400">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300 font-medium">Account Access Protection</p>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Encryption keys are automatically rotated. Ensure your administrative password remains complex and confidential.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordUpdate} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">New Access Key</label>
                      <input 
                        type="password" 
                        name="password" 
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zinc-600 transition-all text-white"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Confirm Identity</label>
                      <input 
                        type="password" 
                        name="password_confirmation" 
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zinc-600 transition-all text-white"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingPassword(false)}
                      className="px-6 py-3 rounded-2xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="px-8 py-3 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      Update Security
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
