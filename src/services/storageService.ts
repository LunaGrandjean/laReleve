import { AppData } from '../types';

const STORAGE_KEY = 'lareleve_data_v1';

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
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    return { members: [], contacts: [] };
  },
};
