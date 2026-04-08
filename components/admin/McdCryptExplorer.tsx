"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Folder, File as FileIcon, Search, Upload, Plus, 
  Trash2, Edit3, Download, Eye, Loader2, X,
  FileImage, FileVideo, FileText, Lock, ArrowLeft,
  ChevronRight, Copy, ExternalLink, Move, ClipboardList,
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createFolder, uploadFile, deleteItem, renameItem, moveItem, duplicateItem } from "@/lib/actions/mcdcrypt-actions";

interface CryptFile {
  id: string;
  original_name: string;
  is_folder: boolean;
  mime_type: string | null;
  size: number;
  created_at: string;
  parent_id?: string | null;
}

interface McdCryptExplorerProps {
  initialFiles: CryptFile[];
  currentFolder: any | null;
  breadcrumbs: { id: string; original_name: string }[];
}

export default function McdCryptExplorer({ initialFiles, currentFolder, breadcrumbs }: McdCryptExplorerProps) {
  const [files, setFiles] = useState<CryptFile[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isRenaming, setIsRenaming] = useState<CryptFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<CryptFile | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<CryptFile | null>(null);
  
  // Clipboard State
  const [clipboard, setClipboard] = useState<{ id: string, name: string } | null>(null);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ 
    x: number, 
    y: number, 
    file?: CryptFile, 
    isBackground?: boolean 
  } | null>(null);
  
  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const filteredFiles = files.filter(f => 
    f.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (currentFolder) formData.append("parent_id", currentFolder.id);

    const result = await uploadFile(formData);
    if (!result.success) alert(result.error);
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    const result = await createFolder(newFolderName, currentFolder?.id);
    if (result.success) {
      setIsCreatingFolder(false);
      setNewFolderName("");
      router.refresh();
    } else alert(result.error);
    setIsCreatingFolder(false);
  }

  async function handleRename() {
    if (!isRenaming || !renameValue.trim()) return;
    const result = await renameItem(isRenaming.id, renameValue);
    if (result.success) {
      setIsRenaming(null);
      router.refresh();
    } else alert(result.error);
  }

  async function handleConfirmDelete() {
    if (!isDeleting) return;
    const result = await deleteItem(isDeleting.id);
    if (result.success) {
      setIsDeleting(null);
      router.refresh();
    } else alert(result.error);
  }

  async function handlePaste() {
    if (!clipboard) return;
    setIsUploading(true);
    const result = await duplicateItem(clipboard.id, currentFolder?.id || null);
    setIsUploading(false);
    if (result.success) {
      setClipboard(null);
      router.refresh();
    } else alert(result.error);
  }

  const onItemContextMenu = (e: React.MouseEvent, file: CryptFile) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const onBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, isBackground: true });
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; 
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const onDragOver = (e: React.DragEvent, targetId?: string | null, isFolderTarget: boolean = true) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFolderTarget && targetId !== draggedId) setDragOverId(targetId || "ROOT");
    else setDragOverId(null);
  };

  const onDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    setDragOverId(null);
    setDraggedId(null);
    if (id && id !== targetFolderId) {
      setIsUploading(true); 
      const result = await moveItem(id, targetFolderId);
      setIsUploading(false);
      if (result.success) router.refresh();
      else alert("Gagal memindahkan item: " + result.error);
    }
  };

  function getFileIcon(file: CryptFile) {
    if (file.is_folder) return <Folder className="w-10 h-10 text-zinc-600 fill-zinc-600" />;
    if (file.mime_type?.startsWith("image/")) return <FileImage className="w-10 h-10 text-zinc-500" />;
    if (file.mime_type?.startsWith("video/")) return <FileVideo className="w-10 h-10 text-zinc-500" />;
    return <FileText className="w-10 h-10 text-zinc-500" />;
  }

  function formatSize(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  return (
    <div className="flex flex-col h-full relative" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, currentFolder?.id || null)}>
      {/* Header / Toolbar */}
      <div className="p-6 border-b border-zinc-900 bg-zinc-950/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <button 
                onClick={() => router.push("/admin/mcdcrypt")}
                onDragOver={(e) => onDragOver(e, "ROOT")}
                onDrop={(e) => onDrop(e, null)}
                className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all px-2 py-1 rounded-md ${dragOverId === "ROOT" ? 'bg-white text-black' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}
              >
                McdCrypt
              </button>
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-zinc-800" />
                  <button 
                    onClick={() => router.push(`/admin/mcdcrypt?folder=${crumb.id}`)}
                    onDragOver={(e) => onDragOver(e, crumb.id)}
                    onDrop={(e) => onDrop(e, crumb.id)}
                    disabled={idx === breadcrumbs.length - 1}
                    className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all px-2 py-1 rounded-md max-w-[120px] truncate ${dragOverId === crumb.id ? 'bg-white text-black' : (idx === breadcrumbs.length - 1 ? 'text-zinc-400 cursor-default' : 'text-zinc-600 hover:text-white hover:bg-white/5')}`}
                  >
                    {crumb.original_name}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
               <Lock className="w-3 h-3 text-zinc-700" />
               <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.2em]">Secure Access Environment</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-xl justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
            <input type="text" placeholder="Cari file rahasia..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/50 border border-zinc-900 rounded-2xl pl-10 pr-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsCreatingFolder(true)} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition-all flex items-center gap-2" title="New Folder">
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Folder</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-2.5 bg-white text-black hover:bg-zinc-200 rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Upload</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black" onContextMenu={onBackgroundContextMenu}>
        {filteredFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-20 h-20 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800"><Lock className="w-10 h-10 text-zinc-700" /></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">No encrypted items here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredFiles.map(file => (
              <div 
                key={file.id} draggable onDragStart={(e) => onDragStart(e, file.id)}
                onDragOver={(e) => onDragOver(e, file.id, file.is_folder)} onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => file.is_folder && onDrop(e, file.id)} onContextMenu={(e) => onItemContextMenu(e, file)}
                onDoubleClick={() => { if (file.is_folder) router.push(`/admin/mcdcrypt?folder=${file.id}`); else setPreviewFile(file); }}
                className={`group relative flex flex-col items-center border rounded-3xl p-6 transition-all duration-300 cursor-pointer select-none ${draggedId === file.id ? 'opacity-30' : 'opacity-100'} ${dragOverId === file.id ? 'bg-zinc-800/50 border-white scale-105 shadow-2xl z-10' : 'bg-zinc-950 border-zinc-900 hover:bg-white/5 hover:border-zinc-700'} ${clipboard?.id === file.id ? 'ring-2 ring-white/20 border-white/20 opacity-60 bg-white/5' : ''}`}
              >
                <div className={`mb-4 transition-transform group-hover:scale-110 duration-500 ${draggedId ? 'pointer-events-none' : ''}`}>{getFileIcon(file)}</div>
                <div className={`w-full text-center ${draggedId ? 'pointer-events-none' : ''}`}>
                  <p className="text-xs font-bold text-zinc-400 group-hover:text-white truncate" title={file.original_name}>{file.original_name}</p>
                  {!file.is_folder && <p className="text-[9px] text-zinc-700 mt-1 uppercase font-black tracking-widest">{formatSize(file.size)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Overlay Components --- */}

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-[200] w-64 glass-panel bg-zinc-950/90 border-zinc-800 p-2 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 backdrop-blur-3xl" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
          {contextMenu.isBackground ? (
            <div className="space-y-1">
              <div className="px-3 py-2 border-b border-zinc-900 mb-1"><p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Workspace Menu</p></div>
              <button onClick={() => { fileInputRef.current?.click(); setContextMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-left"><Upload className="w-3.5 h-3.5" /><span>Upload Secret File</span></button>
              <button onClick={() => { setIsCreatingFolder(true); setContextMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-left"><Plus className="w-3.5 h-3.5" /><span>Create New Folder</span></button>
              {clipboard && (
                <>
                  <div className="h-px bg-zinc-900 my-1 mx-2" />
                  <button onClick={() => { handlePaste(); setContextMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-white bg-white/5 hover:bg-white/10 transition-all text-left"><ClipboardList className="w-3.5 h-3.5" /><span className="flex-1">Paste "{clipboard.name}"</span></button>
                </>
              )}
            </div>
          ) : contextMenu.file && (
            <div className="space-y-1">
              <div className="px-3 py-2 border-b border-zinc-900 mb-1"><p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 truncate">{contextMenu.file.original_name}</p></div>
              <button onClick={() => { if (contextMenu.file!.is_folder) router.push(`/admin/mcdcrypt?folder=${contextMenu.file!.id}`); else setPreviewFile(contextMenu.file!); setContextMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-left"><Eye className="w-3.5 h-3.5" /><span>Open / View</span></button>
              <button onClick={() => { setRenameValue(contextMenu.file!.original_name); setIsRenaming(contextMenu.file!); setContextMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-left"><Edit3 className="w-3.5 h-3.5" /><span>Rename</span></button>
              <button onClick={() => { setClipboard({ id: contextMenu.file!.id, name: contextMenu.file!.original_name }); setContextMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-left"><Copy className="w-3.5 h-3.5" /><span>Copy File</span></button>
              {!contextMenu.file.is_folder && <a href={`/api/mcdcrypt/serve/${contextMenu.file.id}?download=1`} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-left"><Download className="w-3.5 h-3.5" /><span>Download Secure</span></a>}
              <div className="h-px bg-zinc-900 my-1 mx-2" />
              <button onClick={() => { setIsDeleting(contextMenu.file!); setContextMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-red-500 hover:bg-red-500/10 transition-all text-left"><Trash2 className="w-3.5 h-3.5" /><span>Delete Permanently</span></button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel bg-zinc-950 border-red-900/50 rounded-[2rem] overflow-hidden animate-in zoom-in-95">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Secure Destruction</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-8 px-4">
                Apakah Anda yakin ingin menghapus <span className="text-red-400 font-bold">"{isDeleting.original_name}"</span>? File akan dihapus secara permanen dari enkripsi.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={handleConfirmDelete}
                  className="w-full py-4 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Confirm Delete
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

      {/* Other Modals (Rename, Folder, Preview) */}
      {isRenaming && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel bg-zinc-950 border-zinc-800 rounded-[2rem] overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between"><h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rename Item</h3><button onClick={() => setIsRenaming(null)}><X className="w-4 h-4 text-zinc-600" /></button></div>
            <div className="p-8 space-y-4">
              <input autoFocus type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename()} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-white/20 transition-all" />
              <div className="flex gap-2">
                <button onClick={() => setIsRenaming(null)} className="flex-1 py-3 bg-zinc-900 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-800">Cancel</button>
                <button onClick={handleRename} className="flex-1 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-200">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreatingFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel bg-zinc-950 border-zinc-800 rounded-[2rem] overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between"><h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Create Folder</h3><button onClick={() => setIsCreatingFolder(false)}><X className="w-4 h-4 text-zinc-600" /></button></div>
            <div className="p-8 space-y-4">
              <input autoFocus type="text" placeholder="Folder Name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-white/20 transition-all" />
              <button onClick={handleCreateFolder} className="w-full py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-200">Assemble Folder</button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-2xl animate-in fade-in">
          <div className="p-6 flex items-center justify-between border-b border-white/5 bg-black/50">
            <div><h3 className="text-sm font-black uppercase tracking-widest text-white">{previewFile.original_name}</h3><p className="text-[10px] text-zinc-600 font-mono uppercase">Secure Preview • {previewFile.mime_type}</p></div>
            <button onClick={() => setPreviewFile(null)} className="p-3 bg-zinc-900 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-2xl transition-all border border-zinc-800"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
            {previewFile.mime_type?.startsWith("image/") ? (
                <img src={`/api/mcdcrypt/serve/${previewFile.id}`} alt={previewFile.original_name} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/5" />
            ) : previewFile.mime_type?.startsWith("video/") ? (
                <video src={`/api/mcdcrypt/serve/${previewFile.id}`} controls className="max-w-full max-h-full rounded-2xl border border-white/5" />
            ) : (
                <div className="flex flex-col items-center text-zinc-600 gap-4">
                  <FileIcon className="w-20 h-20" />
                  <p className="text-xs uppercase tracking-widest font-black">No Preview Available</p>
                  <a href={`/api/mcdcrypt/serve/${previewFile.id}?download=1`} className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl">Download to View</a>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
