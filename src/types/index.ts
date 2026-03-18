export type StatusOffre = 'Acceptée' | 'En attente' | 'Refusée';
export type StatusTravaux = 'Réalisé' | 'En cours';

export interface Contact {
  id: string;
  nom: string;
  telephone: string;
  email: string;
  source: string;
  commentaire: string;
}

export interface Recherche {
  id: string;
  date: string;
  visite: string;
  bien: string;
  adresse: string;
  prix: string;
  prixM2: string;
  marge: string;
  nego: string;
  agence: string;
  lien: string;
  infos: string;
}

export interface Offre {
  id: string;
  type: string;
  adresse: string;
  statut: StatusOffre;
  prixAffiche: string;
  prixPropose: string;
  prixAchete: string;
  date: string;
  commentaire: string;
  agence: string;
  photos: string;
}

export interface Travaux {
  id: string;
  tache: string;
  statut: StatusTravaux;
  cout: string;
  date: string;
}

export interface Member {
  id: string;
  name: string;
  notes: string;
  recherches: Recherche[];
  offres: Offre[];
  travaux: Travaux[];
}

export interface AppData {
  members: Member[];
  contacts: Contact[];
}
