export interface UserLink {
  type: 'github' | 'linkedin' | 'instagram' | 'portfolio' | 'website' | 'other';
  url: string;
}

export interface User {
  id: number;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  promo?: string;

  title?: string;
  description?: string;
  avatarUrl?: string;

  // NOUVEAU : Un tableau flexible de liens
  links?: UserLink[];
}
