import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  errorMessage: string | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);

  login(form: NgForm) {
    if (form.invalid) return;
    this.errorMessage = null;

    this.authService.login(this.credentials.email, this.credentials.password).subscribe({
      next: () => {
        // Redirection vers la page des projets après connexion réussie
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }
}
