import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { ArmStore } from '../../../../arm/application/arm.store';
import { IamApi, SellerResource } from '../../../../iam/infrastructure/iam-api';
import { Loan } from '../../../../sdp/domain/model/loan';
import { SdpApi } from '../../../../sdp/infrastructure/sdp-api';

interface SellerPerformance {
  id: string;
  name: string;
  credits: number;
  amount: number;
  share: number;
}

interface MonthlyMetric {
  key: string;
  label: string;
  amount: number;
  credits: number;
  heightPct: number;
}

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, TranslateModule],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.css',
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly sdpApi = inject(SdpApi);
  private readonly iamApi = inject(IamApi);
  private readonly armStore = inject(ArmStore);
  private readonly translate = inject(TranslateService);

  readonly loans = signal<Loan[]>([]);
  readonly sellers = signal<SellerResource[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

  readonly totalConfirmed = computed(() => this.loans().length);
  readonly totalFinanced = computed(() => this.loans().reduce((sum, loan) => sum + loan.loanAmount, 0));
  readonly totalVehicleAmount = computed(() => this.loans().reduce((sum, loan) => sum + loan.vehiclePrice, 0));
  readonly totalCreditCost = computed(() => this.loans().reduce((sum, loan) => sum + loan.ctc, 0));
  readonly totalVehicles = computed(() => this.loans().reduce((sum, loan) => sum + this.vehicleCount(loan), 0));
  readonly averageTcea = computed(() => this.average(this.loans().map(loan => loan.tcea)));
  readonly averageInstallment = computed(() => this.average(this.loans().map(loan => loan.fixedInstallment)));

  readonly sellerPerformance = computed<SellerPerformance[]>(() => {
    const grouped = new Map<string, SellerPerformance>();
    for (const loan of this.loans()) {
      const id = loan.sellerId || 'admin';
      const current = grouped.get(id) ?? {
        id,
        name: this.sellerLabel(loan),
        credits: 0,
        amount: 0,
        share: 0,
      };
      current.credits += 1;
      current.amount += loan.vehiclePrice;
      grouped.set(id, current);
    }

    const total = this.totalVehicleAmount();
    return Array.from(grouped.values())
      .map(item => ({ ...item, share: total > 0 ? item.amount / total : 0 }))
      .sort((a, b) => b.amount - a.amount);
  });

  readonly topSeller = computed(() => this.sellerPerformance()[0] ?? null);

  readonly monthlyTrend = computed<MonthlyMetric[]>(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        key,
        label: date.toLocaleDateString(this.locale(), { month: 'short' }).replace('.', ''),
        amount: 0,
        credits: 0,
        heightPct: 0,
      };
    });

    const byKey = new Map(months.map(month => [month.key, month]));
    for (const loan of this.loans()) {
      const date = new Date(loan.startDate);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const month = byKey.get(key);
      if (!month) continue;
      month.amount += loan.vehiclePrice;
      month.credits += 1;
    }

    const maxAmount = Math.max(...months.map(month => month.amount), 0);
    return months.map(month => ({
      ...month,
      heightPct: maxAmount > 0 ? Math.max(8, (month.amount / maxAmount) * 100) : 8,
    }));
  });

  readonly recentLoans = computed(() => [...this.loans()]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 6));

  ngOnInit(): void {
    this.armStore.loadClients();
    this.armStore.loadVehicles();
    this.armStore.loadVehicleSpecifications();
    this.refresh();
  }

  refresh(): void {
    this.isLoading.set(true);
    this.error.set('');

    forkJoin({ loans: this.sdpApi.getConfirmedLoans(), sellers: this.iamApi.listSellers() }).subscribe({
      next: response => {
        this.loans.set(response.loans);
        this.sellers.set(response.sellers);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('admin.dashboard.error'));
        this.isLoading.set(false);
      },
    });
  }

  sellerLabel(loan: Loan): string {
    if (loan.sellerName) return loan.sellerName;
    const seller = this.sellers().find(item =>
      item.id === loan.sellerId || item.code === loan.sellerId || item.username === loan.sellerId);
    return seller?.fullName ?? this.translate.instant('admin.reports.administrator');
  }

  clientLabel(loan: Loan): string {
    const client = this.armStore.clients().find(item => item.id === loan.clientId);
    return client?.name ?? loan.clientId;
  }

  vehicleLabel(loan: Loan): string {
    const ids = loan.vehicles?.length ? loan.vehicles.map(vehicle => vehicle.carId) : [loan.carId];
    return ids.map(id => {
      const spec = this.armStore.vehicleSpecifications().find(item => item.vehicleId === id);
      const vehicle = this.armStore.vehicles().find(item => item.id === id);
      return spec?.brand || spec?.model ? `${spec.brand ?? ''} ${spec.model ?? ''}`.trim() : (vehicle?.code ?? id);
    }).filter(Boolean).join(', ');
  }

  vehicleCount(loan: Loan): number {
    return loan.vehicles?.length || (loan.carId ? 1 : 0);
  }

  money(value: number, currency = 'PEN'): string {
    const symbol = currency === 'USD' ? '$' : 'S/';
    return `${symbol} ${value.toLocaleString(this.locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  pct(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  date(value: Date | string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString(this.locale());
  }

  private average(values: number[]): number {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  private locale(): string {
    return this.translate.currentLang === 'en' ? 'en-US' : 'es-PE';
  }
}
