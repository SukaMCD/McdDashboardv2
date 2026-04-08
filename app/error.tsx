"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, FileCode, ShieldAlert, Cpu } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("System Fault Detected:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Red Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.05)_0%,_transparent_70%)]"></div>
      
      {/* Moving Error Grid */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: 'linear-gradient(#f43f5e 1px, transparent 1px), linear-gradient(90deg, #f43f5e 1px, transparent 1px)', 
             backgroundSize: '30px 30px' 
           }}>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Error Icon with Warning Pulse */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-10"
        >
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="w-28 h-28 rounded-[2.5rem] bg-zinc-950 border border-red-500/30 flex items-center justify-center shadow-2xl relative z-10">
             <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-4 -right-4 w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12"
          >
             <Cpu className="w-5 h-5 text-red-500/50" />
          </motion.div>
        </motion.div>

        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full mb-2">
             <ShieldAlert className="w-3 h-3 text-red-500" />
             <span className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em]">Critical System Fault</span>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
            Node Instability Detected
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
            The SukaMCD core encountered an unexpected execution error. Data integrity is prioritized.
          </p>
        </div>

        {/* Error Digest (if available) */}
        {error.digest && (
          <div className="mb-10 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4 w-full text-left group hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0">
               <FileCode className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="min-w-0">
               <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Fault ID</p>
               <p className="text-[10px] font-mono text-zinc-400 truncate">{error.digest}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={() => reset()}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Reboot Node Component
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-all active:scale-95"
          >
            Terminal Return (Public Hub)
          </button>
        </div>

        {/* Diagnostic Footer */}
        <p className="mt-16 text-[7px] font-mono text-zinc-800 uppercase tracking-[0.4em]">
          Automated Recovery Protocol v2.0 // SukaMCD OS
        </p>
      </div>
    </div>
  );
}
