import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, of } from 'rxjs';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private dataUrl = 'assets/data/projects.json';

  // NOUVEAU : On stocke les projets ici pour ne pas les perdre
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  // Pour savoir si on a déjà chargé les données
  private isLoaded = false;

  constructor(private http: HttpClient) { }

  // Nouvelle méthode optimisée
  getProjects(): Observable<Project[]> {
    // Si les données sont déjà chargées, on renvoie ce qu'on a en mémoire
    if (this.isLoaded) {
      return this.projects$;
    }

    // Sinon, on va chercher le JSON
    return this.http.get<Project[]>(this.dataUrl).pipe(
      tap(data => {
        this.projectsSubject.next(data); // On met à jour la mémoire
        this.isLoaded = true; // On note que c'est chargé
      })
    );
  }

  // Modification du toggle pour qu'il mette à jour la mémoire locale aussi
  toggleFavorite(id: number): void {
    const currentProjects = this.projectsSubject.value;
    const project = currentProjects.find(p => p.id === id);

    if (project) {
      // On inverse la valeur
      project.isFavorite = !project.isFavorite;
      // On prévient tous les composants que les données ont changé
      this.projectsSubject.next([...currentProjects]);
    }
  }
}
