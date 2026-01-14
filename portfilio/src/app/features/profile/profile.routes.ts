import { Routes } from '@angular/router';
import { Component } from '@angular/core';

// --- Composant de test ---
@Component({
  standalone: true,
  template: `<h1>Profil</h1>`
})
export class ProfileComponent {}
// -------------------------

export const PROFILE_ROUTES: Routes = [
  { path: '', component: ProfileComponent }
];
