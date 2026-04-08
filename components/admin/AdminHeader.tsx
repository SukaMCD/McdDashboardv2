"use client";

import { User as UserIcon } from "lucide-react";
import { type User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface AdminHeaderProps {
  user: User;
  profile: { profile_picture: string | null } | null;
}

export default function AdminHeader({ user, profile }: AdminHeaderProps) {
  const [uptime, setUptime] = useState("0d 0h 0m");

  useEffect(() => {
    if (!user.created_at) return;

    const calculateUptime = () => {
      const created = new Date(user.created_at);
      const now = new Date();
      const diff = now.getTime() - created.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setUptime(`${days}d ${hours}h ${mins}m`);
    };

    calculateUptime();
    const timer = setInterval(calculateUptime, 60000);
    return () => clearInterval(timer);
  }, [user.created_at]);

  const username = user.email?.split("@")[0] || "sukamcd";

  return (
    <header className="h-20 flex items-center justify-between px-10 bg-black/60 backdrop-blur-xl sticky top-0 z-10 w-full border-b border-zinc-900/50">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-0.5">Host System</span>
          <span className="text-xs text-zinc-300 font-mono tracking-tighter uppercase">node-01-{username}</span>
        </div>
        <div className="w-px h-8 bg-zinc-900"></div>
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-0.5">Session Status</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
            <span className="text-xs text-zinc-400 font-mono tracking-tighter uppercase">Uptime: {uptime}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4 pl-5 border-l border-zinc-900">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-zinc-200 tracking-tight">{user.email}</span>
            <span className="text-[9px] text-emerald-500/80 uppercase tracking-widest font-black">Authorized Admin</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden transition-all hover:border-zinc-600 shadow-xl group cursor-pointer">
            {profile?.profile_picture ? (
              <img 
                src={profile.profile_picture} 
                alt="Profile" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
              />
            ) : user.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
              />
            ) : (
              <span className="text-sm font-bold uppercase text-zinc-400 font-mono">
                {username.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
