export interface Author {
  name: string;
  avatarUrl?: string; // Optionnel (sinon placeholder)
}

export interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  authors: Author[];
  isFavorite: boolean;

  // Ajoutés pour correspondre au JSON et aux fonctionnalités :
  tags: string[];      // Pour la recherche et les filtres
  promo: string;       // Pour le tag sur le carousel (ex: "A1", "A3")

  // Optionnels (utiles pour la future page de détails)
  links?: {
    github?: string;
    slides?: string;
  };
}
