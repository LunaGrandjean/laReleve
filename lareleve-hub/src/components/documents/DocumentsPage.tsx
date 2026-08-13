import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, FileUp, Folder, FolderPlus, Plus, Trash2 } from 'lucide-react';

interface StoredFile {
  name: string;
  data: string;
  type: string;
  addedAt: string;
}

interface FolderNode {
  name: string;
  subfolders: FolderNode[];
  files: StoredFile[];
}

interface FolderStructure {
  [key: string]: FolderNode;
}

const STORAGE_KEY = 'lareleve_documents_v1';

const defaultStructure = (): FolderStructure => ({
  paris: {
    name: 'Paris',
    subfolders: Array.from({ length: 20 }, (_, i) => ({
      name: `${i + 1}${i === 0 ? 'er' : 'ème'} arrondissement`,
      subfolders: [],
      files: [],
    })),
    files: [],
  },
  '92': {
    name: '92',
    subfolders: [
      { name: 'Boulogne-Billancourt', subfolders: [], files: [] },
      { name: 'Puteaux', subfolders: [], files: [] },
      { name: 'Sèvres', subfolders: [], files: [] },
      { name: 'Neuilly-sur-Seine', subfolders: [], files: [] },
      { name: 'Levallois-Perret', subfolders: [], files: [] },
    ],
    files: [],
  },
});

function loadDocuments(): FolderStructure {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultStructure();
}

function saveDocuments(docs: FolderStructure) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export default function DocumentsPage() {
  const [structure, setStructure] = useState<FolderStructure>(loadDocuments);
  const [path, setPath] = useState<string[]>([]);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    saveDocuments(structure);
  }, [structure]);

  const getCurrentNode = (): { subfolders: FolderNode[]; files: StoredFile[]; parent: 'root' | FolderNode } => {
    if (path.length === 0) {
      return {
        subfolders: Object.values(structure),
        files: [],
        parent: 'root',
      };
    }

    let current: FolderNode = structure[path[0].toLowerCase()] || Object.values(structure).find(f => f.name === path[0])!;
    for (let i = 1; i < path.length; i++) {
      current = current.subfolders.find(s => s.name === path[i])!;
    }
    return { subfolders: current.subfolders, files: current.files, parent: current };
  };

  const currentView = getCurrentNode();

  const updateNodeAtPath = (updater: (node: FolderNode) => FolderNode) => {
    setStructure(prev => {
      const newStructure = JSON.parse(JSON.stringify(prev)) as FolderStructure;
      if (path.length === 0) return newStructure;

      const rootKey = Object.keys(newStructure).find(k => newStructure[k].name === path[0]) || path[0].toLowerCase();
      let current = newStructure[rootKey];
      if (!current) return newStructure;

      if (path.length === 1) {
        newStructure[rootKey] = updater(current);
      } else {
        const parents: FolderNode[] = [current];
        for (let i = 1; i < path.length - 1; i++) {
          current = current.subfolders.find(s => s.name === path[i])!;
          parents.push(current);
        }
        const parentNode = parents[parents.length - 1];
        const idx = parentNode.subfolders.findIndex(s => s.name === path[path.length - 1]);
        if (idx !== -1) {
          parentNode.subfolders[idx] = updater(parentNode.subfolders[idx]);
        }
      }

      return newStructure;
    });
  };

  const addSubfolder = () => {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();

    if (path.length === 0) {
      setStructure(prev => ({
        ...prev,
        [name.toLowerCase()]: { name, subfolders: [], files: [] },
      }));
    } else {
      updateNodeAtPath(node => ({
        ...node,
        subfolders: [...node.subfolders, { name, subfolders: [], files: [] }],
      }));
    }

    setNewFolderName('');
    setShowAddFolder(false);
  };

  const handleFileUpload = (files: FileList) => {
    if (path.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        updateNodeAtPath(node => ({
          ...node,
          files: [...node.files, {
            name: file.name,
            data: reader.result as string,
            type: file.type,
            addedAt: new Date().toISOString(),
          }],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (fileName: string) => {
    updateNodeAtPath(node => ({
      ...node,
      files: node.files.filter(f => f.name !== fileName),
    }));
  };

  const removeSubfolder = (folderName: string) => {
    if (path.length === 0) {
      setStructure(prev => {
        const newS = { ...prev };
        const key = Object.keys(newS).find(k => newS[k].name === folderName);
        if (key) delete newS[key];
        return newS;
      });
    } else {
      updateNodeAtPath(node => ({
        ...node,
        subfolders: node.subfolders.filter(s => s.name !== folderName),
      }));
    }
  };

  const openFile = (file: StoredFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  return (
    <div className="page-shell">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {path.length > 0 && (
            <button onClick={() => setPath(prev => prev.slice(0, -1))} className="action-button p-2" aria-label="Retour">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="page-header">
            <h1 className="page-title">{path.length === 0 ? 'Documents' : path[path.length - 1]}</h1>
            <p className="page-subtitle">Classement des offres, pièces et documents de travail.</p>
          </div>
        </div>
      </div>

      {path.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <button onClick={() => setPath([])} className="hover:text-primary transition-default">Documents</button>
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              <span>/</span>
              <button
                onClick={() => setPath(path.slice(0, i + 1))}
                className={i === path.length - 1 ? 'font-medium text-white' : 'hover:text-primary transition-default'}
              >
                {p}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowAddFolder(true)} className="action-button-primary">
          <FolderPlus size={16} /> Nouveau dossier
        </button>
        {path.length > 0 && (
          <label className="action-button cursor-pointer">
            <FileUp size={16} /> Ajouter un fichier
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
              className="hidden"
              onChange={e => e.target.files && handleFileUpload(e.target.files)}
            />
          </label>
        )}
      </div>

      {showAddFolder && (
        <div className="premium-card flex items-center gap-2 p-3">
          <input
            autoFocus
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSubfolder()}
            placeholder="Nom du dossier..."
            className="flex-1 rounded border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={addSubfolder} className="action-button-primary">
            <Plus size={14} /> Créer
          </button>
          <button onClick={() => { setShowAddFolder(false); setNewFolderName(''); }} className="action-button">
            Annuler
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {currentView.subfolders.map(folder => (
          <div
            key={folder.name}
            className="premium-card group relative flex cursor-pointer flex-col items-center gap-2 p-4"
            onClick={() => setPath([...path, folder.name])}
          >
            <Folder size={36} className="text-primary" />
            <span className="text-center text-sm font-medium leading-tight text-white">{folder.name}</span>
            <span className="text-center text-xs text-muted-foreground">
              {folder.subfolders.length > 0 ? `${folder.subfolders.length} dossiers` : ''}
              {folder.subfolders.length > 0 && folder.files.length > 0 ? ' · ' : ''}
              {folder.files.length > 0 ? `${folder.files.length} fichiers` : ''}
            </span>
            <button
              onClick={e => { e.stopPropagation(); removeSubfolder(folder.name); }}
              className="absolute right-2 top-2 text-destructive opacity-0 transition-default hover:text-destructive/80 group-hover:opacity-100"
              title="Supprimer le dossier"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {currentView.files.map(file => (
          <div
            key={file.name + file.addedAt}
            className="premium-card group relative flex cursor-pointer flex-col items-center gap-2 p-4"
            onClick={() => openFile(file)}
          >
            <FileText size={36} className="text-muted-foreground" />
            <span className="max-w-full truncate text-center text-sm font-medium leading-tight text-white">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(file.addedAt).toLocaleDateString('fr-FR')}
            </span>
            <button
              onClick={e => { e.stopPropagation(); removeFile(file.name); }}
              className="absolute right-2 top-2 text-destructive opacity-0 transition-default hover:text-destructive/80 group-hover:opacity-100"
              title="Supprimer le fichier"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {currentView.subfolders.length === 0 && currentView.files.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <Folder size={48} className="mx-auto mb-3 opacity-30" />
          <p>Ce dossier est vide</p>
        </div>
      )}
    </div>
  );
}
