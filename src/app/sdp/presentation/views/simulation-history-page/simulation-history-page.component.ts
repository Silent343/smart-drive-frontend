import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SdpStore } from '../../../application/sdp.store';
import { SimulationSnapshot, SimulationStatus } from '../../../domain/model/simulation-snapshot';

@Component({
  selector: 'app-simulation-history-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './simulation-history-page.component.html',
  styleUrl: './simulation-history-page.component.css',
})
export class SimulationHistoryPageComponent {
  private readonly store = inject(SdpStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly simulations = this.store.simulationHistory;
  readonly selectedIds = signal<string[]>([]);

  readonly totalSimulations = computed(() => this.simulations().length);
  readonly draftSimulations = computed(() => this.countByStatus('DRAFT'));
  readonly reviewedSimulations = computed(() => this.countByStatus('REVIEWED'));
  readonly confirmedSimulations = computed(() => this.countByStatus('CONFIRMED'));
  readonly selectedSimulations = computed(() => {
    const ids = this.selectedIds();
    return this.simulations().filter(item => ids.includes(item.id));
  });

  formatMoney(snapshot: SimulationSnapshot, amount: number): string {
    const symbol = snapshot.config.currency === 'USD' ? '$' : 'S/';
    return `${symbol} ${Number(amount || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatPercent(value: number, decimals = 2): string {
    return `${(Number(value || 0) * 100).toFixed(decimals)}%`;
  }

  vehicleText(snapshot: SimulationSnapshot): string {
    if (snapshot.vehicles.length) {
      return snapshot.vehicles.map(vehicle => vehicle.label).join(', ');
    }

    return snapshot.carName || snapshot.loan.carId || this.translate.instant('sdp.history.emptyValue');
  }

  statusLabel(status: SimulationStatus): string {
    return this.translate.instant(`sdp.history.status.${status.toLowerCase()}`);
  }

  statusClass(status: SimulationStatus): string {
    return `history-status history-status--${status.toLowerCase()}`;
  }

  isSelected(snapshot: SimulationSnapshot): boolean {
    return this.selectedIds().includes(snapshot.id);
  }

  isComparisonDisabled(snapshot: SimulationSnapshot): boolean {
    return !this.isSelected(snapshot) && this.selectedIds().length >= 3;
  }

  toggleComparison(snapshot: SimulationSnapshot, checked: boolean): void {
    if (checked) {
      if (this.selectedIds().length >= 3 || this.isSelected(snapshot)) return;
      this.selectedIds.update(ids => [...ids, snapshot.id]);
      return;
    }

    this.selectedIds.update(ids => ids.filter(id => id !== snapshot.id));
  }

  openSimulation(snapshot: SimulationSnapshot, target: 'simulation' | 'schedule' | 'report'): void {
    this.store.loadSimulation(snapshot);
    if (target === 'report') {
      this.store.loadReportByLoan(snapshot.loan.id || snapshot.id);
    }
    this.router.navigate([`/${target}`]);
  }

  markReviewed(snapshot: SimulationSnapshot): void {
    this.store.markSimulationStatus(snapshot.id, 'REVIEWED');
  }

  removeSimulation(snapshot: SimulationSnapshot): void {
    this.store.removeSimulation(snapshot.id);
    this.selectedIds.update(ids => ids.filter(id => id !== snapshot.id));
  }

  createNewSimulation(): void {
    this.store.clearAll();
    this.router.navigate(['/configuration']);
  }

  trackBySimulationId(_: number, item: SimulationSnapshot): string {
    return item.id;
  }

  private countByStatus(status: SimulationStatus): number {
    return this.simulations().filter(item => item.status === status).length;
  }
}
