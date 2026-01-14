import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  userData = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };
  errorMessage: string | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);

  register(form: NgForm) {
    if (form.invalid) return;
    this.errorMessage = null;

    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas.";
      return;
    }

    this.authService.register(this.userData).subscribe({
      next: () => {
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        // Afficher l'erreur renvoyée par le service (ex: "Cet email est déjà utilisé.")
        this.errorMessage = err.message;
      }
    });
  }
}
