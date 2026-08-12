import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConstructionView = 'chantier' | 'budget' | 'reserves' | 'legende';

interface ConstructionMeta {
  operation: string;
  maitreOuvrage: string;
  maitreOeuvre: string;
  updatedAt: string;
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
  responsable: string;
  observations: string;
}

interface BudgetRow {
  id: string;
  taskId: string;
  marcheHT: string;
  avenantsHT: string;
  situationsRegleesHT: string;
  observations: string;
}

interface ReserveRow {
  id: string;
  dateConstat: string;
  piece: string;
  lot: string;
  description: string;
  entreprise: string;
  dateLimite: string;
  dateLevee: string;
}

interface ConstructionData {
  meta: ConstructionMeta;
  tasks: ChantierTask[];
  budgets: BudgetRow[];
  reserves: ReserveRow[];
}

const STORAGE_KEY = 'lareleve_chantier_v1';

const pieces = [
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

const seedTasks: ChantierTask[] = [
  task('1', 'Entrée / Couloir', 'Démolition', 'Entreprise Dupont TP', 'Dépose revêtements sol et cloison existante', '2026-02-02', '2026-02-06', '2026-02-02', '2026-02-06', '5', '100'),
  task('2', 'Cuisine', 'Plomberie', 'Thermo Confort', 'Dépose et réseau plomberie évier / lave-vaisselle', '2026-02-09', '2026-02-13', '2026-02-09', '2026-02-14', '5', '100'),
  task('3', 'Cuisine', 'Électricité', 'Élec Services', 'Câblage prises, éclairage, hotte', '2026-02-16', '2026-02-20', '2026-02-17', '', '5', '70'),
  task('4', 'Cuisine', 'Revêtements', 'Carrelage Design', 'Carrelage sol et crédence', '2026-02-23', '2026-02-27', '', '', '5', '0'),
  task('5', 'Cuisine', 'Menuiserie / Agencement', 'Cuisines Leblanc', 'Pose meubles de cuisine et plan de travail', '2026-03-02', '2026-03-06', '', '', '5', '0'),
  task('6', 'Salle de bain', 'Plomberie', 'Thermo Confort', 'Réseau eau, évacuation, receveur douche', '2026-02-09', '2026-02-16', '2026-02-10', '', '6', '50'),
  task('7', 'Salle de bain', 'Électricité', 'Élec Services', 'Câblage éclairage et VMC', '2026-02-16', '2026-02-19', '', '', '4', '0'),
  task('8', 'Salle de bain', 'Revêtements', 'Carrelage Design', 'Étanchéité, faïence et carrelage sol', '2026-02-23', '2026-03-02', '', '', '6', '0'),
  task('9', 'Salle de bain', 'Menuiserie / Agencement', 'Bains Concept', 'Pose meuble vasque, miroir, accessoires', '2026-03-04', '2026-03-09', '', '', '4', '0'),
  task('10', 'WC', 'Plomberie', 'Thermo Confort', 'Pose bâti-support et raccordements', '2026-02-11', '2026-02-12', '2026-02-11', '2026-02-12', '2', '100'),
  task('11', 'WC', 'Revêtements', 'Carrelage Design', 'Carrelage sol et peinture murs', '2026-02-25', '2026-02-26', '', '', '2', '0'),
  task('12', 'Séjour / Salon', 'Cloisons / Doublages', 'Plâtrerie Leroy', 'Reprises murs, doublages et faux plafond', '2026-02-16', '2026-02-20', '2026-02-16', '2026-02-21', '5', '100'),
  task('13', 'Séjour / Salon', 'Électricité', 'Élec Services', 'Prises, éclairage et tableau', '2026-02-23', '2026-02-27', '', '', '5', '0'),
  task('14', 'Séjour / Salon', 'Revêtements sols', 'Parquets Roy', 'Ragréage et pose parquet', '2026-03-09', '2026-03-13', '', '', '5', '0'),
  task('15', 'Séjour / Salon', 'Peinture', 'Multi-services Pro', 'Préparation et peinture murs/plafond', '2026-03-16', '2026-03-20', '', '', '5', '0'),
  task('16', 'Chambre 1', 'Électricité', 'Élec Services', 'Ajout prises et éclairage', '2026-02-23', '2026-02-25', '', '', '3', '0'),
  task('17', 'Chambre 1', 'Revêtements sols', 'Parquets Roy', 'Pose parquet', '2026-03-09', '2026-03-11', '', '', '3', '0'),
  task('18', 'Chambre 1', 'Peinture', 'Multi-services Pro', 'Peinture murs et plafond', '2026-03-16', '2026-03-18', '', '', '3', '0'),
  task('19', 'Chambre 2', 'Électricité', 'Élec Services', 'Ajout prises et éclairage', '2026-02-25', '2026-02-27', '', '', '3', '0'),
  task('20', 'Chambre 2', 'Revêtements sols', 'Parquets Roy', 'Pose parquet', '2026-03-11', '2026-03-13', '', '', '3', '0'),
  task('21', 'Chambre 2', 'Peinture', 'Multi-services Pro', 'Peinture murs et plafond', '2026-03-18', '2026-03-20', '', '', '3', '0'),
  task('22', 'Parties communes', 'Finitions / Nettoyage', 'Multi-services Pro', 'Nettoyage final et reprises', '2026-03-23', '2026-03-25', '', '', '3', '0'),
];

function task(id: string, piece: string, lot: string, entreprise: string, description: string, dateDebutPrevue: string, dateFinPrevue: string, dateDebutReelle: string, dateFinReelle: string, dureePrevue: string, avancement: string): ChantierTask {
  return {
    id,
    piece,
    lot,
    entreprise,
    description,
    dateDebutPrevue,
    dateFinPrevue,
    dateDebutReelle,
    dateFinReelle,
    dureePrevue,
    avancement,
    responsable: '[Nom]',
    observations: '',
  };
}

const initialData = (): ConstructionData => ({
  meta: {
    operation: "[Adresse de l'appartement]",
    maitreOuvrage: '[Nom]',
    maitreOeuvre: '[Nom du MOE]',
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  tasks: seedTasks,
  budgets: seedTasks.map(t => ({
    id: `budget-${t.id}`,
    taskId: t.id,
    marcheHT: '0',
    avenantsHT: '0',
    situationsRegleesHT: '0',
    observations: '',
  })),
  reserves: Array.from({ length: 12 }, (_, i) => ({
    id: `reserve-${i + 1}`,
    dateConstat: '',
    piece: '',
    lot: '',
    description: '',
    entreprise: '',
    dateLimite: '',
    dateLevee: '',
  })),
});

function loadData(): ConstructionData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        ...initialData(),
        ...data,
        meta: { ...initialData().meta, ...data.meta },
        tasks: data.tasks || [],
        budgets: data.budgets || [],
        reserves: data.reserves || [],
      };
    }
  } catch {}
  return initialData();
}

export default function ConstructionPage() {
  const [data, setData] = useState<ConstructionData>(loadData);
  const [view, setView] = useState<ConstructionView>('chantier');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const syncedBudgets = useMemo(() => syncBudgets(data.tasks, data.budgets), [data.tasks, data.budgets]);
  const roomSummary = useMemo(() => buildRoomSummary(data.tasks, syncedBudgets), [data.tasks, syncedBudgets]);

  const updateMeta = (key: keyof ConstructionMeta, value: string) => {
    setData(prev => ({ ...prev, meta: { ...prev.meta, [key]: value } }));
  };

  const updateTask = (id: string, key: keyof ChantierTask, value: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === id ? { ...t, [key]: value } : t)),
    }));
  };

  const updateBudget = (taskId: string, key: keyof BudgetRow, value: string) => {
    setData(prev => ({
      ...prev,
      budgets: syncBudgets(prev.tasks, prev.budgets).map(b => (b.taskId === taskId ? { ...b, [key]: value } : b)),
    }));
  };

  const updateReserve = (id: string, key: keyof ReserveRow, value: string) => {
    setData(prev => ({
      ...prev,
      reserves: prev.reserves.map(r => (r.id === id ? { ...r, [key]: value } : r)),
    }));
  };

  const addTask = () => {
    setData(prev => {
      const id = Date.now().toString();
      const newTask = task(id, '', '', '', '', '', '', '', '', '', '0');
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
        budgets: [...syncBudgets(prev.tasks, prev.budgets), emptyBudget(id)],
      };
    });
  };

  const deleteTask = (id: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
      budgets: prev.budgets.filter(b => b.taskId !== id),
    }));
  };

  const addReserve = () => {
    setData(prev => ({
      ...prev,
      reserves: [...prev.reserves, { id: Date.now().toString(), dateConstat: '', piece: '', lot: '', description: '', entreprise: '', dateLimite: '', dateLevee: '' }],
    }));
  };

  const deleteReserve = (id: string) => {
    setData(prev => ({ ...prev, reserves: prev.reserves.filter(r => r.id !== id) }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Suivi chantier</h1>
            <p className="text-sm text-muted-foreground">Rénovation appartement - maître d'oeuvre</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            <MetaInput label="Opération" value={data.meta.operation} onChange={v => updateMeta('operation', v)} />
            <MetaInput label="Maître d'ouvrage" value={data.meta.maitreOuvrage} onChange={v => updateMeta('maitreOuvrage', v)} />
            <MetaInput label="Maître d'oeuvre" value={data.meta.maitreOeuvre} onChange={v => updateMeta('maitreOeuvre', v)} />
            <MetaInput label="Mise à jour" type="date" value={data.meta.updatedAt} onChange={v => updateMeta('updatedAt', v)} />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-border">
          {[
            ['chantier', 'Suivi chantier'],
            ['budget', 'Suivi budgétaire'],
            ['reserves', 'Réserves'],
            ['legende', 'Légende'],
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

      {view === 'chantier' && (
        <ChantierTable tasks={data.tasks} onUpdate={updateTask} onAdd={addTask} onDelete={deleteTask} summary={roomSummary} />
      )}
      {view === 'budget' && (
        <BudgetTable tasks={data.tasks} budgets={syncedBudgets} onUpdate={updateBudget} summary={roomSummary} />
      )}
      {view === 'reserves' && (
        <ReservesTable reserves={data.reserves} onUpdate={updateReserve} onAdd={addReserve} onDelete={deleteReserve} />
      )}
      {view === 'legende' && <Legend />}
    </div>
  );
}

function ChantierTable({ tasks, onUpdate, onAdd, onDelete, summary }: {
  tasks: ChantierTask[];
  onUpdate: (id: string, key: keyof ChantierTask, value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  summary: RoomSummary[];
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-border rounded-lg shadow-card">
        <table className="w-full min-w-[1450px] text-sm text-left">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {['N°', 'Pièce', "Lot / Corps d'état", 'Entreprise', 'Tâche / Description', 'Début prévu', 'Fin prévue', 'Début réel', 'Fin réelle', 'Durée (j)', 'Avancement (%)', 'Retard (j)', 'Statut', 'Responsable suivi', 'Observations', ''].map(h => (
                <th key={h} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((t, i) => {
              const delay = getDelay(t);
              const status = getTaskStatus(t);
              return (
                <tr key={t.id} className="hover:bg-secondary/30 transition-default">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2"><Select value={t.piece} options={pieces} onChange={v => onUpdate(t.id, 'piece', v)} /></td>
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
                  <td className="px-3 py-2"><StatusBadge status={status} /></td>
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
          </tbody>
        </table>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-default">
        <Plus size={16} /> Ajouter une tâche
      </button>
      <RoomSummaryTable summary={summary} />
    </div>
  );
}

function BudgetTable({ tasks, budgets, onUpdate, summary }: {
  tasks: ChantierTask[];
  budgets: BudgetRow[];
  onUpdate: (taskId: string, key: keyof BudgetRow, value: string) => void;
  summary: RoomSummary[];
}) {
  const taskById = new Map(tasks.map(t => [t.id, t]));
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-border rounded-lg shadow-card">
        <table className="w-full min-w-[1150px] text-sm text-left">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {['N°', 'Pièce', "Lot / Corps d'état", 'Entreprise', 'Marché HT signé (€)', 'Avenants HT (€)', 'Budget total HT (€)', 'Situations réglées HT (€)', 'Reste à payer HT (€)', '% consommé', 'Observations'].map(h => (
                <th key={h} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {budgets.map((b, i) => {
              const t = taskById.get(b.taskId);
              const marche = money(b.marcheHT);
              const avenants = money(b.avenantsHT);
              const total = marche + avenants;
              const paid = money(b.situationsRegleesHT);
              const remaining = total - paid;
              const consumed = total > 0 ? paid / total : 0;
              return (
                <tr key={b.id} className="hover:bg-secondary/30 transition-default">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">{t?.piece || ''}</td>
                  <td className="px-3 py-2">{t?.lot || ''}</td>
                  <td className="px-3 py-2">{t?.entreprise || ''}</td>
                  <td className="px-3 py-2"><Input type="number" value={b.marcheHT} onChange={v => onUpdate(b.taskId, 'marcheHT', v)} /></td>
                  <td className="px-3 py-2"><Input type="number" value={b.avenantsHT} onChange={v => onUpdate(b.taskId, 'avenantsHT', v)} /></td>
                  <td className="px-3 py-2 font-medium">{formatEuro(total)}</td>
                  <td className="px-3 py-2"><Input type="number" value={b.situationsRegleesHT} onChange={v => onUpdate(b.taskId, 'situationsRegleesHT', v)} /></td>
                  <td className="px-3 py-2 font-medium">{formatEuro(remaining)}</td>
                  <td className="px-3 py-2">{Math.round(consumed * 100)}%</td>
                  <td className="px-3 py-2"><Textarea value={b.observations} onChange={v => onUpdate(b.taskId, 'observations', v)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <RoomSummaryTable summary={summary} showBudget />
    </div>
  );
}

function ReservesTable({ reserves, onUpdate, onAdd, onDelete }: {
  reserves: ReserveRow[];
  onUpdate: (id: string, key: keyof ReserveRow, value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-border rounded-lg shadow-card">
        <table className="w-full min-w-[1050px] text-sm text-left">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {['N°', 'Date constat', 'Pièce', 'Lot concerné', 'Description de la réserve', 'Entreprise responsable', 'Date limite levée', 'Date levée effective', 'Statut', ''].map(h => (
                <th key={h} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reserves.map((r, i) => (
              <tr key={r.id} className="hover:bg-secondary/30 transition-default">
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2"><Input type="date" value={r.dateConstat} onChange={v => onUpdate(r.id, 'dateConstat', v)} /></td>
                <td className="px-3 py-2"><Select value={r.piece} options={pieces} onChange={v => onUpdate(r.id, 'piece', v)} /></td>
                <td className="px-3 py-2"><Select value={r.lot} options={lots} onChange={v => onUpdate(r.id, 'lot', v)} /></td>
                <td className="px-3 py-2"><Textarea value={r.description} onChange={v => onUpdate(r.id, 'description', v)} /></td>
                <td className="px-3 py-2"><Input value={r.entreprise} onChange={v => onUpdate(r.id, 'entreprise', v)} /></td>
                <td className="px-3 py-2"><Input type="date" value={r.dateLimite} onChange={v => onUpdate(r.id, 'dateLimite', v)} /></td>
                <td className="px-3 py-2"><Input type="date" value={r.dateLevee} onChange={v => onUpdate(r.id, 'dateLevee', v)} /></td>
                <td className="px-3 py-2"><StatusBadge status={getReserveStatus(r)} /></td>
                <td className="px-3 py-2">
                  <button onClick={() => onDelete(r.id)} className="text-destructive hover:text-destructive/80 transition-default" title="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-default">
        <Plus size={16} /> Ajouter une réserve
      </button>
    </div>
  );
}

function Legend() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-3 border border-border rounded-lg p-4 bg-card">
        <h2 className="text-lg font-semibold">Mode d'emploi</h2>
        <p className="text-sm text-muted-foreground">Une ligne par tâche, classée par pièce puis par lot/corps d'état. Les colonnes Retard et Statut se calculent automatiquement.</p>
        <p className="text-sm text-muted-foreground">Dans le budget, la pièce, le lot et l'entreprise sont repris depuis le suivi chantier. Complète seulement les montants.</p>
        <p className="text-sm text-muted-foreground">Les réserves passent en retard si la date limite est dépassée sans date de levée.</p>
      </section>
      <section className="space-y-3 border border-border rounded-lg p-4 bg-card">
        <h2 className="text-lg font-semibold">Statuts</h2>
        <div className="flex flex-wrap gap-2">
          {['Terminé', 'En cours', 'En retard', 'À venir', 'Levée', 'Ouverte'].map(status => <StatusBadge key={status} status={status} />)}
        </div>
        <p className="text-sm text-muted-foreground">Avancement : saisir un nombre entre 0 et 100. Le tableau convertit automatiquement en progression.</p>
      </section>
    </div>
  );
}

interface RoomSummary {
  piece: string;
  tasks: number;
  progress: number;
  budget: number;
  paid: number;
  remaining: number;
}

function RoomSummaryTable({ summary, showBudget = false }: { summary: RoomSummary[]; showBudget?: boolean }) {
  if (!summary.length) return null;
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-secondary border-b border-border">
          <tr>
            <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Synthèse par pièce</th>
            <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Tâches</th>
            <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Avancement moyen</th>
            {showBudget && <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Budget total</th>}
            {showBudget && <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Réglé</th>}
            {showBudget && <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Reste</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {summary.map(row => (
            <tr key={row.piece}>
              <td className="px-3 py-2 font-medium">{row.piece}</td>
              <td className="px-3 py-2">{row.tasks}</td>
              <td className="px-3 py-2">{Math.round(row.progress)}%</td>
              {showBudget && <td className="px-3 py-2">{formatEuro(row.budget)}</td>}
              {showBudget && <td className="px-3 py-2">{formatEuro(row.paid)}</td>}
              {showBudget && <td className="px-3 py-2">{formatEuro(row.remaining)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetaInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-semibold text-muted-foreground uppercase">{label}</span>
      <input value={value} type={type} onChange={e => onChange(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
    </label>
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

function StatusBadge({ status }: { status: string }) {
  const className =
    status === 'Terminé' || status === 'Levée'
      ? 'bg-green-100 text-green-700'
      : status === 'En cours' || status === 'Ouverte'
        ? 'bg-blue-100 text-blue-700'
        : status === 'En retard'
          ? 'bg-red-100 text-red-700'
          : 'bg-orange-100 text-orange-700';

  return <span className={cn('inline-flex rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap', className)}>{status || '-'}</span>;
}

function syncBudgets(tasks: ChantierTask[], budgets: BudgetRow[]) {
  return tasks.map(t => budgets.find(b => b.taskId === t.id) || emptyBudget(t.id));
}

function emptyBudget(taskId: string): BudgetRow {
  return { id: `budget-${taskId}`, taskId, marcheHT: '0', avenantsHT: '0', situationsRegleesHT: '0', observations: '' };
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

function getReserveStatus(row: ReserveRow) {
  if (row.dateLevee) return 'Levée';
  const today = startOfDay(new Date());
  const limit = parseDate(row.dateLimite);
  if (limit && today > limit) return 'En retard';
  if (row.dateConstat) return 'Ouverte';
  return '';
}

function getDelay(task: ChantierTask) {
  const progress = clamp(Number(task.avancement || 0), 0, 100);
  const end = parseDate(task.dateFinPrevue);
  if (!end || progress >= 100) return 0;
  const diff = Math.floor((startOfDay(new Date()).getTime() - end.getTime()) / 86400000);
  return Math.max(diff, 0);
}

function buildRoomSummary(tasks: ChantierTask[], budgets: BudgetRow[]): RoomSummary[] {
  const budgetByTask = new Map(budgets.map(b => [b.taskId, b]));
  const grouped = new Map<string, RoomSummary>();

  tasks.forEach(t => {
    const piece = t.piece || 'Non précisé';
    const budget = budgetByTask.get(t.id);
    const total = money(budget?.marcheHT || '0') + money(budget?.avenantsHT || '0');
    const paid = money(budget?.situationsRegleesHT || '0');
    const current = grouped.get(piece) || { piece, tasks: 0, progress: 0, budget: 0, paid: 0, remaining: 0 };
    current.tasks += 1;
    current.progress += clamp(Number(t.avancement || 0), 0, 100);
    current.budget += total;
    current.paid += paid;
    current.remaining += total - paid;
    grouped.set(piece, current);
  });

  return Array.from(grouped.values()).map(row => ({ ...row, progress: row.tasks ? row.progress / row.tasks : 0 }));
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
