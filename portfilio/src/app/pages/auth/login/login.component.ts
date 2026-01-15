import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';

  onSubmit() {
    // Le service gère déjà l'affichage du Toast (Succès ou Erreur)
    // On a juste besoin de rediriger si c'est bon.
    if (this.authService.login(this.email, this.password)) {
      this.router.navigate(['/home']);
    }
    // Pas de "else", le toastService.show('Error') est déclenché dans authService
  }
}
