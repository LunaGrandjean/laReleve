import { useState } from 'react';
import { Member } from '@/types';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';

interface MembersPageProps {
  members: Member[];
  onSelectMember: (id: string) => void;
  onAddMember: (name: string) => void;
  onDeleteMember: (id: string) => void;
}

export default function MembersPage({ members, onSelectMember, onAddMember, onDeleteMember }: MembersPageProps) {
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddMember(newName.trim());
    setNewName('');
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDeleteMember(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Membres</h1>
        <p className="page-subtitle">Gestion des profils et de leurs opérations.</p>
      </div>

      <div className="premium-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Nom du nouveau membre"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 rounded-md border border-white/[0.08] bg-white/[0.05] px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary sm:max-w-sm"
        />
        <button onClick={handleAdd} className="action-button-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map(m => (
          <div key={m.id} className="premium-card flex flex-col justify-between p-5">
            <div>
              <h3 className="text-lg font-semibold text-white">{m.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {m.recherches.length} recherches · {m.offres.length} offres · {m.travaux.length} travaux
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3">
              <button onClick={() => onSelectMember(m.id)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Ouvrir <ChevronRight size={14} />
              </button>
              <button
                onClick={() => handleDelete(m.id)}
                className={`flex items-center gap-1 text-sm font-medium transition-default ${
                  confirmDelete === m.id ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                }`}
              >
                <Trash2 size={14} />
                {confirmDelete === m.id ? 'Confirmer ?' : 'Supprimer'}
              </button>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            Aucun membre. Ajoutez-en un ci-dessus.
          </p>
        )}
      </div>
    </div>
  );
}
