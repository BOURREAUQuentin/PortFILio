import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  // Route par défaut (redirige vers /home)
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // La page d'accueil
  { path: 'home', component: HomeComponent },

  // (Futur) La page de détail avec un paramètre ID
  // { path: 'project/:id', loadComponent: () => import('./pages/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },
];
