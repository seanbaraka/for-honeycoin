import { Component, signal } from '@angular/core';
import { LucideAngularModule, FileIcon, ChevronDownIcon, HandHeartIcon } from 'lucide-angular';
import { CurrencyConverterComponent } from './currency-converter/currency-converter';

@Component({
  selector: 'app-root',
  imports: [LucideAngularModule, CurrencyConverterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('for-honeycoin');
  readonly FileIcon = FileIcon;
  readonly ChevronDownIcon = ChevronDownIcon;
  readonly HandHeartIcon = HandHeartIcon;
}
