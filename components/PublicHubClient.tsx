"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  url: string;
}

export default function PublicHubClient({ initialProjects }: { initialProjects: Project[] }) {
  const currentYear = new Date().getFullYear();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-between p-8 lg:p-16 bg-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="text-xl font-semibold tracking-tighter text-white">SUKAMCD</div>
        <div className="h-px bg-zinc-800 flex-grow mx-8 hidden sm:block"></div>
        <div className="text-sm text-zinc-500 hover:text-white transition-colors cursor-default">
          Established 2026
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto flex flex-col items-center">
        <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-5xl lg:text-7xl font-light tracking-tighter mb-4 text-gradient">
            Central Project Hub
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto text-base font-light leading-relaxed opacity-70">
            A curated collection of digital experiences and experiments by SukaMCD.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {(() => {
            const projectsToRender = [...initialProjects];
            const placeholdersNeeded = Math.max(0, 3 - projectsToRender.length);
            
            return (
              <>
                {projectsToRender.map((project) => {
                  const IsExternal = project.url?.startsWith("http");
                  const IsActive = project.status === 'ONLINE';

                  const CardContent = (
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="text-[10px] text-zinc-400 mb-3 tracking-widest uppercase font-black opacity-80">
                          {project.category}
                        </div>
                        <h3 className="text-xl font-bold mb-1.5 group-hover:translate-x-1 transition-transform text-white tracking-tight">
                          {project.title}
                        </h3>
                        <p className="text-zinc-300 text-xs font-light leading-relaxed line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <div className="mt-6 flex items-center text-[10px] text-zinc-400 gap-2 font-black uppercase tracking-widest">
                        <span className={IsActive ? "text-zinc-400" : "text-zinc-600"}>{project.status}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          project.status === 'ONLINE' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 
                          project.status === 'MAINTENANCE' ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]' :
                          'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                        }`}></span>
                      </div>
                    </div>
                  );

                  const commonClasses = `project-card bg-zinc-900/40 backdrop-blur-md p-7 rounded-[1.8rem] transition-all duration-300 border border-zinc-700/50 h-[210px] ${
                    IsActive 
                      ? "group hover:border-zinc-500 hover:bg-zinc-800/40 cursor-pointer" 
                      : "cursor-not-allowed grayscale-[0.5] opacity-60"
                  }`;

                  if (!IsActive) {
                    return (
                      <div key={project.id} className={commonClasses}>
                        {CardContent}
                      </div>
                    );
                  }

                  if (IsExternal) {
                    return (
                      <a
                        key={project.id}
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={commonClasses + " group"}
                      >
                        {CardContent}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={project.id}
                      href={project.url || "#"}
                      className={commonClasses + " group"}
                    >
                      {CardContent}
                    </Link>
                  );
                })}
                
                {Array.from({ length: placeholdersNeeded }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="bg-zinc-950/20 backdrop-blur-sm p-7 rounded-[1.8rem] border border-dashed border-zinc-800/50 opacity-40 flex items-center justify-center italic text-zinc-500 text-[11px] select-none h-[210px]">
                    New project coming soon
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto border-t border-zinc-900 pt-8 flex justify-between items-end mt-12">
        <div>
          <div className="text-xs text-zinc-600 mb-2 font-medium">
            &copy; {currentYear} SukaMCD. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="https://github.com/SukaMCD" className="text-xs text-zinc-500 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Github</a>
            <a href="https://www.instagram.com/sukamcd.dev/" className="text-xs text-zinc-500 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.linkedin.com/in/fabianrizkypratama/" className="text-xs text-zinc-500 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
        
        {/* Hidden Gate Button */}
        <div
          onClick={() => router.push("/gateway")}
          className="w-2 h-2 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-all duration-500 cursor-default shadow-[0_0_0_transparent]"
        />
      </footer>
    </div>
  );
}
