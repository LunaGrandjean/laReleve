import { useEffect, useState } from 'react';
import { AppData } from '@/types';
import { CheckCircle, Clock, FileText, Hammer, Search, Users, XCircle } from 'lucide-react';
import StatCard from './StatCard';

interface DashboardProps {
  data: AppData;
  onSelectMember: (id: string) => void;
}

const QUICK_NOTES_KEY = 'lareleve_quick_notes';
const CONSTRUCTION_STORAGE_KEY = 'lareleve_chantier_v1';

interface ConstructionTaskSnapshot {
  statut?: string;
  avancement?: string;
}

interface ConstructionProjectSnapshot {
  tasks?: ConstructionTaskSnapshot[];
}

function loadConstructionStats() {
  try {
    const raw = localStorage.getItem(CONSTRUCTION_STORAGE_KEY);
    if (!raw) return { total: 0, enCours: 0, realises: 0 };

    const parsed = JSON.parse(raw);
    const projects: ConstructionProjectSnapshot[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.projects)
        ? parsed.projects
        : parsed?.tasks
          ? [parsed]
          : [];

    const projectStatuses = projects.map(project => {
      const tasks = Array.isArray(project.tasks) ? project.tasks : [];
      const completedTasks = tasks.filter(task => (
        task.statut === 'Terminé' ||
        task.statut === 'Termin\u00c3\u00a9' ||
        Number(task.avancement || 0) >= 100
      ));

      return {
        hasTasks: tasks.length > 0,
        isComplete: tasks.length > 0 && completedTasks.length === tasks.length,
      };
    });

    return {
      total: projects.length,
      enCours: projectStatuses.filter(project => project.hasTasks && !project.isComplete).length,
      realises: projectStatuses.filter(project => project.isComplete).length,
    };
  } catch {
    return { total: 0, enCours: 0, realises: 0 };
  }
}

export default function Dashboard({ data, onSelectMember }: DashboardProps) {
  const [quickNotes, setQuickNotes] = useState(() => {
    try { return localStorage.getItem(QUICK_NOTES_KEY) || ''; } catch { return ''; }
  });

  useEffect(() => {
    localStorage.setItem(QUICK_NOTES_KEY, quickNotes);
  }, [quickNotes]);

  const constructionStats = loadConstructionStats();

  const stats = {
    totalMembers: data.members.length,
    totalRecherches: data.members.reduce((a, m) => a + m.recherches.length, 0),
    offresTotal: data.members.reduce((a, m) => a + m.offres.length, 0),
    offresAcceptees: data.members.reduce((a, m) => a + m.offres.filter(o => o.statut === 'Acceptée').length, 0),
    offresAttente: data.members.reduce((a, m) => a + m.offres.filter(o => o.statut === 'En attente').length, 0),
    offresRefusees: data.members.reduce((a, m) => a + m.offres.filter(o => o.statut === 'Refusée').length, 0),
    chantiersTotal: constructionStats.total,
    chantiersRealises: constructionStats.realises,
    chantiersEnCours: constructionStats.enCours,
  };

  const recentActivity = data.members
    .flatMap(m => [
      ...m.offres.map(o => ({ type: 'Offre' as const, label: `${o.type} - ${o.adresse}`, status: o.statut, member: m.name, date: o.date })),
      ...m.travaux.map(t => ({ type: 'Travaux' as const, label: t.tache, status: t.statut, member: m.name, date: t.date })),
    ])
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 8);

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">Vue synthétique des membres, recherches, offres et prochains rendez-vous.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <h3 className="section-title">01 — Membres & recherches</h3>
          <div className="space-y-3">
            <StatCard title="Membres" value={stats.totalMembers} icon={<Users size={20} />} variant="noir" />
            <StatCard title="Recherches" value={stats.totalRecherches} icon={<Search size={20} />} variant="primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="section-title">02 — Offres</h3>
          <div className="space-y-3">
            <StatCard title="Offres totales" value={stats.offresTotal} icon={<FileText size={20} />} variant="primary" />
            <StatCard title="Acceptées" value={stats.offresAcceptees} icon={<CheckCircle size={20} />} variant="success" />
            <StatCard title="En attente" value={stats.offresAttente} icon={<Clock size={20} />} variant="accent" />
            <StatCard title="Refusées" value={stats.offresRefusees} icon={<XCircle size={20} />} variant="noir" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="section-title">03 — Travaux</h3>
          <div className="space-y-3">
            <StatCard title="Chantiers total" value={stats.chantiersTotal} icon={<Hammer size={20} />} variant="primary" />
            <StatCard title="En cours" value={stats.chantiersEnCours} icon={<Clock size={20} />} variant="accent" />
            <StatCard title="Réalisés" value={stats.chantiersRealises} icon={<CheckCircle size={20} />} variant="success" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="section-title">04 — Activité par membre</h2>
          <div className="table-shell">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.04]">
                <tr>
                  {['Membre', 'Recherches', 'Offres', 'Travaux', ''].map(label => (
                    <th key={label} className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08]">
                {data.members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-white/50">Aucun membre ajouté</td>
                  </tr>
                )}
                {data.members.map(m => (
                  <tr key={m.id} className="transition-default hover:bg-white/[0.04]">
                    <td className="px-5 py-3 font-medium">{m.name}</td>
                    <td className="px-5 py-3">{m.recherches.length}</td>
                    <td className="px-5 py-3">{m.offres.length}</td>
                    <td className="px-5 py-3">{m.travaux.length}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => onSelectMember(m.id)} className="text-sm font-semibold text-primary hover:underline">
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="premium-card p-5">
            <h3 className="mb-3 font-semibold">Agenda des visites</h3>
            <UpcomingVisits data={data} />
          </div>

          <div className="premium-card p-5">
            <h3 className="mb-3 font-semibold">Notes rapides</h3>
            <textarea
              value={quickNotes}
              onChange={e => setQuickNotes(e.target.value)}
              className="h-28 w-full resize-none rounded-md border border-white/[0.08] bg-white/[0.05] p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Écrire une note..."
            />
          </div>

          <div className="premium-card p-5">
            <h3 className="mb-3 font-semibold">Activité récente</h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {recentActivity.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 border-b border-white/[0.08] pb-2 text-sm last:border-0">
                    <StatusDot status={a.status} />
                    <div>
                      <span className="font-medium">{a.member}</span>
                      <span className="text-muted-foreground"> — {a.type}: {a.label}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UpcomingVisits({ data }: { data: AppData }) {
  const today = new Date().toISOString().split('T')[0];
  const visites = data.members
    .flatMap(m =>
      m.recherches
        .filter(r => r.visite && r.visite >= today)
        .map(r => ({ membre: m.name, bien: r.bien || r.adresse || 'Bien non précisé', date: r.visite, adresse: r.adresse }))
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  if (visites.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Aucune visite à venir</p>;
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto">
      {visites.map((v, i) => (
        <li key={i} className="flex items-start gap-2 border-b border-white/[0.08] pb-2 text-sm last:border-0">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <div>
            <span className="font-medium">{new Date(v.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            <span className="text-muted-foreground"> — {v.membre}: {v.bien}{v.adresse ? ` (${v.adresse})` : ''}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'Acceptée' || status === 'Réalisé'
      ? 'bg-success'
      : status === 'En attente' || status === 'En cours'
        ? 'bg-primary'
        : 'bg-destructive';
  return <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />;
}
