"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Plus, Trash2, Send, Zap, Bot, User, Loader2, Settings, X, Save, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { deleteConversation, getMessages, updateAISettings } from "@/lib/actions/ai-actions";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface AIChatContainerProps {
  initialConversations: Conversation[];
  profile: any;
}

export default function AIChatContainer({ initialConversations, profile }: AIChatContainerProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDeleting, setIsDeleting] = useState<any>(null);
  const [isDeletingProcess, setIsDeletingProcess] = useState(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [persona, setPersona] = useState(profile?.ai_settings?.persona || "");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  async function loadConversation(id: string) {
    setIsLoading(true);
    setCurrentConvId(id);
    const msgs = await getMessages(id);
    setMessages(msgs);
    setIsLoading(false);
  }

  function startNewChat() {
    setCurrentConvId(null);
    setMessages([]);
    setInputValue("");
  }

  async function handleDelete(conv: any, e: React.MouseEvent) {
    e.stopPropagation();
    setIsDeleting(conv);
  }

  async function handleConfirmDelete() {
    if (!isDeleting) return;
    setIsDeletingProcess(true);
    const result = await deleteConversation(isDeleting.id);
    if (result.success) {
      setConversations(prev => prev.filter(c => c.id !== isDeleting.id));
      if (currentConvId === isDeleting.id) startNewChat();
      setIsDeleting(null);
    } else {
      alert("Gagal menghapus: " + result.error);
    }
    setIsDeletingProcess(false);
  }

  async function handleSend() {
    if (!inputValue.trim() || isLoading || isTyping) return;

    const userMessage = inputValue;
    setInputValue("");
    
    // Optimistic UI for User Message
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConvId,
          title: userMessage.substring(0, 30)
        })
      });

      const data = await response.json();

      if (data.success) {
        if (!currentConvId) {
          setCurrentConvId(data.conversationId);
          // Refresh conversations list
          setConversations(prev => [{ id: data.conversationId, title: userMessage.substring(0, 30) + "...", created_at: new Date().toISOString() }, ...prev]);
        }
        
        const aiMsg: Message = {
          id: Date.now().toString() + "-ai",
          role: "assistant",
          content: data.message,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errMsg: Message = {
        id: Date.now().toString() + "-error",
        role: "assistant",
        content: `Error: ${err.message || "Gagal menghubungi McdAI."}`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const result = await updateAISettings({ persona });
    if (result.success) {
      setIsSettingsOpen(false);
    } else {
      alert("Gagal menyimpan pengaturan: " + result.error);
    }
    setIsSavingSettings(false);
  };

  return (
    <div className="flex w-full h-full overflow-hidden relative">
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
          <div className="w-full max-w-xl glass-panel bg-zinc-950 border-zinc-800 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                  <Settings className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">AI Personalization</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">Customize McdAI behavior</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-zinc-900 rounded-xl transition-all text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Assistant Persona</label>
                <textarea 
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="Contoh: 'Jawablah dengan gaya bajak laut', 'Gunakan istilah medis', dll."
                  className="w-full h-40 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-300 focus:outline-none focus:border-white/20 transition-all resize-none font-light leading-relaxed"
                />
                <p className="text-[9px] text-zinc-600 italic">
                  * Instruksi ini akan diberikan ke AI pada setiap pesan untuk membentuk kepribadiannya.
                </p>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="w-full h-12 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar History */}
      <aside className="w-80 border-r border-zinc-900 bg-zinc-950/50 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <Zap className="w-3 h-3 text-zinc-400" /> AI History
          </h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-zinc-900 rounded-xl transition-all text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={startNewChat}
              className="p-2 hover:bg-zinc-900 rounded-xl transition-all text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">No history available</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                  currentConvId === conv.id 
                    ? "bg-white/5 border-zinc-700 text-white" 
                    : "border-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${currentConvId === conv.id ? "text-white" : "text-zinc-700"}`} />
                  <span className="text-xs font-medium truncate">{conv.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDelete(conv, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-zinc-950">
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative">
          {messages.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-8 border border-zinc-800 shadow-2xl">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white mb-2 italic uppercase">McdAI Intelligence</h2>
              <p className="text-zinc-500 max-w-sm text-sm font-light leading-relaxed">
                Tanyakan apa saja tentang administrasi SukaMCD, bantuan koding, atau optimasi sistem. Saya di sini untuk membantu.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-3 w-full max-w-md">
                {["Optimasi Database", "Security Audit", "API Integration", "UI/UX Polishing"].map(topic => (
                  <button 
                    key={topic}
                    onClick={() => { setInputValue(`Bantu saya dengan: ${topic}`); }}
                    className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-zinc-600 transition-all text-left"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-10 h-10 text-zinc-800 animate-spin" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-32">
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden ${
                      msg.role === "user" 
                        ? "bg-zinc-800 border-zinc-700 text-white" 
                        : "bg-white text-black border-white"
                    }`}>
                      {msg.role === "user" ? (
                        profile?.profile_picture ? (
                          <img src={profile.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4" />
                        )
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className={`px-6 py-4 rounded-3xl text-sm leading-relaxed border ${
                      msg.role === "user"
                        ? "bg-zinc-900 border-zinc-800 text-zinc-100"
                        : "glass-panel border-zinc-800 text-zinc-300"
                    }`}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          pre: ({ node, ...props }) => (
                            <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800 my-4 overflow-x-auto">
                              <pre {...props} className="font-mono text-zinc-300 text-xs" />
                            </div>
                          ),
                          code: ({ node, ...props }) => (
                            <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200 font-mono text-xs" {...props} />
                          ),
                          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-4 mt-6 text-white" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-3 mt-5 text-white underline decoration-zinc-700 decoration-2 underline-offset-4" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-4 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-4 space-y-1" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start animate-pulse">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-white">
                      <Bot className="w-4 h-4 text-black" />
                    </div>
                    <div className="px-6 py-4 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-mono uppercase tracking-widest italic">
                      McdAI sedang berpikir...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 inset-x-0 p-8 pt-0 z-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative glass-panel rounded-3xl p-1.5 border-zinc-800 bg-zinc-950/80 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-end gap-2 px-3 py-2">
                <textarea 
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Katakan sesuatu ke McdAI..."
                  className="w-full bg-transparent border-none text-sm text-zinc-200 focus:outline-none resize-none py-2 px-2 max-h-40 font-light placeholder:text-zinc-700"
                  style={{ height: 'auto' }}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || isTyping}
                  className="w-10 h-10 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-zinc-200 transition-all shadow-xl disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-[9px] text-zinc-700 text-center mt-4 tracking-[0.3em] font-black uppercase">
              Powered by Groq • LLaMA-3.3 Intelligence
            </p>
          </div>
        </div>
      </main>
      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel bg-zinc-950 border-red-900/50 rounded-[2rem] overflow-hidden animate-in zoom-in-95">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Secure Destruction</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-8 px-4">
                Apakah Anda yakin ingin menghapus <span className="text-red-400 font-bold">"{isDeleting.title}"</span>? Pesan akan dihapus secara permanen dari Intelligence Core.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={handleConfirmDelete}
                  disabled={isDeletingProcess}
                  className="w-full py-4 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {isDeletingProcess ? "Neutralizing..." : "Confirm Delete"}
                </button>
                <button 
                  onClick={() => setIsDeleting(null)}
                  className="w-full py-4 bg-zinc-900 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-800 transition-all"
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
