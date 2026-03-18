import { Contact } from '@/types';
import EditableTable, { ColumnDef } from '../shared/EditableTable';

interface ContactsPageProps {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
}

const columns: ColumnDef<Contact>[] = [
  { key: 'nom', label: 'Nom / Prénom', width: '150px' },
  { key: 'telephone', label: 'Numéro', width: '130px' },
  { key: 'email', label: 'Mail', width: '180px' },
  { key: 'source', label: 'Sources', width: '120px' },
  { key: 'commentaire', label: 'Commentaires', width: '200px' },
];

const createEmpty = (): Contact => ({
  id: Date.now().toString(),
  nom: '',
  telephone: '',
  email: '',
  source: '',
  commentaire: '',
});

export default function ContactsPage({ contacts, setContacts }: ContactsPageProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold">Contacts</h1>
      <EditableTable columns={columns} rows={contacts} onUpdate={setContacts} createEmpty={createEmpty} />
    </div>
  );
}
