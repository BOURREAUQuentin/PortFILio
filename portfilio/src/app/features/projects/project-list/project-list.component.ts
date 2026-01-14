import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);

  // Exposer l'observable directement au template
  projects$!: Observable<Project[]>;

  // La pagination sera gérée dans le template si possible, ou on garde la logique actuelle
  // Gardons la logique actuelle pour le moment car elle est déjà écrite.
  allProjects: Project[] = [];
  paginatedProjects: Project[] = [];

  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 0;

  ngOnInit(): void {
    // La souscription dans ngOnInit est la bonne approche,
    // le problème est peut-être ailleurs.
    this.projectService.getProjects().subscribe(projects => {
      this.allProjects = projects;
      this.totalPages = Math.ceil(this.allProjects.length / this.itemsPerPage);
      this.updatePaginatedProjects();
    });
  }

  updatePaginatedProjects(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProjects = this.allProjects.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProjects();
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
