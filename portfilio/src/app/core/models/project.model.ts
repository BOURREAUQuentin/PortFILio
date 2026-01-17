export interface Author {
  id: number; // LE LIEN CLÉ avec users.json
  name: string;
  avatarUrl?: string;
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
  isFavorite: boolean;
  tags: string[];
  promo: string;
  links?: {
    github?: string;
    slides?: string;
  };
}
