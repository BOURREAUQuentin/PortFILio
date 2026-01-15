import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  // On stocke le message actuel (ou null si rien à afficher)
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  public toast$ = this.toastSubject.asObservable();

  private timeoutId: any;

  show(text: string, type: 'success' | 'error' | 'info' = 'success'): void {
    // Si un timer existe déjà, on le coupe pour reset
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // On émet le nouveau message
    this.toastSubject.next({ text, type });

    // On efface le message après 3 secondes (3000ms)
    this.timeoutId = setTimeout(() => {
      this.close();
    }, 3000);
  }

  close(): void {
    this.toastSubject.next(null);
  }
}
