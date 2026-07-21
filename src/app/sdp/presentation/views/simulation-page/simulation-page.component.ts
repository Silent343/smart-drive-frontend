import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SdpStore } from '../../../application/sdp.store';
import { DEFAULT_USD_TO_PEN_RATE, amountFromPen, moneySymbol } from '../../../application/currency-conversion';
import { FlowHeaderComponent } from '../../components/flow-header/flow-header.component';
import { MetricSummaryCardComponent, MetricItem } from '../../components/metric-summary-card/metric-summary-card.component';
import { FinancialIndicatorsCardComponent, IndicatorRow } from '../../components/financial-indicators-card/financial-indicators-card.component';
import { ArmStore } from '../../../../arm/application/arm.store';
import {
  AdvisorChatComponent
} from '../../../../advisor_context/presentation/components/advisor-chat/advisor-chat.component';

@Component({
  selector:    'app-simulation-page',
  standalone:  true,
  imports:     [CommonModule, FormsModule, TranslateModule,
    FlowHeaderComponent, MetricSummaryCardComponent, FinancialIndicatorsCardComponent, AdvisorChatComponent],
  templateUrl: './simulation-page.component.html',
  styleUrls:   ['./simulation-page.component.css'],
})
export class SimulationPageComponent implements OnInit {
  private readonly store  = inject(SdpStore);
  private readonly router = inject(Router);
  private readonly armStore = inject(ArmStore);
  protected readonly loanId = computed(() => this.currentLoan()?.id.toString() ?? '');
  readonly todayIso = this.toLocalIsoDate(new Date());

  // ── Inputs — se restauran si ya había un préstamo simulado ───
  private readonly existingLoan = this.store.currentLoan();

  initialFee   = this.existingLoan?.initialFee     ?? 0;
  installments = this.existingLoan?.installmentsQty ?? 36;
  startDate    = this.normalizeStartDate(this.existingLoan?.startDate);

  // ── Store signals ────────────────────────────────────────────
  readonly currentLoan   = this.store.currentLoan;
  readonly isLoading     = this.store.isLoading;
  readonly error         = this.store.error;
  readonly activeConfig  = this.store.activeCreditConfig;
  readonly clientName    = this.store.flowClientName;
  readonly carName       = this.store.flowCarName;

  get vehiclePrice(): number {
    if (this.existingLoan) return this.existingLoan.vehiclePrice;

    // Multi-vehicle: the financed base is the sum of all vehicles picked in the config.
    // Falls back to the single vehicle's price when the list is empty.
    const total = this.store.flowVehiclesTotal();
    let basePriceSoles = total;
    if (basePriceSoles === 0) {
      const carId = this.store.flowCarId();
      const commercialInfo = this.armStore.vehicleCommercials().find(c => c.vehicleId === carId);
      basePriceSoles = commercialInfo?.price ?? 0;
    }

    return amountFromPen(basePriceSoles, this.activeConfig()?.currency ?? 'PEN', DEFAULT_USD_TO_PEN_RATE);
  }

  get symbol(): string {
    return moneySymbol(this.activeConfig()?.currency);
  }

  get loanAmount(): number {
    return Math.max(0, this.vehiclePrice - this.initialFee);
  }

  fmt(n: number): string {
    return `${this.symbol} ${n.toLocaleString('es-PE', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    })}`;
  }

  // ── Cards ────────────────────────────────────────────────────
  get metrics(): MetricItem[] {
    const loan = this.currentLoan();

    return [
      { label: 'Cuota fija',   value: loan ? this.fmt(loan.fixedInstallment)          : '—' },
      { label: 'TCEA',         value: loan ? `${(loan.tcea * 100).toFixed(2)}%`        : '—', highlight: true },
      { label: 'VAN (deudor)', value: loan ? this.fmt(loan.npvDebtor)                 : '—' },
      { label: 'TIR mensual',  value: loan ? `${(loan.irrDebtor * 100).toFixed(4)}%`  : '—' },
    ];
  }

  get indicators(): IndicatorRow[] {
    const loan = this.currentLoan();
    return [
      { label: 'Capital financiado', value: loan ? this.fmt(loan.loanAmount)      : '—' },
      { label: 'Total intereses',    value: loan ? this.fmt(loan.totalInterest)   : '—' },
      { label: 'Total seguro',       value: loan ? this.fmt(loan.totalInsurance)  : '—' },
      { label: 'Seguro todo riesgo',  value: loan ? this.fmt(loan.totalRiskInsurance) : '—' },
      { label: 'GPS total',           value: loan ? this.fmt(loan.totalGps) : '—' },
      { label: 'Portes totales',     value: loan ? this.fmt(loan.totalPostage)    : '—' },
      { label: 'Comisiones',         value: loan ? this.fmt(loan.totalCommission) : '—' },
      { label: 'IGV/ITF',             value: loan ? this.fmt(loan.totalTax) : '—' },
      { label: 'Costos iniciales',    value: loan ? this.fmt(loan.initialCosts) : '—' },
      { label: 'CTC total',          value: loan ? this.fmt(loan.ctc)             : '—', highlight: true },
    ];
  }

  ngOnInit(): void {
    if (!this.activeConfig()) {
      this.store.loadCreditConfigs();
    }
  }

  onStartDateChange(value: string): void {
    this.startDate = value && value >= this.todayIso ? value : this.todayIso;
  }

  /**
   * Se dispara en cada cambio de input.
   * Calcula localmente y persiste en loans.
   */
  onSimulate(): void {
    if (!this.activeConfig() || this.loanAmount <= 0) return;
    this.store.simulateAndSave(
      this.vehiclePrice,
      this.initialFee,
      this.installments,
      new Date(this.startDate),
    );
  }

  onContinue(): void {
    if (!this.currentLoan()) return;
    this.router.navigate(['/schedule']);
  }

  onHistory(): void {
    this.router.navigate(['/simulations']);
  }

  onBack(): void {
    this.router.navigate(['/configuration']);
  }

  private normalizeStartDate(date?: Date): string {
    const iso = date ? this.toLocalIsoDate(new Date(date)) : this.todayIso;
    return iso >= this.todayIso ? iso : this.todayIso;
  }

  private toLocalIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
