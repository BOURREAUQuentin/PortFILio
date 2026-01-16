import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Project } from '../models/project.model';
import { ToastService } from './toast.service'; // 1. Import du Toast

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private http = inject(HttpClient);
  private toastService = inject(ToastService); // 2. Injection

  private dataUrl = 'assets/data/projects.json';
  private storageKey = 'portfilio_projects';

  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  private isLoaded = false;

  constructor() { }

  getProjects(): Observable<Project[]> {
    if (this.isLoaded) {
      return this.projects$;
    }

    const storedProjects = localStorage.getItem(this.storageKey);

    if (storedProjects) {
      const projects = JSON.parse(storedProjects);
      this.projectsSubject.next(projects);
      this.isLoaded = true;
      return this.projects$;
    } else {
      return this.http.get<Project[]>(this.dataUrl).pipe(
        tap(data => {
          this.projectsSubject.next(data);
          this.isLoaded = true;
          this.saveToStorage(data);
        })
      );
    }
  }

  toggleFavorite(id: number): void {
    const currentProjects = this.projectsSubject.value;
    const projectIndex = currentProjects.findIndex(p => p.id === id);

    if (projectIndex !== -1) {
      const updatedProjects = [...currentProjects];

      // On inverse la valeur
      const newState = !updatedProjects[projectIndex].isFavorite;

      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        isFavorite: newState
      };

      this.projectsSubject.next(updatedProjects);
      this.saveToStorage(updatedProjects);

      // 3. AFFICHAGE DU TOAST
      if (newState) {
        this.toastService.show('Projet ajouté aux favoris', 'success');
      } else {
        // On met 'info' ou 'success' selon ta préférence pour le retrait
        this.toastService.show('Projet retiré des favoris', 'info');
      }
    }
  }

  private saveToStorage(projects: Project[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
  }

  deleteProject(id: number): void {
    const currentProjects = this.projectsSubject.value;

    // On garde tout SAUF celui qui a l'ID à supprimer
    const updatedProjects = currentProjects.filter(p => p.id !== id);

    // 1. Mise à jour de l'observable (l'interface réagira)
    this.projectsSubject.next(updatedProjects);

    // 2. Sauvegarde persistante
    this.saveToStorage(updatedProjects);

    // 3. Notification
    this.toastService.show('Projet supprimé avec succès.', 'success');
  }
}
