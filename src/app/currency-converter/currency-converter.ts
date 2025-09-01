import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ShadcnDropdownComponent } from '../select-dropdown';
import { LucideAngularModule, ArrowLeftRight, InfoIcon } from 'lucide-angular';

type FxResponse = {
  data: {
    conversionRate: number;
    convertedAmount: number;
  };
  success: boolean;
};

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', flag: '/us.svg' },
  { code: 'KES', label: 'Kenyan Shilling', flag: '/ke.svg' },
  { code: 'UGX', label: 'Uganda Shilling', flag: '/ug.svg' },
  { code: 'RWF', label: 'Rwanda Franc', flag: '/rw.svg' },
  { code: 'XOF', label: 'West African CFA Franc', flag: '/sn.svg' },
  { code: 'XAF', label: 'Central African CFA Franc', flag: '/cf.svg' },
  { code: 'TZS', label: 'Tanzanian Shilling', flag: '/tz.svg' },
  { code: 'NGN', label: 'Nigerian Naira', flag: '/ng.svg' },
  { code: 'GHS', label: 'Ghanaian Cedi', flag: '/gh.svg' },
];

const FROM_CURRENCY = [{ code: 'USD', label: 'US Dollar' }];

@Component({
  standalone: true,
  selector: 'app-currency-converter',
  imports: [CommonModule, ShadcnDropdownComponent, LucideAngularModule],
  template: `
    <div class="rounded-3xl border border-gray-300 backdrop-blur p-6 md:p-8 shadow-lg">
      <h2 class="text-4xl font-semibold mb-4">Currency Converter</h2>

      <div class="flex flex-col md:flex-row md:items-start gap-6">
        <!-- form -->
        <form class="flex-1 space-y-4" (submit)="$event.preventDefault()">
          <div class="flex items-end justify-between gap-3">
            <label class="block w-full">
              <span class="text-sm text-neutral-400">From</span>
              <div class="mt-1">
                <shadcn-dropdown
                  [flag]="true"
                  [options]="currencies"
                  [selected]="getSelectedFrom()"
                  (selectedChange)="onFromSelected($event)"
                  placeholder="From"
                >
                </shadcn-dropdown>
              </div>
            </label>

            <button
              type="button"
              class="rounded-xl border cursor-pointer border-gray-100 px-3 py-2 font-medium text-neutral-950 active:scale-[.99]"
              (click)="swap()"
              aria-label="Swap currencies"
            >
              <i-lucide [img]="ArrowLeftRight" size="18"></i-lucide>
            </button>

            <label class="w-full">
              <span class="text-sm text-neutral-400">To</span>
              <div class="mt-1">
                <shadcn-dropdown
                  [flag]="true"
                  [options]="currencies"
                  [selected]="getSelectedTo()"
                  (selectedChange)="onToSelected($event)"
                  placeholder="To"
                >
                </shadcn-dropdown>
              </div>
            </label>
          </div>
          <div class="text-mono text-xs text-gray-800 font-bold">
            <span>Fx Rate:</span>
            <span
              >@if (!loading() && !error()) { 1 {{ from() }} ≈ {{ rate() | number : '1.2-6' }}
              {{ to() }} } @else { — }
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="block">
              <span class="text-sm text-neutral-400">Amount</span>
              <div class="mt-1 relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputmode="decimal"
                  class="w-full rounded-xl bg-gray-100 border border-gray-300 px-3 py-2 pr-16 outline-none focus:ring-2 focus:ring-emerald-400"
                  [value]="amount()"
                  (input)="onAmountChange($event)"
                />
                <button
                  type="button"
                  class="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-600"
                  (click)="setAmount('100')"
                >
                  +100
                </button>
              </div>
            </label>

            <div class="block">
              <span class="text-sm text-neutral-400">You’ll get (indicative)</span>
              <div class="mt-1">
                <output class="w-full rounded-xl text-3xl py-1 font-mono tabular-nums block">
                  @if (loading()) { <span aria-busy="true">…</span> } @else if (error()) {
                  <span class="text-red-400">{{ error() }}</span> } @else {
                  {{ convertedAmount() | number : '1.2-6' }} }
                </output>
              </div>
            </div>
          </div>
        </form>

        <!-- meta -->
        <!-- <aside class="md:w-72 shrink-0 space-y-3">
          <div class="rounded-2xl bg-neutral-800/70 p-4">
            <div class="text-sm text-neutral-400">Rate</div>
            <div class="mt-1 font-mono text-lg">
              @if (!loading() && !error()) { 1 {{ from() }} ≈ {{ rate() | number : '1.2-6' }}
              {{ to() }} } @else { — }
            </div>
            <div class="mt-2 text-xs text-neutral-400">
              Updated {{ lastUpdated() ? (lastUpdated()! | date : 'mediumTime') : '—' }}
            </div>
          </div>
        </aside> -->
      </div>
      <div class="flex gap-1 items-center mt-8">
        <i-lucide [img]="InfoIcon" size="16"></i-lucide>
        <span class="text-xs text-neutral-400">
          We use the mid-market rate for our Converter. This is for informational purposes only. You
          won’t receive this rate when sending money
        </span>
      </div>
    </div>
  `,
})
export class CurrencyConverterComponent {
  private http = inject(HttpClient);
  readonly ArrowLeftRight = ArrowLeftRight;
  readonly InfoIcon = InfoIcon;
  currencies = CURRENCIES;
  fromCurrencies = FROM_CURRENCY;
  from = signal<string>('USD');
  to = signal<string>('KES');
  amount = signal<string>('1');

  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  rate = signal<number>(0);
  lastUpdated = signal<Date | null>(null);

  requestUrl = computed(() => {
    const u = new URL('https://api-v2.honeycoin.app/api/b2b/utilities/rates');
    u.searchParams.set('from', this.from());
    u.searchParams.set('to', this.to());
    u.searchParams.set('amount', '1'); // Always use 1 for rate calculation
    return u.toString();
  });

  // Computed property for converted amount using stored rate
  convertedAmount = computed(() => {
    const amount = Number(this.amount()) || 0;
    const currentRate = this.rate();
    return amount * currentRate;
  });

  private debounceHandle: any;

  constructor() {
    // Effect that only triggers when currency pair changes (not amount)
    effect(() => {
      // Only watch from and to signals, not amount
      const fromCurrency = this.from();
      const toCurrency = this.to();

      this.loading.set(true);
      this.error.set(null);
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => {
        this.http.get<FxResponse>(this.requestUrl(), { withCredentials: false }).subscribe({
          next: (res) => {
            const r = res.data.conversionRate ?? 0;
            this.rate.set(r || 0);
            // Don't set converted amount here - it will be computed
            this.lastUpdated.set(new Date());
            this.loading.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.error.set(err.status ? `Error ${err.status}: ${err.statusText}` : 'Network error');
            this.loading.set(false);
          },
        });
      }, 180);
    });
  }

  setFrom(v: string) {
    if (v === this.to()) this.to.set(this.from());
    this.from.set(v);
  }
  setTo(v: string) {
    if (v === this.from()) this.from.set(this.to());
    this.to.set(v);
  }
  onAmount(v: string) {
    this.amount.set(v);
  }

  onFromChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.setFrom(target.value);
  }

  onToChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.setTo(target.value);
  }

  onAmountChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.onAmount(target.value);
  }
  setAmount(v: string) {
    const currentAmount = Number(this.amount()) || 0;
    const newValue = Number(v) || 0;
    const total = currentAmount + newValue;
    this.amount.set(total.toString());
  }

  getSelectedFrom() {
    return this.currencies.find((c) => c.code === this.from());
  }

  getSelectedTo() {
    return this.currencies.find((c) => c.code === this.to());
  }

  onFromSelected(currency: any) {
    if (currency && currency.code) {
      this.setFrom(currency.code);
    }
  }

  onToSelected(currency: any) {
    if (currency && currency.code) {
      this.setTo(currency.code);
    }
  }
  swap() {
    const f = this.from();
    this.from.set(this.to());
    this.to.set(f);
  }
}
