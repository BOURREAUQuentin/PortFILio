import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, throwError, of, switchMap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private usersUrl = 'assets/data/users.json';
  private usersDB: User[] = []; // Base de données en mémoire

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Charger les utilisateurs au démarrage du service
    this.loadUsers().subscribe();
  }

  private loadUsers(): Observable<User[]> {
    const storedUsers = localStorage.getItem('users_db');
    if (storedUsers) {
      this.usersDB = JSON.parse(storedUsers);
      return of(this.usersDB);
    }
    return this.http.get<User[]>(this.usersUrl).pipe(
      tap(users => {
        this.usersDB = users;
        localStorage.setItem('users_db', JSON.stringify(this.usersDB));
      })
    );
  }

  private saveUsers() {
    localStorage.setItem('users_db', JSON.stringify(this.usersDB));
  }

  autoLogin() {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user: User = JSON.parse(userData);
      this.currentUserSubject.next(user);
    }
  }

  login(email: string, password: string): Observable<User | null> {
    const user = this.usersDB.find(u => u.email === email && u.password === password);
    if (user) {
      this.currentUserSubject.next(user);
      localStorage.setItem('user', JSON.stringify(user));
      return of(user);
    }
    return throwError(() => new Error('Email ou mot de passe incorrect.'));
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  register(userData: Omit<User, 'id'>): Observable<User> {
    // Vérifier si l'email existe déjà
    if (this.usersDB.some(u => u.email === userData.email)) {
      return throwError(() => new Error('Cet email est déjà utilisé.'));
    }

    const newUser: User = {
      id: Date.now(),
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    };

    // Ajouter le nouvel utilisateur à notre BDD en mémoire et sauvegarder
    this.usersDB.push(newUser);
    this.saveUsers();

    console.log('Utilisateur ajouté à la BDD simulée :', newUser);
    return of(newUser);
  }
}
