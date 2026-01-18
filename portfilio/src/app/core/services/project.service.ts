import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs'; // Ajout combineLatest
import { Project } from '../models/project.model';
import { ToastService } from './toast.service';
import { User } from '../models/user.model';
import { AuthService } from './auth.service'; // Import Auth

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private authService = inject(AuthService); // Injection Auth

  // Source de données "brutes" des projets
  private projectsSubject = new BehaviorSubject<Project[]>([]);

  constructor() {
    this.loadProjects();
  }

  private loadProjects(): void {
    const storedProjects = localStorage.getItem('portfilio_projects');
    if (storedProjects) {
      this.projectsSubject.next(JSON.parse(storedProjects));
    } else {
      this.http.get<Project[]>('assets/data/projects.json').subscribe({
        next: (data) => {
          this.projectsSubject.next(data);
          this.saveToStorage(data);
        },
        error: (err) => console.error('Erreur chargement projets', err)
      });
    }
  }

  /**
   * HYDRATATION INTELLIGENTE :
   * Combine les Projets + L'User connecté.
   * Si l'User change (ou like), cette liste se met à jour automatiquement partout.
   */
  getProjects(): Observable<Project[]> {
    return combineLatest([
      this.projectsSubject,        // Flux des projets
      this.authService.currentUser$ // Flux de l'utilisateur
    ]).pipe(
      map(([projects, currentUser]) => {

        // Récupérer tous les users pour l'hydratation des avatars auteurs (comme avant)
        const allUsersRaw = localStorage.getItem('portfilio_users');
        const allUsers: User[] = allUsersRaw ? JSON.parse(allUsersRaw) : [];

        return projects.map(project => {
          // 1. Hydratation Auteurs (Avatar & Nom)
          const updatedAuthors = project.authors.map(author => {
            const realUser = allUsers.find(u => Number(u.id) === Number(author.id));
            if (realUser) {
              return {
                ...author,
                name: `${realUser.firstName} ${realUser.lastName}`,
                avatarUrl: realUser.avatarUrl || author.avatarUrl
              };
            }
            return author;
          });

          // 2. Hydratation FAVORIS (C'est ici que ça se joue !)
          // Le projet est favori SI son ID est dans la liste 'favorites' de l'utilisateur courant
          const isFav = currentUser?.favorites?.includes(project.id) ?? false;

          return {
            ...project,
            authors: updatedAuthors,
            isFavorite: isFav // On écrase la valeur du JSON par la valeur réelle user
          };
        });
      })
    );
  }

  // Action de Like
  toggleFavorite(projectId: number): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.toastService.show('Vous devez être connecté pour aimer un projet.', 'error');
      return;
    }

    // 1. On demande à l'AuthService de mettre à jour le User
    this.authService.toggleProjectFavorite(projectId);

    // 2. On affiche le Toast
    // On vérifie l'état APRES mise à jour pour le message
    const isNowFavorite = this.authService.getCurrentUser()?.favorites?.includes(projectId);
    const msg = isNowFavorite ? 'Projet ajouté aux favoris' : 'Projet retiré des favoris';
    this.toastService.show(msg, 'success');

    // Note : Pas besoin de toucher à projectsSubject ni saveToStorage('portfilio_projects').
    // Le combineLatest dans getProjects détectera le changement de currentUser
    // et mettra à jour la vue automatiquement.
  }

  deleteProject(id: number): void {
    const currentProjects = this.projectsSubject.value;
    const updatedProjects = currentProjects.filter(p => p.id !== id);

    this.projectsSubject.next(updatedProjects);
    this.saveToStorage(updatedProjects);
    this.toastService.show('Projet supprimé avec succès.', 'success');
  }

  private saveToStorage(projects: Project[]): void {
    localStorage.setItem('portfilio_projects', JSON.stringify(projects));
  }

  // Récupérer tous les tags uniques existants
  getAllTags(): string[] {
    const projects = this.projectsSubject.value;
    const allTags = projects.flatMap(p => p.tags);
    return [...new Set(allTags)].sort();
  }

  // Récupérer tous les modules uniques
  getAllModules(): string[] {
    const projects = this.projectsSubject.value;
    const allModules = projects.flatMap(p => p.modules || []);
    return [...new Set(allModules)].sort();
  }

  // Créer ou Mettre à jour
  saveProject(project: Project): void {
    const projects = this.projectsSubject.value;
    const index = projects.findIndex(p => p.id === project.id);

    if (index > -1) {
      // EDIT
      projects[index] = project;
    } else {
      // CREATE (Générer ID simple)
      const newId = Math.max(...projects.map(p => p.id), 0) + 1;
      project.id = newId;
      projects.push(project);
    }

    this.projectsSubject.next(projects);
    this.saveToStorage(projects);
  }
}
