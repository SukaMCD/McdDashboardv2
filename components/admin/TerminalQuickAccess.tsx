"use client";

import { useEffect, useRef } from "react";
import "xterm/css/xterm.css";

export default function TerminalQuickAccess() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import xterm to avoid SSR issues
    const initTerminal = async () => {
      const { Terminal } = await import("xterm");
      const { FitAddon } = await import("@xterm/addon-fit");

      if (terminalRef.current && !xtermRef.current) {
        const term = new Terminal({
          cursorBlink: true,
          fontFamily: "'Fira Code', monospace",
          fontSize: 11,
          theme: {
            background: "#000000",
            foreground: "#fafafa",
            cursor: "#10b981",
            selectionBackground: "rgba(255, 255, 255, 0.2)",
          },
          allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;

        term.writeln("\x1b[1;32mSukaMCD Gateway [v2.0.0]\x1b[0m");
        term.writeln("\x1b[1;30mInitializing secure shell...\x1b[0m");
        term.write("\r\n\x1b[32msukamcd@gateway\x1b[0m:\x1b[34m~\x1b[0m$ ");

        let currentLine = "";

        term.onData((data) => {
          const code = data.charCodeAt(0);
          if (code === 13) { // Enter
            term.write("\r\n");
            // Simulate command execution for now
            if (currentLine.trim() !== "") {
              term.writeln(`Executing: ${currentLine}`);
              term.writeln("\x1b[31mError: Backend execution not yet implemented in v2.\x1b[0m");
            }
            term.write("\x1b[32msukamcd@gateway\x1b[0m:\x1b[34m~\x1b[0m$ ");
            currentLine = "";
          } else if (code === 127) { // Backspace
            if (currentLine.length > 0) {
              term.write("\b \b");
              currentLine = currentLine.slice(0, -1);
            }
          } else {
            currentLine += data;
            term.write(data);
          }
        });

        const handleResize = () => fitAddon.fit();
        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          term.dispose();
        };
      }
    };

    initTerminal();
  }, []);

  return (
    <div className="w-full h-full bg-black p-4 overflow-hidden">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
