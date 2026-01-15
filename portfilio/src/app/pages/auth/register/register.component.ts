import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Champs du formulaire
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  onSubmit() {
    // 1. Validation : Tous les champs obligatoires
    if (!this.validateForm()) {
      return;
    }

    // 2. Validation : Mots de passe identiques
    if (this.password !== this.confirmPassword) {
      this.toastService.show("Les mots de passe ne correspondent pas.", 'error');
      return;
    }

    // 3. Tentative d'inscription via le service
    const success = this.authService.register({
      id: 0, // Sera écrasé par le service
      email: this.email.trim(),
      password: this.password, // On envoie le password pour qu'il soit stocké dans le JSON users
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      promo: 'A1' // Par défaut
    });

    // 4. Redirection si succès (le Toast succès est géré par le service)
    if (success) {
      this.router.navigate(['/home']);
    }
  }

  // Vérifie que les champs ne sont pas vides ou juste des espaces
  private validateForm(): boolean {
    if (!this.firstName.trim() ||
      !this.lastName.trim() ||
      !this.email.trim() ||
      !this.password ||
      !this.confirmPassword) {

      this.toastService.show("Veuillez remplir tous les champs obligatoires.", 'error');
      return false;
    }
    return true;
  }
}
