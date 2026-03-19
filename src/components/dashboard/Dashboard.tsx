import { useState, useEffect } from 'react';
import { AppData } from '@/types';
import { Users, Search, FileText, Hammer, CheckCircle, Clock, XCircle } from 'lucide-react';
import StatCard from './StatCard';

interface DashboardProps {
  data: AppData;
  onSelectMember: (id: string) => void;
}

const QUICK_NOTES_KEY = 'lareleve_quick_notes';

export default function Dashboard({ data, onSelectMember }: DashboardProps) {
  const [quickNotes, setQuickNotes] = useState(() => {
    try { return localStorage.getItem(QUICK_NOTES_KEY) || ''; } catch { return ''; }
  });

  useEffect(() => {
    localStorage.setItem(QUICK_NOTES_KEY, quickNotes);
  }, [quickNotes]);

  const stats = {
    totalMembers: data.members.length,
    totalRecherches: data.members.reduce((a, m) => a + m.recherches.length, 0),
    offresTotal: data.members.reduce((a, m) => a + m.offres.length, 0),
    offresAcceptees: data.members.reduce((a, m) => a + m.offres.filter(o => o.statut === 'Acceptée').length, 0),
    offresAttente: data.members.reduce((a, m) => a + m.offres.filter(o => o.statut === 'En attente').length, 0),
    offresRefusees: data.members.reduce((a, m) => a + m.offres.filter(o => o.statut === 'Refusée').length, 0),
    travauxTotal: data.members.reduce((a, m) => a + m.travaux.length, 0),
    travauxRealises: data.members.reduce((a, m) => a + m.travaux.filter(t => t.statut === 'Réalisé').length, 0),
    travauxEnCours: data.members.reduce((a, m) => a + m.travaux.filter(t => t.statut === 'En cours').length, 0),
  };

  const recentActivity = data.members
    .flatMap(m => [
      ...m.offres.map(o => ({ type: 'Offre' as const, label: `${o.type} - ${o.adresse}`, status: o.statut, member: m.name, date: o.date })),
      ...m.travaux.map(t => ({ type: 'Travaux' as const, label: t.tache, status: t.statut, member: m.name, date: t.date })),
    ])
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 8);

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>

      {/* Stats organized by category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Membres & Recherches */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Membres & Recherches</h3>
          <div className="space-y-3">
            <StatCard title="Membres" value={stats.totalMembers} icon={<Users size={20} />} variant="noir" />
            <StatCard title="Recherches" value={stats.totalRecherches} icon={<Search size={20} />} variant="primary" />
          </div>
        </div>

        {/* Offres */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Offres</h3>
          <div className="space-y-3">
            <StatCard title="Offres totales" value={stats.offresTotal} icon={<FileText size={20} />} variant="primary" />
            <StatCard title="Acceptées" value={stats.offresAcceptees} icon={<CheckCircle size={20} />} variant="success" />
            <StatCard title="En attente" value={stats.offresAttente} icon={<Clock size={20} />} variant="accent" />
            <StatCard title="Refusées" value={stats.offresRefusees} icon={<XCircle size={20} />} variant="noir" />
          </div>
        </div>

        {/* Travaux */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Travaux</h3>
          <div className="space-y-3">
            <StatCard title="Travaux total" value={stats.travauxTotal} icon={<Hammer size={20} />} variant="primary" />
            <StatCard title="En cours" value={stats.travauxEnCours} icon={<Clock size={20} />} variant="accent" />
            <StatCard title="Réalisés" value={stats.travauxRealises} icon={<CheckCircle size={20} />} variant="success" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members table */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold">Activité par membre</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Membre</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Recherches</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Offres</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Travaux</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Aucun membre ajouté</td>
                  </tr>
                )}
                {data.members.map(m => (
                  <tr key={m.id} className="hover:bg-secondary/50 transition-default">
                    <td className="px-5 py-3 font-medium">{m.name}</td>
                    <td className="px-5 py-3">{m.recherches.length}</td>
                    <td className="px-5 py-3">{m.offres.length}</td>
                    <td className="px-5 py-3">{m.travaux.length}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => onSelectMember(m.id)} className="text-primary font-semibold hover:underline text-sm">
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-lg shadow-card p-5">
            <h3 className="font-semibold mb-3">Activité récente</h3>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune activité</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {recentActivity.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm border-b border-border pb-2 last:border-0">
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

          {/* Notes block */}
          <div className="bg-noir rounded-lg p-5">
            <h3 className="font-semibold text-primary-foreground mb-3">Notes rapides</h3>
            <textarea
              value={quickNotes}
              onChange={e => setQuickNotes(e.target.value)}
              className="w-full bg-noir-light border-none rounded-md p-3 text-sm text-primary-foreground h-28 focus:ring-1 focus:ring-primary focus:outline-none resize-none placeholder:text-muted-foreground"
              placeholder="Écrire une note..."
            />
          </div>

          {/* Visites à venir */}
          <div className="bg-card border border-border rounded-lg p-5 shadow-card">
            <h3 className="font-semibold mb-3">Agenda des visites</h3>
            {(() => {
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
                return <p className="text-muted-foreground text-sm text-center py-4">Aucune visite à venir</p>;
              }

              return (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {visites.map((v, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm border-b border-border pb-2 last:border-0">
                      <span className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <span className="font-medium">{new Date(v.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                        <span className="text-muted-foreground"> — {v.membre}: {v.bien}{v.adresse ? ` (${v.adresse})` : ''}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'Acceptée' || status === 'Réalisé'
      ? 'bg-success'
      : status === 'En attente' || status === 'En cours'
        ? 'bg-primary'
        : 'bg-destructive';
  return <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${color}`} />;
}
