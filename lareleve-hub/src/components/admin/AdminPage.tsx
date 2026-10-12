import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Database, Plus, Save, Trash2, Upload } from 'lucide-react';
import { apiService, AuthUser } from '@/services/apiService';
import { storageService } from '@/services/storageService';

export default function AdminPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [passwordEdits, setPasswordEdits] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    const result = await apiService.listUsers();
    setUsers(result.users);
  };

  useEffect(() => {
    loadUsers().catch(e => setError(e instanceof Error ? e.message : 'Chargement impossible'));
  }, []);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await apiService.createUser({ name, email, password, role: 'user' });
      setName('');
      setEmail('');
      setPassword('');
      setMessage('Compte créé.');
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Création impossible');
    }
  };

  const updateLocalUser = (userId: string, key: 'name' | 'email', value: string) => {
    setUsers(prev => prev.map(user => (user.id === userId ? { ...user, [key]: value } : user)));
  };

  const saveUser = async (user: AuthUser) => {
    setMessage('');
    setError('');
    try {
      await apiService.updateUser(user.id, {
        name: user.name,
        email: user.email,
        password: passwordEdits[user.id] || undefined,
      });
      setPasswordEdits(prev => ({ ...prev, [user.id]: '' }));
      setMessage('Compte mis à jour.');
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Modification impossible');
    }
  };

  const importBackup = (userId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      setMessage('');
      setError('');
      try {
        await apiService.importUserBackup(userId, storageService.prepareBackupForCloud(JSON.parse(String(reader.result))));
        setMessage('Données importées dans le compte. Les fichiers trop volumineux sont gardés hors synchronisation cloud.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Import impossible');
      }
    };
    reader.readAsText(file);
  };

  const deleteUser = async (userId: string) => {
    setMessage('');
    setError('');
    try {
      await apiService.deleteUser(userId);
      setMessage('Compte supprimé.');
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Suppression impossible');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">Création des comptes, modification des identifiants et import des données existantes.</p>
      </div>

      <form onSubmit={createUser} className="premium-card grid gap-3 p-5 lg:grid-cols-[1fr_1fr_180px_auto] lg:items-end">
        <Field label="Nom" value={name} onChange={setName} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Mot de passe" value={password} onChange={setPassword} type="password" />
        <button type="submit" className="action-button-primary">
          <Plus size={16} /> Créer
        </button>
      </form>

      {(message || error) && (
        <div className={`premium-card p-3 text-sm ${error ? 'text-destructive' : 'text-success'}`}>
          {error || message}
        </div>
      )}

      <div className="table-shell">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-white/[0.08] bg-white/[0.04]">
            <tr>
              {['Nom', 'Email', 'Rôle', 'Nouveau mot de passe', 'Données', ''].map(label => (
                <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.08]">
            {users.map(user => (
              <tr key={user.id} className="transition-default hover:bg-white/[0.04]">
                <td className="px-4 py-3">
                  <input
                    value={user.name}
                    onChange={event => updateLocalUser(user.id, 'name', event.target.value)}
                    className="w-44 rounded border border-white/[0.08] bg-white/[0.05] px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={user.email}
                    onChange={event => updateLocalUser(user.id, 'email', event.target.value)}
                    type="email"
                    className="w-64 rounded border border-white/[0.08] bg-white/[0.05] px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">
                  <input
                    value={passwordEdits[user.id] || ''}
                    onChange={event => setPasswordEdits(prev => ({ ...prev, [user.id]: event.target.value }))}
                    type="password"
                    placeholder="Laisser vide"
                    className="w-44 rounded border border-white/[0.08] bg-white/[0.05] px-2 py-1 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-3">
                  <label className="action-button inline-flex cursor-pointer">
                    <Upload size={15} /> Importer JSON
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        const file = event.target.files?.[0];
                        if (file) importBackup(user.id, file);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => saveUser(user)} className="mr-3 text-primary transition-default hover:text-primary/80" title="Enregistrer">
                    <Save size={15} />
                  </button>
                  <button onClick={() => deleteUser(user.id)} className="text-destructive transition-default hover:text-destructive/80" title="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                  <Database className="mx-auto mb-2" size={20} />
                  Aucun compte
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        type={type}
        className="w-full rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
        required
      />
    </label>
  );
}
