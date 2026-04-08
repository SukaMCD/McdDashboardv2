import { createServerSupabaseClient } from "@/lib/supabase-server";
import { MoveRight, Terminal as TerminalIcon, LayoutGrid, Activity, Cpu, ShieldCheck } from "lucide-react";
import Link from "next/link";
import TerminalQuickAccess from "@/components/admin/TerminalQuickAccess";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const stats = [
    { label: "Active Projects", value: "12", icon: LayoutGrid, trend: "+2 this month" },
    { label: "API Requests (24h)", value: "4.8k", icon: Activity, trend: "Stable" },
    { label: "Memory Usage", value: "42%", icon: Cpu, trend: "Low load" },
    { label: "System Health", value: "Stable", icon: ShieldCheck, highlight: true, trend: "No issues" },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Page Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-zinc-800"></div>
          <p className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase font-bold">Administrative Dashboard</p>
        </div>
        <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-gradient">
          Control Center
        </h1>
      </div>

      {/* Row 1: Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-3xl group relative overflow-hidden transition-all duration-500 hover:border-zinc-500/50 hover:bg-zinc-900/30">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-16 h-16" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{stat.label}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className={`text-4xl font-light tracking-tighter ${stat.highlight ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" : "text-white"}`}>
                    {stat.value}
                  </p>
                </div>
                <p className="text-[9px] text-zinc-600 mt-2 font-medium uppercase tracking-wider">{stat.trend}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Projects & Terminal Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Project List (2/3) */}
        <div className="xl:col-span-2 glass-panel rounded-3xl flex flex-col overflow-hidden border-zinc-800/40">
          <div className="p-8 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Project Summary</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">Real-time status of managed applications</p>
            </div>
            <Link 
              href="/admin/projects" 
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-600 transition-all uppercase font-black tracking-widest flex items-center gap-2"
            >
              View All <MoveRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-zinc-600">
                  <th className="px-6 py-2 font-bold text-[9px] uppercase tracking-widest">Project Name</th>
                  <th className="px-6 py-2 font-bold text-[9px] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-2 font-bold text-[9px] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                {[
                  { name: "McdCrypt", status: "Online", desc: "Encryption Gateway" },
                  { name: "SukaMCD Landing", status: "Online", desc: "Public Web Interface" },
                ].map((project, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 rounded-l-2xl border-y border-l border-zinc-900 group-hover:border-zinc-800 bg-zinc-950/20">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.6)]"></div>
                        <div>
                          <div className="font-bold text-zinc-100 tracking-tight">{project.name}</div>
                          <div className="text-[10px] text-zinc-600 font-medium">{project.desc}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-y border-zinc-900 group-hover:border-zinc-800 bg-zinc-950/20">
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest">
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 rounded-r-2xl border-y border-r border-zinc-900 group-hover:border-zinc-800 bg-zinc-950/20 text-right">
                      <button className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase font-black tracking-widest px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Terminal (1/3) */}
        <div className="glass-panel rounded-3xl flex flex-col bg-black overflow-hidden border-zinc-800/40 shadow-2xl relative">
          <div className="p-4 px-6 bg-zinc-950 border-b border-zinc-900/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono ml-2 uppercase tracking-widest font-bold">Gateway Shell</span>
            </div>
            <Link 
              href="/admin/terminal" 
              className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-600 hover:text-white transition-all"
              title="Full Terminal"
            >
              <TerminalIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex-grow p-0">
            <TerminalQuickAccess />
          </div>
        </div>
      </div>
    </div>
  );
}
