import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { LegalComponent } from './pages/legal/legal.component';
import { ContactComponent } from './pages/contact/contact.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import {FavoritesComponent} from './pages/favorites/favorites.component';
import {ProfileComponent} from './pages/profile/profile.component';
import {EditProfileComponent} from './pages/profile/edit-profile.component';
import {ProjectDetailComponent} from './pages/project-detail/project-detail.component';
import {ProjectFormComponent} from './pages/project-form/project-form.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'home', component: HomeComponent },
  { path: 'favorites', component: FavoritesComponent },
  // Route pour voir son propre profil (redirection ou gestion auto)
  { path: 'profile', component: ProfileComponent },
  // Route pour voir le profil d'un autre (ou le sien via ID)
  { path: 'profile/:id', component: ProfileComponent },
  {
    path: 'edit-profile',
    component: EditProfileComponent,
    canDeactivate: [(component: EditProfileComponent) => component.canDeactivate()]
  },

  { path: 'project/:id', component: ProjectDetailComponent },
  // --- ROUTES AVEC GUARD ---
  {
    path: 'create-project',
    component: ProjectFormComponent,
    canDeactivate: [(component: ProjectFormComponent) => component.canDeactivate()]
  },
  {
    path: 'edit-project/:id',
    component: ProjectFormComponent,
    canDeactivate: [(component: ProjectFormComponent) => component.canDeactivate()]
  },

  { path: 'about', component: AboutComponent },
  { path: 'legal', component: LegalComponent },
  { path: 'contact', component: ContactComponent },
];
