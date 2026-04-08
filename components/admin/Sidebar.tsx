"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  Folder, 
  MessageSquare, 
  Terminal, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  User, 
  LogOut 
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const sidebarItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutGrid },
  { name: "McdCrypt", href: "/admin/mcdcrypt", icon: Folder },
  { name: "McdAI", href: "/admin/mcdai", icon: MessageSquare },
  { name: "Terminal", href: "/admin/terminal", icon: Terminal },
  { name: "Backup", href: "/admin/backup", icon: UploadCloud },
  { name: "Logs", href: "/admin/logs", icon: FileText },
  { name: "Security", href: "/admin/security", icon: ShieldCheck },
  { name: "Profile", href: "/admin/profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="w-64 border-r border-zinc-900 flex flex-col shrink-0 bg-black/95 backdrop-blur-xl z-20">
      {/* Brand */}
      <div className="p-8 mb-4">
        <div className="text-xl font-bold tracking-tighter text-white">SUKAMCD</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">
            SECURE ACCESS
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow px-4 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 group ${
                isActive 
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-lg shadow-black/50" 
                  : "text-zinc-500 hover:text-white hover:bg-zinc-900/40"
              }`}
            >
              <Icon className={`w-4 h-4 transition-all duration-300 ${
                isActive ? "text-white scale-110" : "text-zinc-500 group-hover:text-zinc-300"
              }`} />
              <span className={`font-medium tracking-tight ${isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="ml-auto w-1 h-3 rounded-full bg-white shadow-[0_0_8px_white]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 group border border-transparent hover:border-red-500/10"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
