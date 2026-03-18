import { useState, useEffect, useCallback } from 'react';
import { AppData, Member, Contact } from '../types';
import { storageService } from '../services/storageService';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => storageService.load());

  useEffect(() => {
    storageService.save(data);
  }, [data]);

  const setContacts = useCallback((contacts: Contact[]) => {
    setData(prev => ({ ...prev, contacts }));
  }, []);

  const addMember = useCallback((name: string) => {
    const newMember: Member = {
      id: Date.now().toString(),
      name,
      notes: '',
      recherches: [],
      offres: [],
      travaux: [],
    };
    setData(prev => ({ ...prev, members: [...prev.members, newMember] }));
  }, []);

  const deleteMember = useCallback((id: string) => {
    setData(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
  }, []);

  const updateMember = useCallback((updated: Member) => {
    setData(prev => ({
      ...prev,
      members: prev.members.map(m => (m.id === updated.id ? updated : m)),
    }));
  }, []);

  return { data, setContacts, addMember, deleteMember, updateMember };
}
