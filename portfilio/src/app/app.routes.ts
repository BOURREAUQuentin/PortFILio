import { Routes } from '@angular/router';

export const routes: Routes = [
  // Redirige la racine (http://localhost:4200/) vers /projects
  { path: '', redirectTo: '/projects', pathMatch: 'full' },

  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'projects',
    loadChildren: () => import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES)
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
  },

  { path: '**', redirectTo: '/projects' }
];
