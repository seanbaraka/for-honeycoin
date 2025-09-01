import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDownIcon } from 'lucide-angular';

@Component({
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  selector: 'shadcn-dropdown',
  template: `
    <div class="relative" #dropdownContainer>
      <button
        (click)="toggle()"
        class="w-full flex justify-between rounded-xl border border-gray-300 px-3 py-2 text-left hover:bg-neutral-100 hover:cursor-pointer focus:ring-2 focus:ring-emerald-400"
      >
        @if (flag) {
        <span class="flex gap-2 items-center">
          <img [src]="selected?.flag" class="w-4 h-4" />
          {{ selected?.code || placeholder }}
        </span>

        } @else {
        {{ selected?.code || placeholder }}
        }
        <i-lucide [img]="ChevronDownIcon" class=""></i-lucide>
      </button>
      <ul
        *ngIf="isOpen"
        role="listbox"
        tabindex="-1"
        class="absolute bg-white z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl shadow-lg ring-1 ring-gray-300 ring-opacity-20"
      >
        <li
          *ngFor="let option of options; trackBy: trackByCode"
          role="option"
          (click)="select(option); $event.preventDefault(); $event.stopPropagation()"
          (keydown.enter)="select(option)"
          tabindex="0"
          class="cursor-pointer text-sm px-3 py-2 hover:bg-gray-100"
        >
          @if (flag) {
          <span class="flex gap-2 items-center">
            <img [src]="option.flag" class="w-4 h-4" />
            {{ option.code }} — {{ option.label }}
          </span>
          } @else {
          {{ option.code }} — {{ option.label }}
          }
        </li>
      </ul>
    </div>
  `,
})
export class ShadcnDropdownComponent<T extends { code: string; label: string; flag?: string }> {
  @Input() options!: T[];
  @Input() placeholder = 'Select';
  @Input() selected?: T;
  @Input() flag = false;
  @Output() selectedChange = new EventEmitter<T>();
  @ViewChild('dropdownContainer', { static: true }) dropdownContainer!: ElementRef;
  readonly ChevronDownIcon = ChevronDownIcon;
  isOpen = false;

  constructor(private cdr: ChangeDetectorRef) {}

  toggle() {
    this.isOpen = !this.isOpen;
  }
  select(option: T) {
    this.selected = option;
    this.isOpen = false;
    // Force change detection to ensure the dropdown closes visually
    this.cdr.detectChanges();
    // Use setTimeout to ensure the event is processed after the DOM update
    setTimeout(() => {
      this.selectedChange.emit(option);
    }, 0);
  }
  trackByCode(index: number, item: T) {
    return item.code;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isOpen && !this.dropdownContainer.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    this.isOpen = false;
  }
}
