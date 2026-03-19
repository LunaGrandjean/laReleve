import { useState, useEffect } from 'react';
import { Folder, FolderPlus, FileUp, FileText, Trash2, ArrowLeft, Plus } from 'lucide-react';

interface StoredFile {
  name: string;
  data: string; // base64
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
  const [path, setPath] = useState<string[]>([]); // breadcrumb path
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    saveDocuments(structure);
  }, [structure]);

  // Navigate to current node
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
      // Add top-level folder
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {path.length > 0 && (
            <button
              onClick={() => setPath(prev => prev.slice(0, -1))}
              className="p-2 rounded-md hover:bg-secondary transition-default"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {path.length === 0 ? 'Documents' : path[path.length - 1]}
          </h1>
        </div>
      </div>

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
          <label className="flex items-center gap-2 px-4 py-2 bg-noir text-primary-foreground rounded-lg text-sm font-medium hover:bg-noir-light transition-default cursor-pointer">
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
          <button onClick={addSubfolder} className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium">
            Créer
          </button>
          <button onClick={() => { setShowAddFolder(false); setNewFolderName(''); }} className="px-3 py-2 bg-secondary rounded text-sm">
            Annuler
          </button>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {currentView.subfolders.map(folder => (
          <div
            key={folder.name}
            className="group relative bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary hover:shadow-md transition-default cursor-pointer"
            onClick={() => setPath([...path, folder.name])}
          >
            <Folder size={36} className="text-primary" />
            <span className="text-sm font-medium text-center leading-tight">{folder.name}</span>
            <span className="text-xs text-muted-foreground">
              {folder.subfolders.length > 0 ? `${folder.subfolders.length} dossiers` : ''}
              {folder.subfolders.length > 0 && folder.files.length > 0 ? ' · ' : ''}
              {folder.files.length > 0 ? `${folder.files.length} fichiers` : ''}
            </span>
            <button
              onClick={e => { e.stopPropagation(); removeSubfolder(folder.name); }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-default"
              title="Supprimer le dossier"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {currentView.files.map(file => (
          <div
            key={file.name + file.addedAt}
            className="group relative bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary hover:shadow-md transition-default cursor-pointer"
            onClick={() => openFile(file)}
          >
            <FileText size={36} className="text-muted-foreground" />
            <span className="text-sm font-medium text-center leading-tight truncate max-w-full">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(file.addedAt).toLocaleDateString('fr-FR')}
            </span>
            <button
              onClick={e => { e.stopPropagation(); removeFile(file.name); }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-default"
              title="Supprimer le fichier"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {currentView.subfolders.length === 0 && currentView.files.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Folder size={48} className="mx-auto mb-3 opacity-30" />
          <p>Ce dossier est vide</p>
        </div>
      )}
    </div>
  );
}
