"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Ghost, Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black"></div>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Radar Pulse Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none">
         <motion.div 
           initial={{ scale: 0.5, opacity: 0 }}
           animate={{ scale: 1.5, opacity: [0, 0.1, 0] }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
           className="absolute inset-0 border border-zinc-800 rounded-full"
         />
         <motion.div 
           initial={{ scale: 0.5, opacity: 0 }}
           animate={{ scale: 1.5, opacity: [0, 0.1, 0] }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 2 }}
           className="absolute inset-0 border border-zinc-800 rounded-full"
         />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Large 404 Background Text */}
        <h1 className="absolute -top-20 left-1/2 -translate-x-1/2 text-[180px] font-black text-white/[0.02] tracking-tighter select-none">
          404
        </h1>

        {/* Icon with Glitch-like Animation */}
        <motion.div 
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, -2, 2, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-zinc-800 to-black border border-zinc-800 flex items-center justify-center mb-8 shadow-2xl relative group"
        >
          <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Ghost className="w-10 h-10 text-zinc-400" />
        </motion.div>

        <div className="space-y-3 mb-12">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
            Node Disconnected
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] max-w-[280px]">
            We couldn't locate the requested coordinates in the ecosystem.
          </p>
        </div>

        <div className="flex flex-col w-full gap-3">
          <Link 
            href="/" 
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            <Home className="w-4 h-4" />
            Return to Public Hub
          </Link>
        </div>

        {/* System Diagnostics Text */}
        <div className="mt-16 flex items-center gap-2 text-[8px] font-mono text-zinc-700 uppercase tracking-widest">
           <Search className="w-3 h-3" />
           <span>Scanning for broken links... No results found.</span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
         <p className="text-[10px] font-black text-zinc-800 tracking-[0.5em] uppercase">SukaMCD Ecosystem</p>
      </div>
    </div>
  );
}
