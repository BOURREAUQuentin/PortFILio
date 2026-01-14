import { Routes } from '@angular/router';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectDetailComponent } from './project-detail/project-detail.component';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    component: ProjectListComponent
  },
  {
    // Route pour afficher le détail d'un projet en fonction de son ID
    path: ':id',
    component: ProjectDetailComponent
  }
];
