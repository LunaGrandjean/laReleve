import { Contact } from '@/types';
import EditableTable, { ColumnDef } from '../shared/EditableTable';

interface ContactsPageProps {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  entrepreneurContacts: Contact[];
  setEntrepreneurContacts: (contacts: Contact[]) => void;
}

const columns: ColumnDef<Contact>[] = [
  { key: 'nom', label: 'Nom / Prénom', width: '150px' },
  { key: 'telephone', label: 'Numéro', width: '130px' },
  { key: 'email', label: 'Mail', width: '180px' },
  { key: 'source', label: 'Sources', width: '120px' },
  { key: 'commentaire', label: 'Commentaires', type: 'textarea', width: '240px' },
];

const createEmpty = (): Contact => ({
  id: Date.now().toString(),
  nom: '',
  telephone: '',
  email: '',
  source: '',
  commentaire: '',
});

export default function ContactsPage({
  contacts,
  setContacts,
  entrepreneurContacts,
  setEntrepreneurContacts,
}: ContactsPageProps) {
  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
        <p className="page-subtitle">Carnet d’adresses agences et entrepreneurs.</p>
      </div>

      <section className="space-y-3">
        <h2 className="section-title">01 — Contacts agences</h2>
        <EditableTable columns={columns} rows={contacts} onUpdate={setContacts} createEmpty={createEmpty} />
      </section>

      <section className="space-y-3">
        <h2 className="section-title">02 — Contacts entrepreneurs</h2>
        <EditableTable columns={columns} rows={entrepreneurContacts} onUpdate={setEntrepreneurContacts} createEmpty={createEmpty} />
      </section>
    </div>
  );
}
