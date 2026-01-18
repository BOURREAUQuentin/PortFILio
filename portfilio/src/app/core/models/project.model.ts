export interface Author {
  id: number; // LE LIEN CLÉ avec users.json
  name: string;
  avatarUrl?: string;
}

export interface ProjectLink {
  title: string;
  url: string;
}

// Structure pour l'état des filtres
export interface ProjectFilters {
  tags: string[];     // ex: ['Docker', 'Python']
  modules: string[];  // ex: ['IHM']
  promos: string[];   // ex: ['A1', 'A3']
  // On garde en mémoire si la section entière est active ou non
  sectionsActive: {
    tags: boolean;
    modules: boolean;
    promos: boolean;
  };
}

export interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string; // Image principale
  additionalImages?: string[]; // Les 4 petites images
  origin?: string; // "Origine du projet"
  skillsLearned?: string; // "Ce qu'ils ont appris"
  authors: Author[]; // Tableau d'auteurs avec ID
  isFavorite: boolean; // Chargé à la volée suivant l'utilisateur connecté (la donnée est dynamique)
  tags: string[];
  promo: string;
  modules?: string[]; // NOUVEAU : Liste des modules (ex: IHM, Gestion...)
  links?: ProjectLink[];
}
