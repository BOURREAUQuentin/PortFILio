import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ToastComponent} from './shared/components/toast/toast.component';
import {ScrollToTopComponent} from './shared/components/scroll-to-top/scroll-to-top.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, ScrollToTopComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('portfilio');
}
