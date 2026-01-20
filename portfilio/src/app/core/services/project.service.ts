import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { Project, ProjectFilters } from '../models/project.model';
import { ToastService } from './toast.service';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
// On importe le type pour le typage strict
import { SortOption } from '../../shared/components/search-bar/search-bar.component';

// Interface générique pour sauvegarder l'état d'une page (Home ou Favoris)
export interface PageState {
  currentPage: number;
  searchQuery: string;
  sortType: SortOption | string; // Accepte les deux pour flexibilité
  filters: ProjectFilters;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  private projectsSubject = new BehaviorSubject<Project[]>([]);

  // --- 1. ETAT PAGE HOME ---
  private homeState: PageState = {
    currentPage: 1,
    searchQuery: '',
    sortType: 'recent',
    filters: { tags: [], modules: [], promos: [], sectionsActive: { tags: true, modules: true, promos: true } }
  };

  // --- 2. ETAT PAGE FAVORIS (NOUVEAU) ---
  private favoritesState: PageState = {
    currentPage: 1,
    searchQuery: '',
    sortType: 'recent',
    filters: { tags: [], modules: [], promos: [], sectionsActive: { tags: true, modules: true, promos: true } }
  };

  constructor() {
    this.loadProjects();
  }

  // --- GESTION ETAT HOME ---
  getHomeState(): PageState { return this.homeState; }
  saveHomeState(state: Partial<PageState>): void { this.homeState = { ...this.homeState, ...state }; }
  resetHomeState(): void {
    this.homeState = { currentPage: 1, searchQuery: '', sortType: 'recent', filters: { tags: [], modules: [], promos: [], sectionsActive: { tags: true, modules: true, promos: true } } };
  }

  // --- GESTION ETAT FAVORIS (NOUVEAU) ---
  getFavoritesState(): PageState { return this.favoritesState; }
  saveFavoritesState(state: Partial<PageState>): void { this.favoritesState = { ...this.favoritesState, ...state }; }


  // --- LOGIQUE PROJETS (Code existant conservé) ---

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

  getProjects(): Observable<Project[]> {
    return combineLatest([
      this.projectsSubject,
      this.authService.currentUser$
    ]).pipe(
      map(([projects, currentUser]) => {
        const allUsersRaw = localStorage.getItem('portfilio_users');
        const allUsers: User[] = allUsersRaw ? JSON.parse(allUsersRaw) : [];

        return projects.map(project => {
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

          const isFav = currentUser?.favorites?.includes(project.id) ?? false;

          return {
            ...project,
            authors: updatedAuthors,
            isFavorite: isFav
          };
        });
      })
    );
  }

  toggleFavorite(projectId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.show('Vous devez être connecté pour aimer un projet.', 'error');
      return;
    }
    this.authService.toggleProjectFavorite(projectId);
    const isNowFavorite = this.authService.getCurrentUser()?.favorites?.includes(projectId);
    const msg = isNowFavorite ? 'Projet ajouté aux favoris' : 'Projet retiré des favoris';
    this.toastService.show(msg, 'success');
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

  getAllTags(): string[] {
    const projects = this.projectsSubject.value;
    const allTags = projects.flatMap(p => p.tags);
    return [...new Set(allTags)].sort();
  }

  getAllModules(): string[] {
    const projects = this.projectsSubject.value;
    const allModules = projects.flatMap(p => p.modules || []);
    return [...new Set(allModules)].sort();
  }

  saveProject(project: Project): number {
    const projects = this.projectsSubject.value;
    if (project.id && project.id > 0) {
      const index = projects.findIndex(p => p.id === project.id);
      if (index > -1) {
        projects[index] = project;
        this.projectsSubject.next([...projects]);
        this.saveToStorage(projects);
        return project.id;
      }
    }
    const maxId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) : 0;
    const newId = maxId + 1;
    project.id = newId;
    const newProjectsList = [...projects, project];
    this.projectsSubject.next(newProjectsList);
    this.saveToStorage(newProjectsList);
    return newId;
  }
}
