import { useEffect, useRef } from 'react';
import { apiService } from '@/services/apiService';
import { storageService } from '@/services/storageService';
import { useAuth } from '@/context/AuthContext';

export default function CloudAutosync() {
  const { user } = useAuth();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const sync = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(async () => {
        try {
          await apiService.saveBackup(await storageService.exportAll());
        } catch (error) {
          console.error('Cloud sync failed:', error);
        }
      }, 900);
    };

    window.addEventListener('lareleve:data-change', sync);
    sync();

    return () => {
      window.removeEventListener('lareleve:data-change', sync);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [user]);

  return null;
}
