import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  private usersKey = 'portfilio_users'; // La "Base de données" locale
  private currentUserKey = 'portfilio_current_user'; // La session active

  // State de l'utilisateur connecté
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.initUsers();
    this.restoreSession();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // 1. Initialisation : Si c'est la 1ère fois qu'on vient sur le site, on charge le JSON dans le LocalStorage
  private initUsers(): void {
    const storedUsers = localStorage.getItem(this.usersKey);
    if (!storedUsers) {
      this.http.get<User[]>('assets/data/users.json').subscribe({
        next: (data) => {
          localStorage.setItem(this.usersKey, JSON.stringify(data));
        },
        error: () => console.warn('Impossible de charger users.json initial')
      });
    }
  }

  // 2. Restaure la session au F5
  private restoreSession(): void {
    const storedUser = localStorage.getItem(this.currentUserKey);
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  // 3. Helper : Lire la "DB" locale
  private getUsersFromStorage(): User[] {
    const usersStr = localStorage.getItem(this.usersKey);
    return usersStr ? JSON.parse(usersStr) : [];
  }

  // --- ACTIONS ---

  login(email: string, pass: string): boolean {
    const users = this.getUsersFromStorage();
    // On cherche dans le localStorage (qui contient les users de base + les nouveaux)
    const user = users.find(u => u.email === email && u.password === pass);

    if (user) {
      this.setCurrentUser(user);
      this.toast.show(`Ravi de vous revoir, ${user.firstName} !`, 'success');
      return true;
    }

    this.toast.show('Email ou mot de passe incorrect.', 'error');
    return false;
  }

  register(newUser: User): boolean {
    const users = this.getUsersFromStorage();

    // 1. Vérifier doublon
    if (users.find(u => u.email === newUser.email)) {
      this.toast.show('Cet email est déjà utilisé.', 'error');
      return false;
    }

    // 2. Générer ID unique
    newUser.id = Date.now();

    // 3. Ajouter à la liste et SAUVEGARDER
    users.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    // 4. Connecter directement
    this.setCurrentUser(newUser);
    this.toast.show('Inscription réussie ! Bienvenue.', 'success');

    return true;
  }

  logout(): void {
    localStorage.removeItem(this.currentUserKey);
    this.currentUserSubject.next(null);
    this.toast.show('Vous avez été déconnecté.', 'info');
    this.router.navigate(['/login']);
  }

  private setCurrentUser(user: User): void {
    // On retire le mot de passe de la session par sécurité
    const { password, ...safeUser } = user;
    localStorage.setItem(this.currentUserKey, JSON.stringify(safeUser));
    this.currentUserSubject.next(safeUser);
  }

  /////// PROFILE ///////

  updateUser(updatedUser: User): void {
    // 1. Mise à jour du localStorage "DB"
    const users = this.getUsersFromStorage();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      // 3. Récupérer l'utilisateur COMPLET existant en base (avec son password)
      const existingUserInDb = users[index];

      // 4. FUSION INTELLIGENTE
      // On prend l'objet complet de la DB (avec pwd) et on écrase avec les nouvelles données.
      // On force explicitement le maintien du mot de passe et de l'email de la DB pour être sûr.
      const finalUser: User = {
        ...existingUserInDb, // Garde tout ce qu'il y avait avant (dont le password)
        ...updatedUser,      // Écrase avec les nouvelles infos (Nom, Avatar, Links...)
        password: existingUserInDb.password, // Sécurité : On remet le mdp d'origine
        email: existingUserInDb.email        // Sécurité : On garde l'email d'origine
      };

      // 5. Sauvegarde dans le localStorage
      users[index] = finalUser;
      localStorage.setItem(this.usersKey, JSON.stringify(users));

      // 6. Mise à jour de la session active (Observable)
      this.setCurrentUser(finalUser);
    }
  }
}
