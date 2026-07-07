import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ArmStore } from '../../../../arm/application/arm.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { IamApi, SellerResource } from '../../../../iam/infrastructure/iam-api';
import { Loan } from '../../../../sdp/domain/model/loan';
import { SdpApi } from '../../../../sdp/infrastructure/sdp-api';

@Component({
  selector: 'app-company-reports-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './company-reports-page.component.html',
  styleUrl: './company-reports-page.component.css',
})
export class CompanyReportsPageComponent implements OnInit {
  private readonly sdpApi = inject(SdpApi);
  private readonly iamApi = inject(IamApi);
  private readonly armStore = inject(ArmStore);
  private readonly iamStore = inject(IamStore);
  private readonly translate = inject(TranslateService);

  readonly displayDomain = this.iamStore.displayDomain;

  readonly loans = signal<Loan[]>([]);
  readonly sellers = signal<SellerResource[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

  readonly searchTerm = signal('');
  readonly sellerFilter = signal('');

  readonly filteredLoans = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const sellerId = this.sellerFilter();

    return this.loans().filter(loan => {
      if (sellerId) {
        const seller = this.sellers().find(s => s.id === sellerId);
        const matches = !!seller && (
          loan.sellerName === seller.fullName
          || loan.sellerId === seller.id
          || loan.sellerId === seller.code
          || loan.sellerId === seller.username);
        if (!matches) return false;
      }
      if (!term) return true;
      const haystack = [
        this.sellerLabel(loan),
        this.clientLabel(loan),
        this.vehicleLabel(loan),
        String(loan.id ?? ''),
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  });

  readonly totalConfirmed = computed(() => this.loans().length);
  readonly totalAmount = computed(() => this.loans().reduce((sum, loan) => sum + loan.vehiclePrice, 0));
  readonly totalCreditCost = computed(() => this.loans().reduce((sum, loan) => sum + loan.ctc, 0));
  readonly averageTcea = computed(() => {
    const loans = this.loans();
    if (loans.length === 0) return '—';
    const avg = loans.reduce((sum, loan) => sum + loan.tcea, 0) / loans.length;
    return this.pct(avg);
  });

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onSellerFilter(event: Event): void {
    this.sellerFilter.set((event.target as HTMLSelectElement).value);
  }

  ngOnInit(): void {
    this.armStore.loadClients();
    this.armStore.loadVehicles();
    this.armStore.loadVehicleSpecifications();
    this.refresh();
  }

  refresh(): void {
    this.isLoading.set(true);
    this.error.set('');

    this.sdpApi.getConfirmedLoans().subscribe({
      next: loans => {
        this.loans.set(loans);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('admin.reports.error'));
        this.isLoading.set(false);
      },
    });

    this.iamApi.listSellers().subscribe({
      next: sellers => this.sellers.set(sellers),
      error: () => this.sellers.set([]),
    });
  }

  sellerLabel(loan: Loan): string {
    // The backend now resolves the seller's display name for confirmed loans.
    if (loan.sellerName) return loan.sellerName;
    const seller = this.sellers().find(s => s.id === loan.sellerId || s.code === loan.sellerId || s.username === loan.sellerId);
    return seller ? seller.fullName : (loan.sellerId ? this.translate.instant('admin.reports.administrator') : this.translate.instant('admin.reports.administrator'));
  }

  clientLabel(loan: Loan): string {
    const client = this.armStore.clients().find(c => c.id === loan.clientId);
    return client ? `${client.name} (${client.dni})` : loan.clientId;
  }

  vehicleLabel(loan: Loan): string {
    return this.vehicleIdsFromLoan(loan)
      .map(vehicleId => this.vehicleLabelById(vehicleId))
      .join(', ');
  }

  private vehicleIdsFromLoan(loan: Loan): string[] {
    if (loan.vehicles?.length) {
      return loan.vehicles.map(vehicle => vehicle.carId).filter(Boolean);
    }
    return loan.carId ? [loan.carId] : [];
  }

  private vehicleLabelById(vehicleId: string): string {
    const vehicle = this.armStore.vehicles().find(v => v.id === vehicleId);
    const spec = this.armStore.vehicleSpecifications().find(s => s.vehicleId === vehicleId);
    if (spec?.brand || spec?.model) return `${spec.brand ?? ''} ${spec.model ?? ''}`.trim();
    return vehicle?.code ?? vehicleId;
  }

  money(value: number, currency = 'PEN'): string {
    const symbol = currency === 'USD' ? '$' : 'S/';
    return `${symbol} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  pct(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }
}
