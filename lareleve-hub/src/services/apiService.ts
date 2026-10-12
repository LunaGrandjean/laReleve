export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 413) throw new Error('Fichier trop volumineux pour la synchronisation cloud.');
    if (response.status === 404) throw new Error('API introuvable. Vérifie le déploiement Vercel.');
    throw new Error(data.error || `Erreur serveur (${response.status})`);
  }
  return data as T;
}

export const apiService = {
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  loadBackup: (userId?: string) => {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return request<{ backup: unknown | null; updatedAt: string | null }>(`/api/data${query}`);
  },
  saveBackup: (backup: unknown) =>
    request<{ ok: true }>('/api/data', {
      method: 'PUT',
      body: JSON.stringify({ backup }),
    }),
  listUsers: () => request<{ users: AuthUser[] }>('/api/admin/users'),
  createUser: (payload: { email: string; name: string; password: string; role: 'admin' | 'user' }) =>
    request<{ user: AuthUser }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  importUserBackup: (userId: string, backup: unknown) =>
    request<{ ok: true }>(`/api/admin/users/${userId}/data`, {
      method: 'POST',
      body: JSON.stringify({ backup }),
    }),
  deleteUser: (userId: string) =>
    request<{ ok: true }>(`/api/admin/users/${userId}`, { method: 'DELETE' }),
};
