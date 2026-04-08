"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Shield, 
  User, 
  Database, 
  Terminal, 
  Search, 
  Filter,
  RefreshCw,
  Clock,
  Eye,
  MoreVertical,
  ChevronRight,
  Info
} from "lucide-react";
import { getSystemLogs, LogCategory } from "@/lib/actions/log-actions";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<LogCategory | 'ALL'>('ALL');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const result = await getSystemLogs(50);
      if (result.success && result.logs) {
        setLogs(result.logs);
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Refresh every 30 seconds for live feel
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    filter === 'ALL' ? true : log.category === filter
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SECURITY': return <Shield className="w-3.5 h-3.5" />;
      case 'USER_ACTION': return <User className="w-3.5 h-3.5" />;
      case 'DATABASE': return <Database className="w-3.5 h-3.5" />;
      default: return <Terminal className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SECURITY': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'USER_ACTION': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'DATABASE': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-900/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <Activity className="w-4 h-4 text-emerald-500" />
             </div>
             <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
               System Audit Trail
             </h1>
          </div>
          <p className="text-[9px] text-zinc-600 font-light ml-11 uppercase tracking-widest">Real-time Activity Stream</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-all group"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-all ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="h-4 w-px bg-zinc-800 mx-1"></div>
          
          <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-900">
            {(['ALL', 'SYSTEM', 'USER_ACTION', 'SECURITY'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-md transition-all ${
                  filter === cat 
                    ? 'bg-zinc-800 text-white shadow-lg' 
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Main Log List */}
        <div className="lg:col-span-8 glass-panel rounded-[1.5rem] border-zinc-800/50 flex flex-col bg-zinc-950/20 overflow-hidden h-[calc(100vh-230px)]">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            <table className="w-full text-left border-separate border-spacing-y-2 px-4">
              <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                <tr className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em]">
                  <th className="pb-4 pl-4 uppercase">Event / Description</th>
                  <th className="pb-4 uppercase text-center w-24">Category</th>
                  <th className="pb-4 uppercase text-right pr-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredLogs.map((log) => (
                    <motion.tr
                      key={log.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      onClick={() => setSelectedLog(log)}
                      className="group cursor-pointer"
                    >
                      <td className="bg-zinc-900/40 border-y border-l border-zinc-800/50 rounded-l-xl py-3 pl-4 transition-all group-hover:bg-zinc-900/60 group-hover:border-zinc-700/50">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner uppercase font-mono text-[10px] text-zinc-600">
                            {log.profiles?.profile_picture ? (
                              <img src={log.profiles.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                              {log.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[9px] text-zinc-500 font-light truncate max-w-[300px]">{log.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="bg-zinc-900/40 border-y border-zinc-800/50 py-3 text-center transition-all group-hover:bg-zinc-900/60 group-hover:border-zinc-700/50">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest ${getCategoryColor(log.category)}`}>
                          {getCategoryIcon(log.category)}
                          {log.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="bg-zinc-900/40 border-y border-r border-zinc-800/50 rounded-r-xl py-3 pr-4 text-right transition-all group-hover:bg-zinc-900/60 group-hover:border-zinc-700/50">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-mono text-zinc-400">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="text-[7px] text-zinc-600 uppercase font-bold">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredLogs.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={3} className="py-20 text-center opacity-20">
                       <Terminal className="w-10 h-10 mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No matching logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-4 space-y-4 flex flex-col min-h-0">
          <div className="glass-panel p-6 rounded-[1.5rem] flex-1 border-zinc-800/50 bg-zinc-950/20 overflow-hidden flex flex-col">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-5 flex items-center gap-3 shrink-0">
              <Eye className="w-3 h-3 text-emerald-500" /> Event Intelligence
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {selectedLog ? (
                  <motion.div
                    key={selectedLog.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Log UUID</label>
                        <p className="text-[8px] font-mono text-zinc-400 break-all">{selectedLog.id}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Action Context</label>
                        <p className="text-[10px] font-bold text-white uppercase tracking-tighter leading-tight bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/30">
                          {selectedLog.description}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Metadata Payload</label>
                        <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 overflow-x-auto">
                          <pre className="text-[9px] font-mono text-emerald-400/80 leading-relaxed">
                            {JSON.stringify(selectedLog.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <p className="text-[9px] text-zinc-500 leading-normal font-light italic">
                        Logs are immutable and stored in the SukaMCD primary database vault.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                    <Terminal className="w-8 h-8 mb-4" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center">Select an event to<br/>inspect metadata</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-zinc-950/40 p-5 rounded-[1.5rem] border border-zinc-900 border-dashed shrink-0">
             <div className="flex items-center justify-between mb-3">
               <span className="text-[8px] font-black uppercase text-zinc-700 tracking-widest flex items-center gap-2">
                 <Clock className="w-3 h-3" /> System Health
               </span>
               <span className="text-[8px] font-mono text-emerald-500">OPERATIONAL</span>
             </div>
             <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
               <div className="w-[98%] h-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
