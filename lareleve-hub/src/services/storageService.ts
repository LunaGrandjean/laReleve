import { AppData } from '../types';

const STORAGE_KEY = 'lareleve_data_v1';
const DOCUMENTS_STORAGE_KEY = 'lareleve_documents_v1';
const ROOT_FILES_STORAGE_KEY = 'lareleve_documents_root_files_v1';

const normalizeData = (data: Partial<AppData> | null | undefined): AppData => ({
  members: data?.members || [],
  contacts: data?.contacts || [],
  entrepreneurContacts: data?.entrepreneurContacts || [],
});

const readJson = (key: string) => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
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
  exportAll: () => ({
    version: 2,
    exportedAt: new Date().toISOString(),
    appData: storageService.load(),
    documents: readJson(DOCUMENTS_STORAGE_KEY),
    rootFiles: readJson(ROOT_FILES_STORAGE_KEY),
  }),
  importAll: (backup: unknown): void => {
    const data = backup as {
      appData?: Partial<AppData>;
      documents?: unknown;
      rootFiles?: unknown;
      members?: AppData['members'];
      contacts?: AppData['contacts'];
      entrepreneurContacts?: AppData['entrepreneurContacts'];
    };

    storageService.save(normalizeData(data.appData || data));

    if ('documents' in data) {
      if (data.documents) localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(data.documents));
      else localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
    }

    if ('rootFiles' in data) {
      if (data.rootFiles) localStorage.setItem(ROOT_FILES_STORAGE_KEY, JSON.stringify(data.rootFiles));
      else localStorage.removeItem(ROOT_FILES_STORAGE_KEY);
    }
  },
};
