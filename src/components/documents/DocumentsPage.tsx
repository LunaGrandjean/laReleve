import { useState, useEffect, useCallback } from 'react';
import {
  Folder, FolderPlus, FileUp, FileText, Trash2, ArrowLeft,
  HardDrive, AlertTriangle, CheckCircle2, Eye, FolderOpen
} from 'lucide-react';
import {
  isFileSystemAccessSupported,
  chooseDirectory,
  getDirectoryHandle,
  verifyPermission,
  saveFileToDirectory,
  getFileFromDirectory,
  deleteFileFromDirectory,
  getDocsMeta,
  addDocMeta,
  removeDocMeta,
  generateStoredName,
  type DocMeta,
} from '@/lib/localFolderDocs';

// ── Folder structure (metadata only, no file content) ──────────────────────

interface FolderNode {
  name: string;
  subfolders: FolderNode[];
}

interface FolderStructure {
  [key: string]: FolderNode;
}

const FOLDER_STRUCTURE_KEY = 'lareleve_folder_structure_v1';

const defaultStructure = (): FolderStructure => ({
  paris: {
    name: 'Paris',
    subfolders: Array.from({ length: 20 }, (_, i) => ({
      name: `${i + 1}${i === 0 ? 'er' : 'ème'} arrondissement`,
      subfolders: [],
    })),
  },
  '92': {
    name: '92',
    subfolders: [
      { name: 'Boulogne-Billancourt', subfolders: [] },
      { name: 'Puteaux', subfolders: [] },
      { name: 'Sèvres', subfolders: [] },
      { name: 'Neuilly-sur-Seine', subfolders: [] },
      { name: 'Levallois-Perret', subfolders: [] },
    ],
  },
});

function loadFolderStructure(): FolderStructure {
  try {
    const raw = localStorage.getItem(FOLDER_STRUCTURE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultStructure();
}

function saveFolderStructure(s: FolderStructure) {
  localStorage.setItem(FOLDER_STRUCTURE_KEY, JSON.stringify(s));
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [structure, setStructure] = useState<FolderStructure>(loadFolderStructure);
  const [path, setPath] = useState<string[]>([]);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // File System Access state
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [permOk, setPermOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocMeta[]>([]);

  const supported = isFileSystemAccessSupported();
  const offerId = path.join('/'); // use folder path as offerId

  // Persist folder structure
  useEffect(() => {
    saveFolderStructure(structure);
  }, [structure]);

  // Restore directory handle on mount
  useEffect(() => {
    (async () => {
      if (!supported) { setLoading(false); return; }
      const handle = await getDirectoryHandle();
      if (handle) {
        const ok = await verifyPermission(handle);
        setDirHandle(handle);
        setPermOk(ok);
      }
      setLoading(false);
    })();
  }, [supported]);

  // Load docs metadata when path changes
  useEffect(() => {
    (async () => {
      const all = await getDocsMeta();
      setDocs(all);
    })();
  }, [path]);

  const currentDocs = docs.filter(d => d.offerId === offerId);

  const handleChooseDir = useCallback(async () => {
    try {
      const handle = await chooseDirectory();
      const ok = await verifyPermission(handle);
      setDirHandle(handle);
      setPermOk(ok);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('Erreur sélection dossier:', e);
      }
    }
  }, []);

  // ── Folder navigation ────────────────────────────────────────────────────

  const getCurrentNode = (): { subfolders: FolderNode[]; parent: 'root' | FolderNode } => {
    if (path.length === 0) {
      return { subfolders: Object.values(structure), parent: 'root' };
    }
    let current: FolderNode = structure[path[0].toLowerCase()] || Object.values(structure).find(f => f.name === path[0])!;
    for (let i = 1; i < path.length; i++) {
      current = current.subfolders.find(s => s.name === path[i])!;
    }
    return { subfolders: current.subfolders, parent: current };
  };

  const currentView = getCurrentNode();

  const updateNodeAtPath = (updater: (node: FolderNode) => FolderNode) => {
    setStructure(prev => {
      const ns = JSON.parse(JSON.stringify(prev)) as FolderStructure;
      if (path.length === 0) return ns;
      const rootKey = Object.keys(ns).find(k => ns[k].name === path[0]) || path[0].toLowerCase();
      let current = ns[rootKey];
      if (!current) return ns;
      if (path.length === 1) {
        ns[rootKey] = updater(current);
      } else {
        const parents: FolderNode[] = [current];
        for (let i = 1; i < path.length - 1; i++) {
          current = current.subfolders.find(s => s.name === path[i])!;
          parents.push(current);
        }
        const parentNode = parents[parents.length - 1];
        const idx = parentNode.subfolders.findIndex(s => s.name === path[path.length - 1]);
        if (idx !== -1) parentNode.subfolders[idx] = updater(parentNode.subfolders[idx]);
      }
      return ns;
    });
  };

  const addSubfolder = () => {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();
    if (path.length === 0) {
      setStructure(prev => ({ ...prev, [name.toLowerCase()]: { name, subfolders: [] } }));
    } else {
      updateNodeAtPath(node => ({ ...node, subfolders: [...node.subfolders, { name, subfolders: [] }] }));
    }
    setNewFolderName('');
    setShowAddFolder(false);
  };

  const removeSubfolder = (folderName: string) => {
    if (path.length === 0) {
      setStructure(prev => {
        const ns = { ...prev };
        const key = Object.keys(ns).find(k => ns[k].name === folderName);
        if (key) delete ns[key];
        return ns;
      });
    } else {
      updateNodeAtPath(node => ({ ...node, subfolders: node.subfolders.filter(s => s.name !== folderName) }));
    }
  };

  // ── File operations ──────────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!dirHandle || !permOk || path.length === 0) return;
    for (const file of Array.from(files)) {
      const storedName = generateStoredName(file.name);
      await saveFileToDirectory(dirHandle, file, storedName);
      const meta: DocMeta = {
        id: crypto.randomUUID(),
        offerId,
        originalName: file.name,
        storedName,
        type: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
      };
      await addDocMeta(meta);
    }
    setDocs(await getDocsMeta());
  }, [dirHandle, permOk, offerId, path.length]);

  const handleOpenFile = useCallback(async (doc: DocMeta) => {
    if (!dirHandle) return;
    const ok = await verifyPermission(dirHandle);
    if (!ok) { setPermOk(false); return; }
    const file = await getFileFromDirectory(dirHandle, doc.storedName);
    if (!file) { alert('Fichier introuvable dans le dossier local.'); return; }
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  }, [dirHandle]);

  const handleDeleteFile = useCallback(async (doc: DocMeta) => {
    if (!dirHandle) return;
    await deleteFileFromDirectory(dirHandle, doc.storedName);
    await removeDocMeta(doc.id);
    setDocs(await getDocsMeta());
  }, [dirHandle]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {path.length > 0 && (
            <button onClick={() => setPath(prev => prev.slice(0, -1))} className="p-2 rounded-md hover:bg-secondary transition-default">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {path.length === 0 ? 'Documents' : path[path.length - 1]}
          </h1>
        </div>
      </div>

      {/* Browser support warning */}
      {!supported && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Navigateur non compatible</p>
            <p className="text-sm mt-1">
              La gestion de fichiers locaux nécessite <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> sur ordinateur.
            </p>
          </div>
        </div>
      )}

      {/* Directory picker */}
      {supported && (
        <div className="flex items-center gap-4 flex-wrap p-4 rounded-lg border border-border bg-card">
          <HardDrive size={20} className="text-primary shrink-0" />
          {dirHandle && permOk ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" />
              <span className="text-sm truncate">
                Dossier local : <strong>{dirHandle.name}</strong>
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground flex-1">
              Les documents seront enregistrés localement sur cet ordinateur. Choisissez un dossier pour commencer.
            </p>
          )}
          <button
            onClick={handleChooseDir}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-default shrink-0"
          >
            <FolderOpen size={16} />
            {dirHandle ? 'Changer de dossier' : 'Choisir un dossier'}
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      {path.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <button onClick={() => setPath([])} className="hover:text-primary transition-default">Documents</button>
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              <span>/</span>
              <button
                onClick={() => setPath(path.slice(0, i + 1))}
                className={i === path.length - 1 ? 'text-foreground font-medium' : 'hover:text-primary transition-default'}
              >
                {p}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowAddFolder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-default"
        >
          <FolderPlus size={16} /> Nouveau dossier
        </button>
        {path.length > 0 && (
          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-default ${
              dirHandle && permOk
                ? 'bg-noir text-primary-foreground hover:bg-noir-light cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <FileUp size={16} /> Ajouter un fichier
            <input
              type="file"
              multiple
              disabled={!dirHandle || !permOk}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
              className="hidden"
              onChange={e => e.target.files && handleFileUpload(e.target.files)}
            />
          </label>
        )}
      </div>

      {/* Disabled upload hint */}
      {path.length > 0 && (!dirHandle || !permOk) && supported && (
        <p className="text-xs text-muted-foreground italic">
          ⚠ Choisissez un dossier local ci-dessus pour pouvoir ajouter des fichiers.
        </p>
      )}

      {/* Add folder dialog */}
      {showAddFolder && (
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-3">
          <input
            autoFocus
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSubfolder()}
            placeholder="Nom du dossier..."
            className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={addSubfolder} className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium">Créer</button>
          <button onClick={() => { setShowAddFolder(false); setNewFolderName(''); }} className="px-3 py-2 bg-secondary rounded text-sm">Annuler</button>
        </div>
      )}

      {/* Folders grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {currentView.subfolders.map(folder => (
          <div
            key={folder.name}
            className="group relative bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary hover:shadow-md transition-default cursor-pointer"
            onClick={() => setPath([...path, folder.name])}
          >
            <Folder size={36} className="text-primary" />
            <span className="text-sm font-medium text-center leading-tight">{folder.name}</span>
            {folder.subfolders.length > 0 && (
              <span className="text-xs text-muted-foreground">{folder.subfolders.length} dossiers</span>
            )}
            <button
              onClick={e => { e.stopPropagation(); removeSubfolder(folder.name); }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-default"
              title="Supprimer le dossier"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Files list for current folder */}
      {path.length > 0 && currentDocs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fichiers</h2>
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-card">
            {currentDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <FileText size={20} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(doc.size / 1024).toFixed(1)} Ko · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenFile(doc)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-primary/10 text-primary hover:bg-primary/20 transition-default"
                >
                  <Eye size={14} /> Ouvrir
                </button>
                <button
                  onClick={() => handleDeleteFile(doc)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-default"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {currentView.subfolders.length === 0 && currentDocs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Folder size={48} className="mx-auto mb-3 opacity-30" />
          <p>Ce dossier est vide</p>
        </div>
      )}
    </div>
  );
}
