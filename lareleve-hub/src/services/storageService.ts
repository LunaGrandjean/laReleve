import { AppData } from '../types';

const STORAGE_KEY = 'lareleve_data_v1';
const DOCUMENTS_STORAGE_KEY = 'lareleve_documents_v1';
const ROOT_FILES_STORAGE_KEY = 'lareleve_documents_root_files_v1';
const CONSTRUCTION_STORAGE_KEY = 'lareleve_chantier_v1';
const DB_NAME = 'lareleve_hub_db';
const DB_STORE = 'keyval';
const DB_VERSION = 1;

const normalizeData = (data: Partial<AppData> | null | undefined): AppData => ({
  members: (data?.members || []).map(member => ({
    ...member,
    recherches: (member.recherches || []).map(recherche => ({
      ...recherche,
      statut: normalizeStatus(recherche.statut),
    })),
    offres: (member.offres || []).map(offre => ({
      ...offre,
      statut: normalizeStatus(offre.statut) as typeof offre.statut,
    })),
    travaux: (member.travaux || []).map(travaux => ({
      ...travaux,
      statut: normalizeStatus(travaux.statut) as typeof travaux.statut,
    })),
  })),
  contacts: data?.contacts || [],
  entrepreneurContacts: data?.entrepreneurContacts || [],
});

const normalizeStatus = (value: string) => {
  const replacements: Record<string, string> = {
    ['Accept\u00c3\u00a9e']: 'Acceptée',
    ['Refus\u00c3\u00a9e']: 'Refusée',
    ['R\u00c3\u00a9alis\u00c3\u00a9']: 'Réalisé',
    ['\u00c3\u20ac appeler']: 'À appeler',
    ['Propos\u00c3\u00a9']: 'Proposé',
    ['\u00c3\u20ac \u00c3\u00a9tudier']: 'À étudier',
    ['Visit\u00c3\u00a9']: 'Visité',
  };

  return replacements[value] || value;
};

const readJson = (key: string) => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
};

const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('IndexedDB indisponible'));
    return;
  }

  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(DB_STORE)) {
      db.createObjectStore(DB_STORE);
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const idbGet = async <T>(key: string): Promise<T | null> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const request = tx.objectStore(DB_STORE).get(key);
    request.onsuccess = () => resolve((request.result as T) || null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  });
};

const idbSet = async (key: string, value: unknown): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const request = tx.objectStore(DB_STORE).put(value, key);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
};

const idbDelete = async (key: string): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const request = tx.objectStore(DB_STORE).delete(key);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
};

export const storageService = {
  save: (data: AppData): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  },
  load: (): AppData => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return normalizeData(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    return normalizeData(null);
  },
  loadDocuments: async <T>(): Promise<T | null> => {
    try {
      const idbDocuments = await idbGet<T>(DOCUMENTS_STORAGE_KEY);
      if (idbDocuments) return idbDocuments;
    } catch (e) {
      console.error('Failed to load documents from IndexedDB:', e);
    }

    try {
      return readJson(DOCUMENTS_STORAGE_KEY) as T | null;
    } catch (e) {
      console.error('Failed to load documents from localStorage:', e);
      return null;
    }
  },
  saveDocuments: async (documents: unknown): Promise<void> => {
    try {
      await idbSet(DOCUMENTS_STORAGE_KEY, documents);
      try { localStorage.removeItem(DOCUMENTS_STORAGE_KEY); } catch {}
    } catch (e) {
      console.error('Failed to save documents:', e);
      throw e;
    }
  },
  exportAll: async () => ({
    version: 3,
    exportedAt: new Date().toISOString(),
    appData: storageService.load(),
    documents: await storageService.loadDocuments(),
    rootFiles: readJson(ROOT_FILES_STORAGE_KEY),
    construction: readJson(CONSTRUCTION_STORAGE_KEY),
  }),
  importAll: async (backup: unknown): Promise<void> => {
    const data = backup as {
      appData?: Partial<AppData>;
      documents?: unknown;
      rootFiles?: unknown;
      construction?: unknown;
      members?: AppData['members'];
      contacts?: AppData['contacts'];
      entrepreneurContacts?: AppData['entrepreneurContacts'];
    };

    storageService.save(normalizeData(data.appData || data));

    if ('documents' in data) {
      if (data.documents) await storageService.saveDocuments(data.documents);
      else await idbDelete(DOCUMENTS_STORAGE_KEY);
    }

    if ('rootFiles' in data) {
      if (data.rootFiles) localStorage.setItem(ROOT_FILES_STORAGE_KEY, JSON.stringify(data.rootFiles));
      else localStorage.removeItem(ROOT_FILES_STORAGE_KEY);
    }

    if ('construction' in data) {
      if (data.construction) localStorage.setItem(CONSTRUCTION_STORAGE_KEY, JSON.stringify(data.construction));
      else localStorage.removeItem(CONSTRUCTION_STORAGE_KEY);
    }
  },
};
