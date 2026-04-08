import Link from "next/link";

export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col justify-between p-8 lg:p-16">
      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="text-xl font-semibold tracking-tighter">SUKAMCD</div>
        <div className="h-px bg-zinc-800 flex-grow mx-8 hidden sm:block"></div>
        <div className="text-sm text-zinc-500 hover:text-white transition-colors cursor-default">
          Established 2026
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto flex flex-col items-center">
        <div className="mb-24 text-center">
          <h1 className="text-5xl lg:text-7xl font-light tracking-tighter mb-6 text-gradient">
            Central Project Hub
          </h1>
          <p className="text-zinc-500 max-w-md mx-auto text-lg font-light leading-relaxed">
            A curated collection of digital experiences and experiments by SukaMCD.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {/* McdCrypt Project */}
          <Link
            href="/mcdcrypt-access"
            className="project-card glass p-8 rounded-2xl transition-all duration-300 group"
          >
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-xs text-zinc-500 mb-4 tracking-widest uppercase">
                  Tool
                </div>
                <h3 className="text-2xl font-medium mb-2 group-hover:translate-x-1 transition-transform">
                  McdCrypt
                </h3>
                <p className="text-zinc-400 text-sm font-light leading-relaxed">
                  Secure file encryption and storage management system.
                </p>
              </div>
              <div className="mt-8 flex items-center text-xs text-zinc-500 gap-2">
                <span>ONLINE</span>
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
          </Link>

          {/* Placeholder 1 */}
          <div className="glass p-8 rounded-2xl border-dashed border-zinc-800 opacity-50 flex items-center justify-center italic text-zinc-600 text-sm">
            New project coming soon
          </div>

          {/* Placeholder 2 */}
          <div className="glass p-8 rounded-2xl border-dashed border-zinc-800 opacity-50 flex items-center justify-center italic text-zinc-600 text-sm">
            Keep building
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto border-t border-zinc-900 pt-8 flex justify-between items-end">
        <div>
          <div className="text-xs text-zinc-600 mb-2">
            &copy; {currentYear} SukaMCD. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a
              href="https://github.com/SukaMCD"
              className="text-xs text-zinc-500 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Github
            </a>
            <a
              href="https://www.instagram.com/sukamcd.dev/"
              className="text-xs text-zinc-500 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          </div>
        </div>
        <Link
          href="/gateway"
          className="w-2 h-2 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-default"
          title="Gate"
        />
      </footer>
    </div>
  );
}

