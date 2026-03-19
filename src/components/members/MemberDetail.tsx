import { Member, Recherche, Offre, Travaux } from '@/types';
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
  { key: 'prix', label: 'Prix', width: '100px' },
  { key: 'prixM2', label: 'Prix m²', width: '90px' },
  { key: 'marge', label: 'Marge', width: '80px' },
  { key: 'nego', label: 'Négo', width: '80px' },
  { key: 'agence', label: 'Agence', width: '120px' },
  { key: 'lien', label: 'Lien', width: '120px' },
  { key: 'infos', label: 'Infos', width: '150px' },
];

const offreColumns: ColumnDef<Offre>[] = [
  { key: 'type', label: 'Type', width: '100px' },
  { key: 'adresse', label: 'Adresse', width: '180px' },
  { key: 'statut', label: 'Statut', type: 'select', options: ['Acceptée', 'En attente', 'Refusée'], width: '130px' },
  { key: 'prixAffiche', label: 'Prix affiché', width: '110px' },
  { key: 'prixPropose', label: 'Prix proposé', width: '110px' },
  { key: 'prixAchete', label: 'Prix acheté', width: '110px' },
  { key: 'date', label: 'Date', width: '100px' },
  { key: 'commentaire', label: 'Commentaire', width: '160px' },
  { key: 'agence', label: 'Agence', width: '120px' },
  { key: 'photos', label: 'Photos', type: 'photos', width: '180px' },
];

const travauxColumns: ColumnDef<Travaux>[] = [
  { key: 'tache', label: 'Tâche', width: '200px' },
  { key: 'statut', label: 'Statut', type: 'select', options: ['Réalisé', 'En cours'], width: '120px' },
  { key: 'cout', label: 'Coût', width: '100px' },
  { key: 'date', label: 'Date', width: '100px' },
];

const offreStatusColors: Record<string, string> = {
  'Acceptée': 'bg-success/20 text-success',
  'En attente': 'bg-primary/20 text-primary',
  'Refusée': 'bg-destructive/20 text-destructive',
};

const travauxStatusColors: Record<string, string> = {
  'Réalisé': 'bg-success/20 text-success',
  'En cours': 'bg-primary/20 text-primary',
};

export default function MemberDetail({ member, onBack, onUpdate }: MemberDetailProps) {
  const update = (partial: Partial<Member>) => onUpdate({ ...member, ...partial });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-md hover:bg-secondary transition-default">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{member.name}</h1>
      </div>

      {/* Notes */}
      <div className="bg-noir rounded-lg p-5">
        <h2 className="text-primary-foreground font-semibold mb-3">Notes — {member.name}</h2>
        <textarea
          value={member.notes}
          onChange={e => update({ notes: e.target.value })}
          placeholder="Écrire des notes pour ce membre..."
          className="w-full bg-noir-light border-none rounded-md p-3 text-sm text-primary-foreground h-32 focus:ring-1 focus:ring-primary focus:outline-none resize-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Recherches */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recherches</h2>
        <EditableTable
          columns={rechercheColumns}
          rows={member.recherches}
          onUpdate={r => update({ recherches: r })}
          createEmpty={() => ({ id: Date.now().toString(), date: '', visite: '', bien: '', adresse: '', prix: '', prixM2: '', marge: '', nego: '', agence: '', lien: '', infos: '' })}
        />
      </section>

      {/* Offres */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Offres</h2>
        <EditableTable
          columns={offreColumns}
          rows={member.offres}
          onUpdate={o => update({ offres: o })}
          createEmpty={() => ({ id: Date.now().toString(), type: '', adresse: '', statut: 'En attente' as const, prixAffiche: '', prixPropose: '', prixAchete: '', date: '', commentaire: '', agence: '', photos: '' })}
          statusColors={offreStatusColors}
        />
      </section>

      {/* Travaux */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Travaux</h2>
        <EditableTable
          columns={travauxColumns}
          rows={member.travaux}
          onUpdate={t => update({ travaux: t })}
          createEmpty={() => ({ id: Date.now().toString(), tache: '', statut: 'En cours' as const, cout: '', date: '' })}
          statusColors={travauxStatusColors}
        />
      </section>
    </div>
  );
}
