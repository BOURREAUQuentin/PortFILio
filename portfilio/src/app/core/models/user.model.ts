export interface User {
  id: number;
  email: string;
  password?: string; // Optionnel car on ne le stocke pas dans le state frontend une fois connecté
  firstName: string;
  lastName: string;
  promo?: string;
  avatarUrl?: string;
}
