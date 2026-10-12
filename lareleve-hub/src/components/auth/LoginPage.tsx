import { FormEvent, useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-bg" />
      <main className="app-layer flex min-h-screen items-center justify-center px-4">
        <form onSubmit={handleSubmit} className="premium-card w-full max-w-md space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Lock size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-white">Connexion</h1>
              <p className="text-sm text-muted-foreground">Accès sécurisé à LaRelève.</p>
            </div>
          </div>

          <label className="space-y-1">
            <span className="block text-xs font-semibold uppercase text-muted-foreground">Email</span>
            <input
              value={email}
              onChange={event => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="block text-xs font-semibold uppercase text-muted-foreground">Mot de passe</span>
            <input
              value={password}
              onChange={event => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" className="action-button-primary w-full justify-center" disabled={submitting}>
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </main>
    </div>
  );
}
