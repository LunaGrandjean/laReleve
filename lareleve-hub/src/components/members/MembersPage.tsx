import { useState } from 'react';
import { Member } from '@/types';
import { Plus, Trash2, ChevronRight } from 'lucide-react';

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
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Membres</h1>

      {/* Add form */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Nom du nouveau membre"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 max-w-sm border border-input rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-default"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
          <div
            key={m.id}
            className="bg-card border border-border rounded-lg p-5 shadow-card hover:shadow-elevated transition-default flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold text-lg">{m.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {m.recherches.length} recherches · {m.offres.length} offres · {m.travaux.length} travaux
              </p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <button
                onClick={() => onSelectMember(m.id)}
                className="flex items-center gap-1 text-primary font-medium text-sm hover:underline"
              >
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
          <p className="text-muted-foreground col-span-full text-center py-12">
            Aucun membre. Ajoutez-en un ci-dessus.
          </p>
        )}
      </div>
    </div>
  );
}
