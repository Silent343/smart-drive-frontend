import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <-- Importamos HttpClient
import { TranslateModule } from '@ngx-translate/core';

import { SdpStore } from '../../../application/sdp.store';
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
  private readonly http = inject(HttpClient);
  protected readonly loanId = computed(() => this.currentLoan()?.id.toString() ?? '');

  // Creamos un signal para guardar el tipo de cambio dinámico (por defecto 1 para Soles)
  exchangeRate = signal<number>(1);

  // ── Inputs — se restauran si ya había un préstamo simulado ───
  private readonly existingLoan = this.store.currentLoan();

  initialFee   = this.existingLoan?.initialFee     ?? 0;
  installments = this.existingLoan?.installmentsQty ?? 36;
  startDate    = this.existingLoan
    ? new Date(this.existingLoan.startDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  // ── Store signals ────────────────────────────────────────────
  readonly currentLoan   = this.store.currentLoan;
  readonly isLoading     = this.store.isLoading;
  readonly error         = this.store.error;
  readonly activeConfig  = this.store.activeCreditConfig;
  readonly clientName    = this.store.flowClientName;
  readonly carName       = this.store.flowCarName;

  get vehiclePrice(): number {
    if (this.existingLoan) return this.existingLoan.vehiclePrice;

    const carId = this.store.flowCarId();
    const commercialInfo = this.armStore.vehicleCommercials().find(c => c.vehicleId === carId);

    const basePriceSoles = commercialInfo?.price ?? 0;

    // Si la moneda es USD, dividimos el precio base en soles entre el tipo de cambio actual
    if (this.activeConfig()?.currency === 'USD') {
      return basePriceSoles / this.exchangeRate();
    }

    return basePriceSoles;
  }

  get symbol(): string {
    return this.activeConfig()?.currency === 'USD' ? '$' : 'S/';
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
      { label: 'Portes totales',     value: loan ? this.fmt(loan.totalPostage)    : '—' },
      { label: 'Comisiones',         value: loan ? this.fmt(loan.totalCommission) : '—' },
      { label: 'CTC total',          value: loan ? this.fmt(loan.ctc)             : '—', highlight: true },
    ];
  }

  ngOnInit(): void {
    if (!this.activeConfig()) {
      this.store.loadCreditConfigs();
    }

    // Obtenemos el tipo de cambio al iniciar si la moneda elegida fue USD
    if (this.activeConfig()?.currency === 'USD' && !this.existingLoan) {
      this.http.get<any>('https://api.exchangerate-api.com/v4/latest/USD').subscribe({
        next: (data) => {
          if (data && data.rates && data.rates.PEN) {
            this.exchangeRate.set(data.rates.PEN); // Ej. S/ 3.75 por dólar
          }
        },
        error: (err) => {
          console.error('No se pudo obtener el tipo de cambio en tiempo real. Se usará un valor de respaldo.', err);
          this.exchangeRate.set(3.75); // Respaldo por si el usuario no tiene internet o falla la API
        }
      });
    }
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

  onBack(): void {
    this.router.navigate(['/configuration']);
  }
}
