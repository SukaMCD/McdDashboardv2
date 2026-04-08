"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  ShieldCheck, 
  Database, 
  FileArchive, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Cloud,
  ChevronRight,
  Info
} from "lucide-react";
import { triggerManualBackup, getBackupHistory } from "@/lib/actions/backup-actions";

export default function BackupPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await getBackupHistory();
        if (result.success && result.history) {
          setBackupLogs(result.history);
        }
      } catch (err) {
        console.error("Initial load failed:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleRunBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    try {
      const result = await triggerManualBackup();
      if (result.success) {
        setBackupLogs(prev => [result, ...prev].slice(0, 5));
      } else {
        setError(result.error || "Gagal menjalankan backup.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-900/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <UploadCloud className="w-4 h-4 text-zinc-400" />
             </div>
             <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
               Strategic Backup
             </h1>
          </div>
          <p className="text-[9px] text-zinc-600 font-light ml-11">Secure your ecosystem data to the cloud vault.</p>
        </div>
        
        <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg h-fit">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">Cloud Link Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Status Card */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-[1.5rem] border-zinc-800/50 flex flex-col bg-zinc-950/20 h-full">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-0.5">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Cloud Storage Profile</h3>
              <p className="text-[8px] text-zinc-600 font-mono italic opacity-60">Google Drive API v3</p>
            </div>
            <div className="w-7 h-7 rounded-full border border-zinc-800/30 flex items-center justify-center">
              <Cloud className="w-3.5 h-3.5 text-zinc-800" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-2 hover:bg-zinc-900/40 transition-colors">
              <div className="flex items-center gap-2.5 text-zinc-500">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em]">Protocol</span>
              </div>
              <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-tighter">OAuth2 Refresh Flow</p>
            </div>
            <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-2 hover:bg-zinc-900/40 transition-colors">
              <div className="flex items-center gap-2.5 text-zinc-500">
                <Database className="w-3 h-3" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em]">Target Folder</span>
              </div>
              <p className="text-[8px] font-mono text-zinc-500 truncate italic">1EQc2Lm4F5...GUl5YNhW-</p>
            </div>
          </div>

          <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 flex gap-3 mb-6">
             <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
             <p className="text-[9px] leading-relaxed text-zinc-500 font-light">
               System: Backup mencakup <strong className="text-amber-500/70">Database Snapshot</strong> & <strong className="text-zinc-400">System Metadata</strong>.
             </p>
          </div>

          <button 
            onClick={handleRunBackup}
            disabled={isBackingUp}
            className={`w-full group relative overflow-hidden h-14 rounded-xl transition-all duration-500 border-2 mt-auto ${
              isBackingUp 
                ? "bg-zinc-900 border-zinc-800 cursor-not-allowed" 
                : "bg-zinc-900 border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5"
            }`}
          >
            <div className={`relative z-10 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] ${
              isBackingUp ? "text-zinc-600" : "text-white group-hover:text-emerald-400 transition-colors"
            }`}>
              {isBackingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <div className="w-1 h-1 rounded-full bg-emerald-500 group-hover:shadow-[0_0_10px_#10b981]"></div>
                  Initiate Cloud Sync
                </>
              )}
            </div>
          </button>
        </div>

        {/* Right Info Section */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          <div className="glass-panel p-6 rounded-[1.5rem] border-zinc-800/50 h-[320px] flex flex-col bg-zinc-950/20 overflow-hidden shrink-0">
            <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-5 flex items-center gap-3">
              <History className="w-3 h-3" /> Session Log
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2.5">
              {isInitialLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Retrieving Vault Logs...</p>
                </div>
              ) : (
                <AnimatePresence initial={false} mode="popLayout">
                  {backupLogs.length > 0 ? (
                    backupLogs.map((log, index) => (
                      <motion.div 
                        key={log.id || log.filename}
                        layout
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          layout: { duration: 0.4 }
                        }}
                      >
                        <div className={`p-4 border rounded-2xl space-y-2 transition-all duration-500 ${
                          index === 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-900/40 border-zinc-800/50 opacity-60 scale-[0.98]"
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className={`flex items-center gap-1.5 ${index === 0 ? "text-emerald-500" : "text-zinc-500"}`}>
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-[8px] font-black uppercase tracking-widest">
                                {index === 0 ? "Latest Sync" : `${log.type || 'Manual'}`}
                              </span>
                            </div>
                            <span className="text-[8px] text-zinc-700 font-mono">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>
                              <p className="text-[8px] text-zinc-600 font-mono mb-0.5">Filename:</p>
                              <p className="text-[9px] font-bold text-zinc-300 break-all leading-tight">{log.filename}</p>
                          </div>
                          <div className={`flex items-center justify-between pt-1 border-t ${index === 0 ? 'border-emerald-500/10' : 'border-zinc-800/50'}`}>
                              <div>
                                <p className="text-[8px] text-zinc-600 font-mono mb-0.5">Size:</p>
                                <p className="text-[8px] font-mono text-zinc-500">{log.size || '--'}</p>
                              </div>
                              {index === 0 && log.driveId && (
                                <div className="text-right">
                                  <p className="text-[8px] text-zinc-600 font-mono mb-0.5">Asset ID:</p>
                                  <p className="text-[8px] font-mono text-zinc-500 opacity-50 truncate w-24 ml-auto">
                                    {log.driveId}
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : error ? (
                    <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-2">
                      <div className="flex items-center gap-2 text-red-500 mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Fault Detected</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light">{error}</p>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-10 h-10 bg-zinc-900/50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 opacity-20">
                        <Cloud className="w-5 h-5 text-zinc-500" />
                      </div>
                      <p className="text-[9px] text-zinc-700 uppercase tracking-widest font-black">No Active Records</p>
                    </div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="bg-zinc-950/40 p-6 rounded-[2rem] border border-zinc-900 border-dashed">
            <p className="text-[9px] text-zinc-500 leading-relaxed font-light italic">
               Manual snapshots are preserved in the cloud vault according to your Google Drive retention policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
