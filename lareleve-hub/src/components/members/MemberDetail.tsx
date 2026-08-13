import { Member, Offre, Recherche } from '@/types';
import { ArrowLeft } from 'lucide-react';
import EditableTable, { ColumnDef } from '../shared/EditableTable';

interface MemberDetailProps {
  member: Member;
  onBack: () => void;
  onUpdate: (m: Member) => void;
}

const rechercheColumns: ColumnDef<Recherche>[] = [
  { key: 'date', label: 'Date', width: '100px' },
  { key: 'visite', label: 'Visite', type: 'date', width: '150px' },
  { key: 'bien', label: 'Biens', width: '120px' },
  { key: 'adresse', label: 'Adresse', width: '180px' },
  { key: 'statut', label: 'Statut', type: 'select', options: ['À appeler', 'Proposé', 'À étudier', 'MSS vocal', 'Visité', 'Autre'], customOptionLabel: 'Autre', customOptionPlaceholder: 'Préciser...', width: '150px' },
  { key: 'offre', label: 'Offre', type: 'select', options: ['Non', 'Oui'], width: '90px' },
  { key: 'prix', label: 'Prix', width: '100px' },
  { key: 'prixM2', label: 'Prix m²', width: '90px' },
  { key: 'marge', label: 'Marge', width: '80px' },
  { key: 'nego', label: 'Négo', width: '80px' },
  { key: 'agence', label: 'Agence', width: '120px' },
  { key: 'lien', label: 'Lien', type: 'link', width: '120px' },
  { key: 'infos', label: 'Infos', type: 'textarea', width: '220px' },
];

const offreColumns: ColumnDef<Offre>[] = [
  { key: 'type', label: 'Type', width: '100px' },
  { key: 'adresse', label: 'Adresse', width: '180px' },
  { key: 'statut', label: 'Statut', type: 'select', options: ['Acceptée', 'En attente', 'Refusée'], width: '130px' },
  { key: 'prixAffiche', label: 'Prix affiché', width: '110px' },
  { key: 'prixPropose', label: 'Prix proposé', width: '110px' },
  { key: 'prixAchete', label: 'Prix acheté', width: '110px' },
  { key: 'date', label: 'Date', width: '100px' },
  { key: 'commentaire', label: 'Commentaire', type: 'textarea', width: '180px' },
  { key: 'agence', label: 'Agence', width: '120px' },
  { key: 'photos', label: 'Photos', type: 'photos', width: '180px' },
];

const offreStatusColors: Record<string, string> = {
  Acceptée: 'bg-success/15 text-success border border-success/20',
  'En attente': 'bg-primary/15 text-primary border border-primary/20',
  Refusée: 'bg-destructive/15 text-destructive border border-destructive/20',
};

const rechercheStatusColors: Record<string, string> = {
  'À appeler': 'bg-red-500/15 text-red-300 border border-red-500/20',
  Proposé: 'bg-primary/15 text-primary border border-primary/20',
  'À étudier': 'bg-blue-500/15 text-blue-300 border border-blue-500/20',
  'MSS vocal': 'bg-white/[0.08] text-white border border-white/[0.12]',
  Visité: 'bg-success/15 text-success border border-success/20',
  Autre: 'bg-violet-500/15 text-violet-300 border border-violet-500/20',
};

export default function MemberDetail({ member, onBack, onUpdate }: MemberDetailProps) {
  const update = (partial: Partial<Member>) => onUpdate({ ...member, ...partial });

  const updateRecherches = (recherches: Recherche[]) => {
    const offres = recherches.reduce((nextOffres, recherche) => {
      if (recherche.offre !== 'Oui') return nextOffres;

      const existingIndex = nextOffres.findIndex(o => o.sourceRechercheId === recherche.id);
      const syncedFields = {
        sourceRechercheId: recherche.id,
        type: recherche.bien,
        adresse: recherche.adresse,
        prixAffiche: recherche.prix,
        date: recherche.date || recherche.visite,
        agence: recherche.agence,
      };

      if (existingIndex >= 0) {
        return nextOffres.map((offre, index) => (
          index === existingIndex ? { ...offre, ...syncedFields } : offre
        ));
      }

      return [
        ...nextOffres,
        {
          id: `recherche-${recherche.id}`,
          ...syncedFields,
          statut: 'En attente' as const,
          prixPropose: '',
          prixAchete: '',
          commentaire: recherche.infos,
          photos: '',
        },
      ];
    }, member.offres);

    onUpdate({ ...member, recherches, offres });
  };

  return (
    <div className="page-shell">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="action-button p-2" aria-label="Retour">
          <ArrowLeft size={20} />
        </button>
        <div className="page-header">
          <h1 className="page-title">{member.name}</h1>
          <p className="page-subtitle">Suivi des recherches et offres du membre.</p>
        </div>
      </div>

      <div className="premium-card p-5">
        <h2 className="mb-3 font-semibold text-white">Notes — {member.name}</h2>
        <textarea
          value={member.notes}
          onChange={e => update({ notes: e.target.value })}
          placeholder="Écrire des notes pour ce membre..."
          className="h-32 w-full resize-none rounded-md border border-white/[0.08] bg-white/[0.05] p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <section className="space-y-3">
        <h2 className="section-title">01 — Recherches</h2>
        <EditableTable
          columns={rechercheColumns}
          rows={member.recherches}
          onUpdate={updateRecherches}
          createEmpty={() => ({ id: Date.now().toString(), date: '', visite: '', bien: '', adresse: '', statut: '', offre: 'Non', prix: '', prixM2: '', marge: '', nego: '', agence: '', lien: '', infos: '' })}
          statusColors={rechercheStatusColors}
        />
      </section>

      <section className="space-y-3">
        <h2 className="section-title">02 — Offres</h2>
        <EditableTable
          columns={offreColumns}
          rows={member.offres}
          onUpdate={o => update({ offres: o })}
          createEmpty={() => ({ id: Date.now().toString(), type: '', adresse: '', statut: 'En attente' as const, prixAffiche: '', prixPropose: '', prixAchete: '', date: '', commentaire: '', agence: '', photos: '' })}
          statusColors={offreStatusColors}
        />
      </section>
    </div>
  );
}
