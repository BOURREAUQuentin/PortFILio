import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // <--- TRES IMPORTANT
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // <--- Version moderne

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideZoneChangeDetection({ eventCoalescing: true }),

    // Le système de routing
    provideRouter(routes),

    // Permet d'utiliser this.http.get() dans tes services (SINON ECRAN BLANC)
    provideHttpClient(),

    // Active les animations pour le Drag & Drop (Version asynchrone recommandée)
    provideAnimationsAsync(),

    provideClientHydration(withEventReplay())
  ]
};
