"use client";

import { useState, useEffect } from "react";
import { 
  Rocket, Plus, Trash2, Edit3, ExternalLink, 
  Loader2, X, Globe, Lock, AlertCircle, Save,
  CheckCircle2, ArrowRight, AlertTriangle
} from "lucide-react";
import { getProjects, createProject, updateProject, deleteProject } from "@/lib/actions/project-actions";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Tool",
    status: "OFFLINE",
    url: "",
    icon_name: "rocket",
    display_order: 0
  });

  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const data = await getProjects();
    setProjects(data);
    setLoading(false);
  }

  const handleOpenModal = (project: any = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title,
        description: project.description || "",
        category: project.category || "Tool",
        status: project.status,
        url: project.url || "",
        icon_name: project.icon_name || "rocket",
        display_order: project.display_order || 0
      });
    } else {
      setEditingProject(null);
      setFormData({
        title: "",
        description: "",
        category: "Tool",
        status: "OFFLINE",
        url: "",
        icon_name: "rocket",
        display_order: projects.length
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let result;
    if (editingProject) {
      result = await updateProject(editingProject.id, formData);
    } else {
      result = await createProject(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      fetchProjects();
      router.refresh();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = (project: any) => {
    setIsDeleting(project);
  };

  const handleConfirmDelete = async () => {
    if (!isDeleting) return;
    setIsSubmitting(true);
    const result = await deleteProject(isDeleting.id);
    if (result.success) {
      setIsDeleting(null);
      fetchProjects();
      router.refresh();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black min-h-screen">
      {/* Header */}
      <div className="p-8 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
            <Rocket className="w-5 h-5 text-zinc-400" />
            Project Management
          </h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Manage your ecosystem status</p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all border border-white/10"
        >
          <Plus className="w-4 h-4" />
          Deploy New Project
        </button>
      </div>

      {/* Content */}
      <div className="p-8 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="max-w-md mx-auto mt-24 text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-10 h-10 text-zinc-700" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Projects Detected</h3>
            <p className="text-sm text-zinc-500 mb-8">Your central hub is currently empty. Start deploying projects to showcase them.</p>
            <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-zinc-800 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all">
              Initiate First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id}
                className="group relative glass duration-500 hover:scale-[1.02] border border-zinc-900 overflow-hidden rounded-[2rem]"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-2">{project.category}</span>
                      <h3 className="text-xl font-bold text-white group-hover:text-zinc-200 transition-colors uppercase tracking-tight">{project.title}</h3>
                    </div>
                    <div className={`p-2 rounded-xl border ${
                      project.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                      project.status === 'MAINTENANCE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                      'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}>
                      {project.status === 'ONLINE' ? <Globe className="w-4 h-4" /> : 
                       project.status === 'MAINTENANCE' ? <AlertCircle className="w-4 h-4" /> : 
                       <Lock className="w-4 h-4" />}
                    </div>
                  </div>

                  <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 min-h-[32px]">{project.description}</p>

                  <div className="mt-8 pt-6 border-t border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${
                        project.status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                        project.status === 'MAINTENANCE' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                        'bg-red-600'
                      }`}></span>
                      <span className="text-[10px] font-black tracking-widest text-zinc-600 uppercase">{project.status}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(project)}
                        className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(project)}
                        className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-800 hover:text-red-500 hover:border-red-500/20 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tool */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
           <div className="w-full max-w-lg glass-panel bg-zinc-950 border-zinc-800 rounded-[2.5rem] overflow-hidden animate-in zoom-in-95">
             <form onSubmit={handleSubmit}>
                <div className="p-8 border-b border-zinc-900 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">
                      {editingProject ? "Reconfigure Project" : "Initialize New Node"}
                    </h3>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Project Hub Core Integration</p>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-zinc-700 hover:text-white transition-colors" /></button>
                </div>

                <div className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Project Title</label>
                        <input 
                          required
                          type="text" 
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-white/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Category</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-400 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 appearance-none cursor-pointer hover:bg-zinc-800 transition-colors"
                        >
                          <option value="Tool" className="bg-zinc-950 text-zinc-200">Tool</option>
                          <option value="Personal" className="bg-zinc-950 text-zinc-200">Personal</option>
                          <option value="Portfolio" className="bg-zinc-950 text-zinc-200">Portfolio</option>
                          <option value="E-Commerce" className="bg-zinc-950 text-zinc-200">E-Commerce</option>
                          <option value="Service" className="bg-zinc-950 text-zinc-200">Service</option>
                        </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Description</label>
                      <textarea 
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 resize-none"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Sync Status</label>
                        <select 
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className={`w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 appearance-none cursor-pointer hover:bg-zinc-800 transition-colors ${
                            formData.status === 'ONLINE' ? 'text-emerald-500' : formData.status === 'MAINTENANCE' ? 'text-amber-500' : 'text-red-500'
                          }`}
                        >
                          <option value="ONLINE" className="bg-zinc-950 text-emerald-500">ONLINE (ACTIVE)</option>
                          <option value="OFFLINE" className="bg-zinc-950 text-red-500">OFFLINE (SHUTDOWN)</option>
                          <option value="MAINTENANCE" className="bg-zinc-950 text-amber-500">MAINTENANCE (UPDATING)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Access URL</label>
                        <input 
                          type="text" 
                          value={formData.url}
                          placeholder="https://..."
                          onChange={(e) => setFormData({...formData, url: e.target.value})}
                          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-white/20"
                        />
                      </div>
                   </div>

                   <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     {editingProject ? "Update Integration" : "Establish Integration"}
                   </button>
                </div>
             </form>
           </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel bg-zinc-950 border-red-900/50 rounded-[2rem] overflow-hidden animate-in zoom-in-95">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Secure Destruction</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-8 px-4">
                Apakah Anda yakin ingin menghapus proyek <span className="text-red-400 font-bold">"{isDeleting.title}"</span>? Data proyek akan dihapus secara permanen dari ekosistem.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Confirm Delete"}
                </button>
                <button 
                  onClick={() => setIsDeleting(null)}
                  className="w-full py-4 bg-zinc-900 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-800 transition-all font-bold"
                >
                  Cancel Operation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
