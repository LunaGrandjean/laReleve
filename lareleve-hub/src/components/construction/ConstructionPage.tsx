import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Bold, ChevronRight, DoorOpen, FileText, Italic, List, ListOrdered, Plus, Trash2, Underline } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConstructionView = 'chantier' | 'budget' | 'commentaires' | 'reunions';

interface ConstructionMeta {
  operation: string;
  maitreOuvrage: string;
  maitreOeuvre: string;
  updatedAt: string;
}

interface ChantierPiece {
  id: string;
  name: string;
}

interface ChantierTask {
  id: string;
  piece: string;
  lot: string;
  entreprise: string;
  description: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  dateDebutReelle: string;
  dateFinReelle: string;
  dureePrevue: string;
  avancement: string;
  statut: string;
  responsable: string;
  observations: string;
}

interface BudgetRow {
  id: string;
  numeroFacture: string;
  entreprise: string;
  description: string;
  montant: string;
  avenant: string;
  resteAPayer: string;
  resteAPayerMontant: string;
}

interface MeetingNote {
  id: string;
  title: string;
  date: string;
  content: string;
}

interface ConstructionData {
  meta: ConstructionMeta;
  pieces: ChantierPiece[];
  tasks: ChantierTask[];
  budgets: BudgetRow[];
  budgetPrevisionnel: string;
  globalNotes: string;
  meetings: MeetingNote[];
}

interface ConstructionProject extends ConstructionData {
  id: string;
  createdAt: string;
}

const STORAGE_KEY = 'lareleve_chantier_v1';

const defaultPieceNames = [
  'Entrée / Couloir',
  'Cuisine',
  'Salle de bain',
  'WC',
  'Séjour / Salon',
  'Chambre 1',
  'Chambre 2',
  'Chambre 3',
  'Bureau',
  'Dressing',
  'Balcon / Terrasse',
  'Parties communes',
];

const lots = [
  'Démolition',
  'Plomberie',
  'Électricité',
  'Revêtements',
  'Menuiserie / Agencement',
  'Cloisons / Doublages',
  'Revêtements sols',
  'Peinture',
  'Finitions / Nettoyage',
];

const taskStatuses = ['À venir', 'En cours', 'En retard', 'Terminé'];

const defaultPieces = (): ChantierPiece[] => defaultPieceNames.map(name => ({
  id: crypto.randomUUID?.() || `${Date.now()}-${name}`,
  name,
}));

function emptyTask(id: string, piece: string): ChantierTask {
  return {
    id,
    piece,
    lot: '',
    entreprise: '',
    description: '',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    dateDebutReelle: '',
    dateFinReelle: '',
    dureePrevue: '',
    avancement: '0',
    statut: 'À venir',
    responsable: '',
    observations: '',
  };
}

const initialData = (meta?: Partial<ConstructionMeta>): ConstructionData => ({
  meta: {
    operation: "[Adresse de l'appartement]",
    maitreOuvrage: '[Nom]',
    maitreOeuvre: '[Nom du MOE]',
    updatedAt: new Date().toISOString().slice(0, 10),
    ...meta,
  },
  pieces: defaultPieces(),
  tasks: [],
  budgets: [],
  budgetPrevisionnel: '',
  globalNotes: '',
  meetings: [],
});

function createProject(meta: Partial<ConstructionMeta>): ConstructionProject {
  const now = new Date().toISOString();
  return {
    id: Date.now().toString(),
    createdAt: now,
    ...initialData(meta),
  };
}

function normalizeProject(project: Partial<ConstructionProject> & { reserves?: unknown }): ConstructionProject {
  const fallback = initialData();
  const tasks = (project.tasks || []).map(task => ({
    ...task,
    statut: task.statut || getTaskStatus(task),
  }));
  const pieces = normalizePieces(project.pieces, tasks);

  return {
    id: project.id || Date.now().toString(),
    createdAt: project.createdAt || new Date().toISOString(),
    meta: { ...fallback.meta, ...project.meta },
    pieces,
    tasks,
    budgets: normalizeBudgets(project.budgets || []),
    budgetPrevisionnel: project.budgetPrevisionnel || '',
    globalNotes: project.globalNotes || '',
    meetings: normalizeMeetings(project.meetings || []),
  };
}

function normalizePieces(projectPieces: ChantierPiece[] | undefined, tasks: ChantierTask[]): ChantierPiece[] {
  const existing = Array.isArray(projectPieces) && projectPieces.length ? projectPieces : defaultPieces();
  const names = new Set(existing.map(piece => piece.name));
  const taskPieces = tasks
    .map(task => task.piece)
    .filter(Boolean)
    .filter(piece => !names.has(piece));

  return [
    ...existing,
    ...Array.from(new Set(taskPieces)).map(name => ({ id: `piece-${name}`, name })),
  ];
}

function loadProjects(): ConstructionProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data.map(normalizeProject);
      if (data.projects && Array.isArray(data.projects)) return data.projects.map(normalizeProject);
      if (data.meta || data.tasks || data.budgets || data.reserves) return [normalizeProject(data)];
    }
  } catch {}
  return [];
}

export default function ConstructionPage() {
  const [projects, setProjects] = useState<ConstructionProject[]>(loadProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [view, setView] = useState<ConstructionView>('chantier');
  const data = projects.find(project => project.id === selectedProjectId);
  const activeData = data || initialData();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const updateProject = (updater: (project: ConstructionProject) => ConstructionProject) => {
    if (!selectedProjectId) return;
    setProjects(prev => prev.map(project => (project.id === selectedProjectId ? updater(project) : project)));
  };

  const handleCreateProject = (meta: Partial<ConstructionMeta>) => {
    const project = createProject(meta);
    setProjects(prev => [...prev, project]);
    setSelectedProjectId(project.id);
    setSelectedPiece(null);
    setView('chantier');
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
      setSelectedPiece(null);
    }
  };

  const roomSummary = useMemo(() => buildRoomSummary(activeData.pieces, activeData.tasks), [activeData.pieces, activeData.tasks]);

  if (!data) {
    return (
      <ConstructionProjectsList
        projects={projects}
        onCreate={handleCreateProject}
        onOpen={id => {
          setSelectedProjectId(id);
          setSelectedPiece(null);
          setView('chantier');
        }}
        onDelete={deleteProject}
        onUpdateMeta={(id, key, value) => {
          setProjects(prev => prev.map(project => (
            project.id === id ? { ...project, meta: { ...project.meta, [key]: value } } : project
          )));
        }}
      />
    );
  }

  const updateNotes = (value: string) => {
    updateProject(prev => ({ ...prev, globalNotes: value }));
  };

  const addMeeting = () => {
    updateProject(prev => ({
      ...prev,
      meetings: [...prev.meetings, emptyMeeting(prev.meetings.length + 1)],
    }));
  };

  const updateMeeting = (id: string, key: keyof MeetingNote, value: string) => {
    updateProject(prev => ({
      ...prev,
      meetings: prev.meetings.map(meeting => (meeting.id === id ? { ...meeting, [key]: value } : meeting)),
    }));
  };

  const deleteMeeting = (id: string) => {
    updateProject(prev => ({ ...prev, meetings: prev.meetings.filter(meeting => meeting.id !== id) }));
  };

  const updateBudgetPrevisionnel = (value: string) => {
    updateProject(prev => ({ ...prev, budgetPrevisionnel: value }));
  };

  const updateTask = (id: string, key: keyof ChantierTask, value: string) => {
    updateProject(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === id ? { ...t, [key]: value } : t)),
    }));
  };

  const updateBudget = (id: string, key: keyof BudgetRow, value: string) => {
    updateProject(prev => ({
      ...prev,
      budgets: prev.budgets.map(b => (b.id === id ? { ...b, [key]: value } : b)),
    }));
  };

  const addBudget = () => {
    updateProject(prev => ({ ...prev, budgets: [...prev.budgets, emptyBudget()] }));
  };

  const deleteBudget = (id: string) => {
    updateProject(prev => ({ ...prev, budgets: prev.budgets.filter(b => b.id !== id) }));
  };

  const addPiece = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const id = `${Date.now()}-${cleanName}`;
    updateProject(prev => ({ ...prev, pieces: [...prev.pieces, { id, name: cleanName }] }));
    setSelectedPiece(cleanName);
  };

  const deletePiece = (pieceName: string) => {
    updateProject(prev => ({
      ...prev,
      pieces: prev.pieces.filter(piece => piece.name !== pieceName),
      tasks: prev.tasks.filter(task => task.piece !== pieceName),
    }));
    if (selectedPiece === pieceName) setSelectedPiece(null);
  };

  const addTask = (pieceName: string) => {
    updateProject(prev => {
      const id = Date.now().toString();
      return {
        ...prev,
        tasks: [...prev.tasks, emptyTask(id, pieceName)],
      };
    });
  };

  const deleteTask = (id: string) => {
    updateProject(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
    }));
  };

  const selectedPieceTasks = selectedPiece ? data.tasks.filter(task => task.piece === selectedPiece) : [];

  return (
    <div className="page-shell max-w-full overflow-hidden">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button onClick={() => setSelectedProjectId(null)} className="p-2 rounded-md hover:bg-secondary transition-default" title="Retour aux chantiers">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">{data.meta.operation || 'Suivi chantier'}</h1>
              <p className="page-subtitle">Dossier chantier par pièce</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-border">
          {[
            ['chantier', 'Suivi chantier'],
            ['budget', 'Suivi budgétaire'],
            ['commentaires', 'Commentaire global'],
            ['reunions', 'Suivi réunion'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id as ConstructionView)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-default',
                view === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'chantier' && !selectedPiece && (
        <PiecesDashboard pieces={data.pieces} summary={roomSummary} onOpen={setSelectedPiece} onAdd={addPiece} onDelete={deletePiece} />
      )}
      {view === 'chantier' && selectedPiece && (
        <PieceTable
          piece={selectedPiece}
          tasks={selectedPieceTasks}
          onBack={() => setSelectedPiece(null)}
          onUpdate={updateTask}
          onAdd={() => addTask(selectedPiece)}
          onDelete={deleteTask}
        />
      )}
      {view === 'budget' && (
        <BudgetTable
          budgets={data.budgets}
          budgetPrevisionnel={data.budgetPrevisionnel}
          onBudgetPrevisionnelChange={updateBudgetPrevisionnel}
          onUpdate={updateBudget}
          onAdd={addBudget}
          onDelete={deleteBudget}
        />
      )}
      {view === 'commentaires' && <GlobalComments value={data.globalNotes} onChange={updateNotes} />}
      {view === 'reunions' && (
        <MeetingTracker meetings={data.meetings} onAdd={addMeeting} onUpdate={updateMeeting} onDelete={deleteMeeting} />
      )}
    </div>
  );
}

function ConstructionProjectsList({ projects, onCreate, onOpen, onDelete, onUpdateMeta }: {
  projects: ConstructionProject[];
  onCreate: (meta: Partial<ConstructionMeta>) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateMeta: (id: string, key: keyof ConstructionMeta, value: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [operation, setOperation] = useState('');
  const [maitreOuvrage, setMaitreOuvrage] = useState('');
  const [maitreOeuvre, setMaitreOeuvre] = useState('');
  const [updatedAt, setUpdatedAt] = useState(new Date().toISOString().slice(0, 10));
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = () => {
    if (!operation.trim()) return;
    onCreate({
      operation: operation.trim(),
      maitreOuvrage: maitreOuvrage.trim() || '[Nom]',
      maitreOeuvre: maitreOeuvre.trim() || '[Nom du MOE]',
      updatedAt,
    });
    setOperation('');
    setMaitreOuvrage('');
    setMaitreOeuvre('');
    setUpdatedAt(new Date().toISOString().slice(0, 10));
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Suivi chantier</h1>
          <p className="page-subtitle">Crée un dossier par opération, puis ouvre le suivi par pièce.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="action-button-primary"
        >
          <Plus size={16} /> Ajouter un chantier
        </button>
      </div>

      {showForm && (
        <div className="premium-card space-y-4 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <MetaInput label="Opération" value={operation} onChange={setOperation} />
            <MetaInput label="Maître d'ouvrage" value={maitreOuvrage} onChange={setMaitreOuvrage} />
            <MetaInput label="Maître d'oeuvre" value={maitreOeuvre} onChange={setMaitreOeuvre} />
            <MetaInput label="Mise à jour" type="date" value={updatedAt} onChange={setUpdatedAt} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} className="action-button-primary">
              Créer le chantier
            </button>
            <button onClick={() => setShowForm(false)} className="action-button">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(project => (
          <div key={project.id} className="premium-card p-5">
            <div className="space-y-3">
              <MetaInput label="Opération" value={project.meta.operation} onChange={v => onUpdateMeta(project.id, 'operation', v)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <MetaInput label="Maître d'ouvrage" value={project.meta.maitreOuvrage} onChange={v => onUpdateMeta(project.id, 'maitreOuvrage', v)} />
                <MetaInput label="Maître d'oeuvre" value={project.meta.maitreOeuvre} onChange={v => onUpdateMeta(project.id, 'maitreOeuvre', v)} />
              </div>
              <MetaInput label="Mise à jour" type="date" value={project.meta.updatedAt} onChange={v => onUpdateMeta(project.id, 'updatedAt', v)} />
            </div>
            <div className="grid grid-cols-3 gap-2 my-4 text-center">
              <MiniStat label="Pièces" value={project.pieces.length} />
              <MiniStat label="Tâches" value={project.tasks.length} />
              <MiniStat label="Budget" value={formatEuro(totalBudget(project))} />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button onClick={() => onOpen(project.id)} className="flex items-center gap-1 text-primary font-medium text-sm hover:underline">
                Ouvrir <ChevronRight size={14} />
              </button>
              <button
                onClick={() => handleDelete(project.id)}
                className={cn('flex items-center gap-1 text-sm font-medium transition-default', confirmDelete === project.id ? 'text-destructive' : 'text-muted-foreground hover:text-destructive')}
              >
                <Trash2 size={14} />
                {confirmDelete === project.id ? 'Confirmer ?' : 'Supprimer'}
              </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">
            Aucun chantier. Clique sur Ajouter un chantier pour créer ton premier dossier.
          </p>
        )}
      </div>
    </div>
  );
}

function PiecesDashboard({ pieces, summary, onOpen, onAdd, onDelete }: {
  pieces: ChantierPiece[];
  summary: RoomSummary[];
  onOpen: (piece: string) => void;
  onAdd: (name: string) => void;
  onDelete: (piece: string) => void;
}) {
  const [newPiece, setNewPiece] = useState('');
  const summaryByPiece = new Map(summary.map(row => [row.piece, row]));

  const handleAdd = () => {
    onAdd(newPiece);
    setNewPiece('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">01 — Pièces du chantier</h2>
          <p className="text-sm text-muted-foreground">Clique sur une pièce pour ouvrir son tableau de suivi.</p>
        </div>
        <div className="flex gap-2">
          <input
            value={newPiece}
            onChange={e => setNewPiece(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="Nouvelle pièce"
            className="w-48 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={handleAdd} className="action-button-primary">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {pieces.map(piece => {
          const row = summaryByPiece.get(piece.name);
          const progress = Math.round(row?.progress || 0);
          return (
            <div
              key={piece.id}
              className="premium-card group relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
              <button onClick={() => onOpen(piece.name)} className="w-full p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <DoorOpen size={20} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{piece.name}</h3>
                      <p className="text-xs text-muted-foreground">{row?.tasks || 0} tâche{(row?.tasks || 0) > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <ChevronRight size={17} className="text-muted-foreground group-hover:text-primary transition-default" />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Avancement</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-default" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </button>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete(piece.name);
                }}
                className="absolute bottom-3 right-3 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-default"
                title="Supprimer la pièce"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PieceTable({ piece, tasks, onBack, onUpdate, onAdd, onDelete }: {
  piece: string;
  tasks: ChantierTask[];
  onBack: () => void;
  onUpdate: (id: string, key: keyof ChantierTask, value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-default">
          <ArrowLeft size={16} /> Retour aux pièces
        </button>
      </div>

      <div className="premium-card p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <DoorOpen size={20} />
          </span>
          <div>
            <h2 className="text-xl font-semibold">{piece}</h2>
            <p className="text-sm text-muted-foreground">{tasks.length} ligne{tasks.length > 1 ? 's' : ''} dans le suivi</p>
          </div>
        </div>
      </div>

      <div className="table-shell">
        <table className="w-full min-w-[1320px] text-sm text-left">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {['N°', "Lot / Corps d'état", 'Entreprise', 'Tâche / Description', 'Début prévu', 'Fin prévue', 'Début réel', 'Fin réelle', 'Durée (j)', 'Avancement (%)', 'Retard (j)', 'Statut', 'Responsable suivi', 'Observations', ''].map(h => (
                <th key={h} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((t, i) => {
              const delay = getDelay(t);
              return (
                <tr key={t.id} className="hover:bg-secondary/30 transition-default">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2"><Select value={t.lot} options={lots} onChange={v => onUpdate(t.id, 'lot', v)} /></td>
                  <td className="px-3 py-2"><Input value={t.entreprise} onChange={v => onUpdate(t.id, 'entreprise', v)} /></td>
                  <td className="px-3 py-2"><Textarea value={t.description} onChange={v => onUpdate(t.id, 'description', v)} /></td>
                  <td className="px-3 py-2"><Input type="date" value={t.dateDebutPrevue} onChange={v => onUpdate(t.id, 'dateDebutPrevue', v)} /></td>
                  <td className="px-3 py-2"><Input type="date" value={t.dateFinPrevue} onChange={v => onUpdate(t.id, 'dateFinPrevue', v)} /></td>
                  <td className="px-3 py-2"><Input type="date" value={t.dateDebutReelle} onChange={v => onUpdate(t.id, 'dateDebutReelle', v)} /></td>
                  <td className="px-3 py-2"><Input type="date" value={t.dateFinReelle} onChange={v => onUpdate(t.id, 'dateFinReelle', v)} /></td>
                  <td className="px-3 py-2"><Input type="number" value={t.dureePrevue} onChange={v => onUpdate(t.id, 'dureePrevue', v)} className="w-20" /></td>
                  <td className="px-3 py-2"><ProgressInput value={t.avancement} onChange={v => onUpdate(t.id, 'avancement', v)} /></td>
                  <td className="px-3 py-2 font-medium">{delay}</td>
                  <td className="px-3 py-2">
                    <StatusSelect value={t.statut || getTaskStatus(t)} onChange={v => onUpdate(t.id, 'statut', v)} />
                  </td>
                  <td className="px-3 py-2"><Input value={t.responsable} onChange={v => onUpdate(t.id, 'responsable', v)} /></td>
                  <td className="px-3 py-2"><Textarea value={t.observations} onChange={v => onUpdate(t.id, 'observations', v)} /></td>
                  <td className="px-3 py-2">
                    <button onClick={() => onDelete(t.id)} className="text-destructive hover:text-destructive/80 transition-default" title="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={15} className="px-3 py-10 text-center text-muted-foreground">
                  Aucune ligne pour cette pièce. Clique sur Ajouter une ligne pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button onClick={onAdd} className="action-button-primary">
        <Plus size={16} /> Ajouter une ligne
      </button>
    </div>
  );
}

function BudgetTable({ budgets, budgetPrevisionnel, onBudgetPrevisionnelChange, onUpdate, onAdd, onDelete }: {
  budgets: BudgetRow[];
  budgetPrevisionnel: string;
  onBudgetPrevisionnelChange: (value: string) => void;
  onUpdate: (id: string, key: keyof BudgetRow, value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const summary = buildBudgetSummary(budgets);

  return (
    <div className="space-y-4">
      <BudgetSummary summary={summary} budgetPrevisionnel={budgetPrevisionnel} onBudgetPrevisionnelChange={onBudgetPrevisionnelChange} />
      <div className="table-shell">
        <table className="w-full min-w-[980px] text-sm text-left">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {['N°', 'Numéro de facture', 'Entreprise', 'Description', 'Montant', 'Avenant', 'Reste à payer', 'Montant restant', ''].map(h => (
                <th key={h} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {budgets.map((b, i) => (
              <tr key={b.id} className="hover:bg-secondary/30 transition-default">
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2"><Input value={b.numeroFacture} onChange={v => onUpdate(b.id, 'numeroFacture', v)} /></td>
                <td className="px-3 py-2"><Input value={b.entreprise} onChange={v => onUpdate(b.id, 'entreprise', v)} /></td>
                <td className="px-3 py-2"><Textarea value={b.description} onChange={v => onUpdate(b.id, 'description', v)} /></td>
                <td className="px-3 py-2"><Input type="number" value={b.montant} onChange={v => onUpdate(b.id, 'montant', v)} /></td>
                <td className="px-3 py-2"><Input type="number" value={b.avenant} onChange={v => onUpdate(b.id, 'avenant', v)} /></td>
                <td className="px-3 py-2"><Select value={b.resteAPayer} options={['Non', 'Oui']} onChange={v => onUpdate(b.id, 'resteAPayer', v)} /></td>
                <td className="px-3 py-2">
                  {b.resteAPayer === 'Oui' ? (
                    <Input type="number" value={b.resteAPayerMontant} onChange={v => onUpdate(b.id, 'resteAPayerMontant', v)} />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => onDelete(b.id)} className="text-destructive hover:text-destructive/80 transition-default" title="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {budgets.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                  Aucune ligne budgétaire. Clique sur Ajouter une ligne pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button onClick={onAdd} className="action-button-primary">
        <Plus size={16} /> Ajouter une ligne
      </button>
    </div>
  );
}

function BudgetSummary({ summary, budgetPrevisionnel, onBudgetPrevisionnelChange }: {
  summary: BudgetSummaryData;
  budgetPrevisionnel: string;
  onBudgetPrevisionnelChange: (value: string) => void;
}) {
  return (
    <div className="premium-card flex flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 text-sm">
      <BudgetSummaryInput label="Budget prévisionnel" value={budgetPrevisionnel} onChange={onBudgetPrevisionnelChange} />
      <BudgetSummaryItem label="Factures" value={summary.count.toString().padStart(2, '0')} tone="neutral" />
      <BudgetSummaryItem label="Avenant" value={`${summary.avenants >= 0 ? '+ ' : '- '}${formatEuro(Math.abs(summary.avenants))}`} tone={summary.avenants >= 0 ? 'positive' : 'negative'} />
      <BudgetSummaryItem label="Reste à payer" value={`- ${formatEuro(summary.resteAPayer)}`} tone={summary.resteAPayer > 0 ? 'negative' : 'positive'} />
      <BudgetSummaryItem label="Total payé" value={`+ ${formatEuro(summary.paye)}`} tone={summary.paye >= 0 ? 'positive' : 'negative'} />
    </div>
  );
}

function BudgetSummaryInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-28 rounded border border-white/[0.08] bg-white/[0.05] px-2 py-1 text-sm font-semibold tabular-nums text-white focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="0"
      />
    </label>
  );
}

function BudgetSummaryItem({ label, value, tone }: { label: string; value: string; tone: 'positive' | 'negative' | 'neutral' }) {
  const toneClass =
    tone === 'positive'
      ? 'text-green-300'
      : tone === 'negative'
        ? 'text-red-300'
        : 'text-white';

  return (
    <div className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tabular-nums', toneClass)}>{value}</span>
    </div>
  );
}

function GlobalComments({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileText size={20} />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Commentaire global</h2>
          <p className="text-sm text-muted-foreground">Notes libres, pense-bêtes, points à vérifier.</p>
        </div>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="min-h-[420px] w-full rounded-lg border border-white/[0.08] bg-white/[0.05] p-4 text-sm leading-6 text-white shadow-card focus:outline-none focus:ring-1 focus:ring-primary resize-y"
        placeholder="Écrire les notes du chantier..."
      />
    </div>
  );
}

function MeetingTracker({ meetings, onAdd, onUpdate, onDelete }: {
  meetings: MeetingNote[];
  onAdd: () => void;
  onUpdate: (id: string, key: keyof MeetingNote, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(meetings[0]?.id || null);
  const previousMeetingCount = useRef(meetings.length);
  const selectedMeeting = meetings.find(meeting => meeting.id === selectedMeetingId) || meetings[0];

  useEffect(() => {
    if (!selectedMeetingId && meetings[0]) setSelectedMeetingId(meetings[0].id);
    if (selectedMeetingId && meetings.length && !meetings.some(meeting => meeting.id === selectedMeetingId)) {
      setSelectedMeetingId(meetings[0].id);
    }
  }, [meetings, selectedMeetingId]);

  useEffect(() => {
    if (meetings.length > previousMeetingCount.current) {
      setSelectedMeetingId(meetings[meetings.length - 1].id);
    }
    previousMeetingCount.current = meetings.length;
  }, [meetings]);

  const handleAdd = () => {
    onAdd();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="premium-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Réunions</h2>
          <button onClick={handleAdd} className="action-button-primary px-2 py-1" title="Ajouter une réunion">
            <Plus size={15} />
          </button>
        </div>

        <div className="space-y-2">
          {meetings.map((meeting, index) => (
            <button
              key={meeting.id}
              onClick={() => setSelectedMeetingId(meeting.id)}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-left transition-default',
                selectedMeeting?.id === meeting.id
                  ? 'border-primary/40 bg-primary/10 text-white'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/75 hover:border-primary/30 hover:text-white'
              )}
            >
              <span className="block text-sm font-semibold">{meeting.title || `Réunion ${index + 1}`}</span>
              <span className="block text-xs text-muted-foreground">{meeting.date ? formatDate(meeting.date) : 'Date non précisée'}</span>
            </button>
          ))}
          {meetings.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune réunion. Clique sur + pour commencer.</p>
          )}
        </div>
      </aside>

      <div className="premium-card p-4">
        {selectedMeeting ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
              <MetaInput label="Titre" value={selectedMeeting.title} onChange={v => onUpdate(selectedMeeting.id, 'title', v)} />
              <MetaInput label="Date" type="date" value={selectedMeeting.date} onChange={v => onUpdate(selectedMeeting.id, 'date', v)} />
              <button onClick={() => onDelete(selectedMeeting.id)} className="action-button text-destructive hover:text-destructive">
                <Trash2 size={15} /> Supprimer
              </button>
            </div>

            <RichTextEditor
              editorKey={selectedMeeting.id}
              value={selectedMeeting.content}
              onChange={value => onUpdate(selectedMeeting.id, 'content', value)}
            />
          </div>
        ) : (
          <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">
            Ajoute une réunion pour ouvrir l’éditeur.
          </div>
        )}
      </div>
    </div>
  );
}

function RichTextEditor({ editorKey, value, onChange }: { editorKey: string; value: string; onChange: (value: string) => void }) {
  const applyFormat = (command: string, option?: string) => {
    document.execCommand(command, false, option);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04]">
      <div className="flex flex-wrap gap-1 border-b border-white/[0.08] bg-black/20 p-2">
        <FormatButton label="Gras" onClick={() => applyFormat('bold')}><Bold size={15} /></FormatButton>
        <FormatButton label="Italique" onClick={() => applyFormat('italic')}><Italic size={15} /></FormatButton>
        <FormatButton label="Souligner" onClick={() => applyFormat('underline')}><Underline size={15} /></FormatButton>
        <FormatButton label="Liste" onClick={() => applyFormat('insertUnorderedList')}><List size={15} /></FormatButton>
        <FormatButton label="Liste numérotée" onClick={() => applyFormat('insertOrderedList')}><ListOrdered size={15} /></FormatButton>
        <button onClick={() => applyFormat('formatBlock', 'h2')} className="action-button px-2 py-1 text-xs">H2</button>
        <button onClick={() => applyFormat('formatBlock', 'p')} className="action-button px-2 py-1 text-xs">Texte</button>
      </div>
      <div
        key={editorKey}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[420px] p-4 text-sm leading-6 text-white outline-none [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: value || '' }}
        onInput={e => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
}

function FormatButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onMouseDown={e => e.preventDefault()} onClick={onClick} className="action-button px-2 py-1" title={label}>
      {children}
    </button>
  );
}

interface RoomSummary {
  piece: string;
  tasks: number;
  progress: number;
}

interface BudgetSummaryData {
  count: number;
  montant: number;
  avenants: number;
  total: number;
  resteAPayer: number;
  paye: number;
}

function MetaInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-semibold text-muted-foreground uppercase">{label}</span>
      <input value={value} type={type} onChange={e => onChange(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-secondary px-2 py-2">
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function Input({ value, onChange, type = 'text', className }: { value: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return <input value={value} type={type} onChange={e => onChange(e.target.value)} className={cn('w-32 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary', className)} />;
}

function Textarea({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} className="w-52 min-h-16 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y" />;
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-40 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
      <option value="">-</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ProgressInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const numeric = clamp(Number(value || 0), 0, 100);
  return (
    <div className="flex items-center gap-2">
      <input type="range" min="0" max="100" value={numeric} onChange={e => onChange(e.target.value)} className="w-24" />
      <input type="number" min="0" max="100" value={value} onChange={e => onChange(e.target.value)} className="w-16 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const className =
    value === 'Terminé'
      ? 'bg-green-100 text-green-700'
      : value === 'En cours'
        ? 'bg-blue-100 text-blue-700'
        : value === 'En retard'
          ? 'bg-red-100 text-red-700'
          : 'bg-orange-100 text-orange-700';

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn('w-28 rounded-md border border-transparent px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary', className)}
    >
      {taskStatuses.map(status => <option key={status} value={status}>{status}</option>)}
    </select>
  );
}

function normalizeBudgets(budgets: Partial<BudgetRow>[]) {
  return (budgets as Array<Partial<BudgetRow> & { taskId?: string }>).filter(b => (
    !b.taskId ||
    b.numeroFacture ||
    b.entreprise ||
    b.description ||
    b.montant ||
    b.avenant ||
    b.resteAPayerMontant
  )).map(b => ({
    id: b.id || Date.now().toString(),
    numeroFacture: b.numeroFacture || '',
    entreprise: b.entreprise || '',
    description: b.description || '',
    montant: b.montant || '',
    avenant: b.avenant || '',
    resteAPayer: b.resteAPayer || 'Non',
    resteAPayerMontant: b.resteAPayerMontant || '',
  }));
}

function normalizeMeetings(meetings: Partial<MeetingNote>[]) {
  return meetings.map((meeting, index) => ({
    id: meeting.id || `${Date.now()}-${index}`,
    title: meeting.title || `Réunion ${index + 1}`,
    date: meeting.date || new Date().toISOString().slice(0, 10),
    content: meeting.content || '',
  }));
}

function emptyMeeting(index: number): MeetingNote {
  return {
    id: crypto.randomUUID?.() || Date.now().toString(),
    title: `Réunion ${index}`,
    date: new Date().toISOString().slice(0, 10),
    content: '',
  };
}

function emptyBudget(): BudgetRow {
  return {
    id: Date.now().toString(),
    numeroFacture: '',
    entreprise: '',
    description: '',
    montant: '',
    avenant: '',
    resteAPayer: 'Non',
    resteAPayerMontant: '',
  };
}

function buildBudgetSummary(budgets: BudgetRow[]): BudgetSummaryData {
  const montant = budgets.reduce((total, row) => total + money(row.montant), 0);
  const avenants = budgets.reduce((total, row) => total + money(row.avenant), 0);
  const resteAPayer = budgets.reduce((total, row) => (
    row.resteAPayer === 'Oui' ? total + money(row.resteAPayerMontant) : total
  ), 0);
  const total = montant + avenants;

  return {
    count: budgets.length,
    montant,
    avenants,
    total,
    resteAPayer,
    paye: total - resteAPayer,
  };
}

function getTaskStatus(task: ChantierTask) {
  const progress = clamp(Number(task.avancement || 0), 0, 100);
  const today = startOfDay(new Date());
  const end = parseDate(task.dateFinPrevue);
  const start = parseDate(task.dateDebutPrevue);

  if (progress >= 100) return 'Terminé';
  if (end && today > end) return 'En retard';
  if (start && today >= start) return 'En cours';
  return 'À venir';
}

function getDelay(task: ChantierTask) {
  const progress = clamp(Number(task.avancement || 0), 0, 100);
  const end = parseDate(task.dateFinPrevue);
  if (!end || progress >= 100) return 0;
  const diff = Math.floor((startOfDay(new Date()).getTime() - end.getTime()) / 86400000);
  return Math.max(diff, 0);
}

function buildRoomSummary(pieces: ChantierPiece[], tasks: ChantierTask[]): RoomSummary[] {
  const grouped = new Map<string, RoomSummary>();

  pieces.forEach(piece => {
    grouped.set(piece.name, { piece: piece.name, tasks: 0, progress: 0 });
  });

  tasks.forEach(t => {
    const piece = t.piece || 'Non précisé';
    const current = grouped.get(piece) || { piece, tasks: 0, progress: 0 };
    current.tasks += 1;
    current.progress += clamp(Number(t.avancement || 0), 0, 100);
    grouped.set(piece, current);
  });

  return Array.from(grouped.values()).map(row => ({ ...row, progress: row.tasks ? row.progress / row.tasks : 0 }));
}

function totalBudget(project: ConstructionProject) {
  return project.budgets.reduce((total, budget) => (
    total + money(budget.montant) + money(budget.avenant)
  ), 0);
}

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function money(value: string) {
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('fr-FR') : '-';
}
