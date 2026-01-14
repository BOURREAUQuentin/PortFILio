import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes'; // Importer les routes
import { provideHttpClient } from '@angular/common/http'; // Importer le provider HttpClient

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Fournir les routes à l'application
    provideHttpClient() // Fournir HttpClient pour les appels API
  ]
}).catch((err) => console.error(err));
