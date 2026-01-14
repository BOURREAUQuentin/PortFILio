import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private dataUrl = 'assets/data/projects.json';

  constructor(private http: HttpClient) { }

  // Récupérer tous les projets
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.dataUrl);
  }

  // Récupérer un projet par ID (simulation car on n'a pas de vrai backend)
  getProjectById(id: number): Observable<Project | undefined> {
    return this.getProjects().pipe(
      map(projects => projects.find(p => p.id === id))
    );
  }

  // Simulation du toggle favori (ne persistera pas au refresh sans backend)
  // Dans un vrai cas, on enverrait une requête PUT/POST
  toggleFavorite(id: number): void {
    console.log(`Toggle favori pour le projet ${id} (Mock)`);
  }
}
