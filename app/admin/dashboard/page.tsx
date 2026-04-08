import { createServerSupabaseClient } from "@/lib/supabase-server";
import { MoveRight, Rocket, Activity, Cpu, ShieldCheck, Globe, AlertCircle, Lock, HardDrive, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { getProjects } from "@/lib/actions/project-actions";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [projects, dashResult] = await Promise.all([
    getProjects(),
    getDashboardStats()
  ]);

  const dashStats = dashResult.success ? dashResult.data : { totalBackups: 0, securityAlerts: 0, systemStatus: 'Unknown' };
  const onlineProjects = projects.filter(p => p.status === 'ONLINE').length;

  const stats = [
    { label: "Active Projects", value: projects.length.toString(), icon: Rocket, trend: `${onlineProjects} Nodes Online`, href: "/admin/projects" },
    { label: "Total Backups", value: dashStats.totalBackups.toString(), icon: HardDrive, trend: "Cloud Secured", href: "/admin/backup" },
    { label: "Security Events", value: dashStats.securityAlerts.toString(), icon: ShieldAlert, highlight: dashStats.securityAlerts > 0, trend: "Last 24h Activity", href: "/admin/security" },
    { label: "System Integrity", value: dashStats.systemStatus, icon: ShieldCheck, highlight: dashStats.systemStatus === 'Stable', trend: "Core Protection", href: "/admin/security" },
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
            <Link 
              key={i} 
              href={stat.href}
              className="glass-panel p-6 rounded-3xl group relative overflow-hidden transition-all duration-500 hover:border-zinc-500/50 hover:bg-zinc-900/30 active:scale-95"
            >
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
                  <p className={`text-4xl font-light tracking-tighter ${stat.highlight ? (stat.label === 'Security Events' ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]") : "text-white"}`}>
                    {stat.value}
                  </p>
                </div>
                <p className="text-[9px] text-zinc-600 mt-2 font-medium uppercase tracking-wider">{stat.trend}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Row 2: Projects & Focus Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Project List (Full Width or 3/3 if Terminal removed) */}
        <div className="xl:col-span-3 glass-panel rounded-3xl flex flex-col overflow-hidden border-zinc-800/40">
          <div className="p-8 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Project Summary</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">Real-time status of managed applications</p>
            </div>
            <Link 
              href="/admin/projects" 
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-600 transition-all uppercase font-black tracking-widest flex items-center gap-2"
            >
              Manage Projects <MoveRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4 overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-zinc-600">
                  <th className="px-6 py-2 font-bold text-[9px] uppercase tracking-widest">Node Name</th>
                  <th className="px-6 py-2 font-bold text-[9px] uppercase tracking-widest">Category</th>
                  <th className="px-6 py-2 font-bold text-[9px] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-2 font-bold text-[9px] uppercase tracking-widest text-right">Operational Logic</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-zinc-600 text-[10px] uppercase font-bold tracking-[0.2em] italic">
                      No deployed projects found. Access Project Central to initialize.
                    </td>
                  </tr>
                ) : (
                  projects.map((project, i) => (
                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 rounded-l-2xl border-y border-l border-zinc-900 group-hover:border-zinc-800 bg-zinc-950/20">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${
                            project.status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 
                            project.status === 'MAINTENANCE' ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]' :
                            'bg-red-600'
                          }`}></div>
                          <div>
                            <div className="font-bold text-zinc-100 tracking-tight">{project.title}</div>
                            <div className="text-[10px] text-zinc-600 font-medium truncate max-w-[200px]">{project.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-y border-zinc-900 group-hover:border-zinc-800 bg-zinc-950/20">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{project.category}</span>
                      </td>
                      <td className="px-6 py-4 border-y border-zinc-900 group-hover:border-zinc-800 bg-zinc-950/20">
                        <span className={`text-[9px] border px-2.5 py-1 rounded-lg font-black uppercase tracking-widest ${
                          project.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          project.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          'bg-zinc-900 text-zinc-600 border-zinc-800'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 rounded-r-2xl border-y border-r border-zinc-900 group-hover:border-zinc-800 bg-zinc-950/20 text-right">
                        <Link 
                          href="/admin/projects"
                          className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase font-black tracking-widest px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700"
                        >
                          Modify Node
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
