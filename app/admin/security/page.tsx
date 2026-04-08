"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  Globe, 
  Zap, 
  AlertOctagon,
  Fingerprint,
  HardDrive,
  Activity,
  LogOut,
  RefreshCw,
  Cpu,
  Loader2,
  ShieldQuestion,
  Info,
  AlertTriangle
} from "lucide-react";
import { getSecurityOverview, revokeAllSessions } from "@/lib/actions/security-actions";
import { getSystemLogs } from "@/lib/actions/log-actions";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const fetchSecurityData = async () => {
    setIsLoading(true);
    try {
      const [ovResult, logsResult] = await Promise.all([
        getSecurityOverview(),
        getSystemLogs(20)
      ]);

      if (ovResult.success && ovResult.data) setOverview(ovResult.data);
      if (logsResult.success && logsResult.logs) {
        // Filter only security logs
        setSecurityLogs(logsResult.logs.filter((l: any) => l.category === 'SECURITY'));
      }
    } catch (error) {
      console.error("Security data fetch failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    
    // Fake scan animation on load
    const timer = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 20);

    return () => clearInterval(timer);
  }, []);

  const handleGlobalSignOut = async () => {
    setIsRevoking(true);
    try {
      const result = await revokeAllSessions();
      if (result.success) {
        router.push("/gateway");
      } else {
        alert("Failed to revoke sessions: " + result.error);
        setIsConfirmModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      setIsConfirmModalOpen(false);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-zinc-900/50">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center border border-zinc-800 shadow-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
             </div>
             <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">
               Security Command Center
             </h1>
          </div>
          <p className="text-[8px] text-zinc-600 font-light ml-10 uppercase tracking-[0.2em]">System Integrity & Access Control</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex flex-col items-end pr-3 border-r border-zinc-900">
              <span className="text-[7px] font-black text-zinc-600 uppercase tracking-tighter">Protection Level</span>
              <span className="text-[9px] font-mono text-emerald-500 font-bold tracking-tight">MILITARY-GRADE (RLS)</span>
           </div>
           <button 
             onClick={fetchSecurityData}
             className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-all text-zinc-500 hover:text-white"
           >
             <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left: Integrity & MFA */}
        <div className="lg:col-span-3 space-y-4 flex flex-col">
          {/* Integrity Scanner */}
          <div className="glass-panel p-5 rounded-[1.5rem] border-zinc-800/50 bg-zinc-950/20 relative overflow-hidden group shrink-0">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500/20">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${scanProgress}%` }}
                 className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
               />
            </div>

            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                 <Zap className="w-3 h-3 text-amber-500" /> Env Health
               </h3>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'DB Vault', status: overview?.envIntegrity?.supabase },
                { label: 'Cloud Storage', status: overview?.envIntegrity?.gdrive },
                { label: 'Groq AI', status: overview?.envIntegrity?.ai }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                  <span className="text-[9px] font-medium text-zinc-500">{item.label}</span>
                  {item.status ? (
                    <div className="flex items-center gap-1 text-emerald-500">
                       <ShieldCheck className="w-3 h-3" />
                       <span className="text-[7px] font-black tracking-tighter">SECURE</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                       <ShieldAlert className="w-3 h-3" />
                       <span className="text-[7px] font-black tracking-tighter">MISSING</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* MFA / Identity */}
          <div className="glass-panel p-5 rounded-[1.5rem] border-zinc-800/50 bg-zinc-950/20 flex-1 flex flex-col">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2">
              <Fingerprint className="w-3 h-3 text-blue-500" /> Identity
            </h3>
            
            <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl mb-3">
               <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Lock className="w-4 h-4 text-blue-500" />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-zinc-300">Multi-Factor</p>
                  <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">
                    Status: {overview?.mfaStatus || 'PENDING'}
                  </p>
               </div>
            </div>
            
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 flex-1 flex items-center">
               <p className="text-[8px] text-zinc-600 italic leading-snug">
                 Auth handled via Supabase JWT with token rotation enabled.
               </p>
            </div>
          </div>
        </div>

        {/* Middle: Shields & Audit */}
        <div className="lg:col-span-6 space-y-4 flex flex-col min-h-0">
          {/* Armor Plates (RLS Status) */}
          <div className="glass-panel p-5 rounded-[1.5rem] border-zinc-800/50 bg-zinc-950/20">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2">
              <HardDrive className="w-3 h-3 text-emerald-500" /> Armor Plates (RLS)
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
               {overview?.rlsStatus?.map((item: any, i: number) => (
                 <div key={i} className="p-2.5 bg-black/40 border border-zinc-950 rounded-lg flex items-center justify-between">
                    <span className="text-[8px] font-mono text-zinc-500 truncate mr-2">{item.table}</span>
                    <span className="px-1 py-0.5 rounded text-[6px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {item.status}
                    </span>
                 </div>
               ))}
            </div>
          </div>

          {/* Security Audit Feed */}
          <div className="glass-panel p-5 rounded-[1.5rem] border-zinc-800/50 bg-zinc-950/20 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2">
              <Activity className="w-3 h-3 text-zinc-400" /> Threat Intel Audit
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              <AnimatePresence mode="popLayout">
                {securityLogs.length > 0 ? (
                  securityLogs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg space-y-1 group hover:border-zinc-700 transition-all"
                    >
                       <div className="flex items-center justify-between">
                         <span className="text-[7px] font-black text-red-500 uppercase bg-red-500/10 px-1 rounded border border-red-500/20">
                            {log.action}
                         </span>
                         <span className="text-[7px] font-mono text-zinc-600">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                       </div>
                       <p className="text-[8px] text-zinc-500 leading-tight">{log.description}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <ShieldQuestion className="w-8 h-8 mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-center italic">Clean Record</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Danger Zone */}
        <div className="lg:col-span-3 space-y-4 flex flex-col">
          <div className="glass-panel p-6 rounded-[1.5rem] bg-zinc-950/40 border-dashed border-zinc-800 flex flex-col items-center justify-center text-center flex-1">
             <div className="w-16 h-16 rounded-full bg-red-500/5 border border-red-500/20 flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping opacity-20"></div>
                <AlertOctagon className="w-8 h-8 text-red-500" />
             </div>
             
             <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter mb-1.5">Emergency Logout</h4>
             <p className="text-[8px] text-zinc-600 leading-relaxed mb-6 px-2">
               Force immediate session termination across all devices globally.
             </p>
             
             <button 
               onClick={() => setIsConfirmModalOpen(true)}
               disabled={isRevoking}
               className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-zinc-800 text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
             >
               {isRevoking ? (
                 <Loader2 className="w-3 h-3 animate-spin" />
               ) : (
                 <>
                   <LogOut className="w-3 h-3" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Global Revoke</span>
                 </>
               )}
             </button>
          </div>

          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-[1.5rem] space-y-2">
             <div className="flex items-center gap-2 text-amber-500">
                <Info className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">Advisory</span>
             </div>
             <p className="text-[8px] text-zinc-600 leading-snug font-light italic">
               Access monitored by SukaMCD security daemon.
             </p>
          </div>
        </div>
      </div>

      {/* Global Revoke Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm glass-panel bg-zinc-950 border-red-900/50 rounded-[2rem] overflow-hidden shadow-2xl shadow-red-500/10"
            >
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2 italic">Global Revocation</h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed mb-8 px-4 font-light uppercase tracking-tight">
                  Sesi ini akan diputus secara paksa di <span className="text-red-400 font-bold">SELURUH PERANGKAT</span>. Anda harus login kembali untuk mendapatkan akses. Lanjutkan?
                </p>
                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={handleGlobalSignOut}
                    disabled={isRevoking}
                    className="w-full py-4 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Kill-Switch"}
                  </button>
                  <button 
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="w-full py-4 bg-zinc-900 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-800 transition-all font-bold"
                  >
                    Abort Operation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
