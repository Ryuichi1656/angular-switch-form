import { Component } from '@angular/core';
import { SwitchFormComponent } from './switch-form/switch-form.component';

@Component({
  selector: 'app-root',
  imports: [SwitchFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'angular-switch-form';
}
