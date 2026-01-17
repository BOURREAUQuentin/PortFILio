import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Project } from '../models/project.model';
import { ToastService } from './toast.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  // BehaviorSubject contient les données "brutes" (telles que stockées en JSON/Storage)
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
   * C'EST ICI QUE LA MAGIE OPÈRE (HYDRATATION)
   * On retourne un Observable qui modifie les données à la volée avant de les donner au composant.
   */
  getProjects(): Observable<Project[]> {
    return this.projectsSubject.asObservable().pipe(
      map(projects => {
        // 1. On lit les users à jour (qui contiennent potentiellement la nouvelle photo Base64)
        const usersRaw = localStorage.getItem('portfilio_users');
        const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];

        // 2. On parcourt les projets pour mettre à jour leurs auteurs
        return projects.map(project => {

          const updatedAuthors = project.authors.map(author => {
            // On cherche le User correspondant (avec conversion String/Number par sécurité)
            const realUser = users.find(u => Number(u.id) === Number(author.id));

            if (realUser) {
              // Si trouvé, on fusionne les infos :
              // On garde l'ID de l'auteur, mais on prend le Nom et l'Avatar du User à jour
              return {
                ...author,
                name: `${realUser.firstName} ${realUser.lastName}`,
                // Priorité à l'avatar du User (Base64), sinon celui de l'auteur (json), sinon undefined
                avatarUrl: realUser.avatarUrl || author.avatarUrl
              };
            }
            return author;
          });

          // On retourne une COPIE du projet avec les auteurs mis à jour
          return { ...project, authors: updatedAuthors };
        });
      })
    );
  }

  toggleFavorite(projectId: number): void {
    const currentProjects = this.projectsSubject.value;
    // On travaille sur une copie pour le changement d'état
    const updatedProjects = currentProjects.map(p => {
      if (p.id === projectId) {
        const newState = !p.isFavorite;
        const msg = newState ? 'Projet ajouté aux favoris' : 'Projet retiré des favoris';
        this.toastService.show(msg, 'success');
        return { ...p, isFavorite: newState };
      }
      return p;
    });

    this.projectsSubject.next(updatedProjects);
    this.saveToStorage(updatedProjects);
  }

  deleteProject(id: number): void {
    const currentProjects = this.projectsSubject.value;
    const updatedProjects = currentProjects.filter(p => p.id !== id);

    this.projectsSubject.next(updatedProjects);
    this.saveToStorage(updatedProjects);
    this.toastService.show('Projet supprimé avec succès.', 'success');
  }

  // Sauvegarde les projets BRUTS (sans l'avatar Base64 du User pour ne pas surcharger le storage 'portfilio_projects')
  private saveToStorage(projects: Project[]): void {
    localStorage.setItem('portfilio_projects', JSON.stringify(projects));
  }
}
