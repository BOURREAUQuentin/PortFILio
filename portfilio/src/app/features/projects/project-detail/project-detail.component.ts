import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  protected location = inject(Location); // Pour le bouton retour

  project$!: Observable<Project | undefined>;

  ngOnInit(): void {
    // Récupérer l'ID depuis l'URL et charger le projet
    const projectId = Number(this.route.snapshot.paramMap.get('id'));
    if (projectId) {
      this.project$ = this.projectService.getProjectById(projectId);
    }
  }
}
