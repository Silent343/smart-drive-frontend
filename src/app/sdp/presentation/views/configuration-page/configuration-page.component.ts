import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SdpStore } from '../../../application/sdp.store';
import { CreditConfig, Capitalization, GracePeriodType, InterestRateType, Currency } from '../../../domain/model/credit-config';
import { FlowHeaderComponent } from '../../components/flow-header/flow-header.component';
import { GracePeriodInfoComponent } from '../../components/grace-period-info/grace-period-info.component';
import { ArmStore } from '../../../../arm/application/arm.store';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector:    'app-configuration-page',
  standalone:  true,
  imports:     [CommonModule, FormsModule, TranslateModule, FlowHeaderComponent, GracePeriodInfoComponent],
  templateUrl: './configuration-page.component.html',
  styleUrls:   ['./configuration-page.component.css'],
})
export class ConfigurationPageComponent implements OnInit {
  private readonly store    = inject(SdpStore);
  private readonly armStore = inject(ArmStore);
  private readonly iamStore = inject(IamStore);
  private readonly router   = inject(Router);

  // ── Cliente / vehículo ───────────────────────────────────────
  dni         = '';
  codigoAuto  = '';
  clientId    = this.store.flowClientId();
  clientName  = this.store.flowClientName();
  vehicleId   = this.store.flowCarId();
  vehicleName = this.store.flowCarName();
  dniError    = '';
  carError    = '';
  showVehicleList = false;

  // ── Restaurar config previa del store ────────────────────────
  private readonly savedConfig = this.store.activeCreditConfig();

  currency:         Currency         = this.savedConfig?.currency         ?? 'PEN';
  interestRateType: InterestRateType = this.savedConfig?.interestRateType ?? 'efectiva';
  annualRate                         = this.savedConfig?.annualRate        ?? 9.5;
  capitalization:   Capitalization   = this.savedConfig?.capitalization    ?? 12;
  gracePeriodMonths                  = this.savedConfig?.gracePeriodMonths ?? 0;
  gracePeriodType:  GracePeriodType  = this.savedConfig?.gracePeriodType  ?? 'none';
  insuranceRatePct                   = this.savedConfig?.insuranceRatePct     ?? 0.05;
  postageFeeAmount                   = this.savedConfig?.postageFeeAmount      ?? 3.50;
  administrationFeePct               = this.savedConfig?.administrationFeePct ?? 0;
  igvPct                             = 0;

  // ── Derivados ────────────────────────────────────────────────
  get isNominal():          boolean { return this.interestRateType === 'nominal'; }
  get effectiveRateLabel(): string  { return this.isNominal ? 'TNA' : 'TEA'; }
  get equivalentTEA(): string {
    if (!this.isNominal) return `${this.annualRate.toFixed(4)}%`;
    const m   = this.capitalization;
    const tea = (Math.pow(1 + this.annualRate / 100 / m, m) - 1) * 100;
    return `${tea.toFixed(4)}%`;
  }

  get currencyOptions()       { return [{ value: 'PEN', label: 'Soles (PEN)' }, { value: 'USD', label: 'Dólares (USD)' }]; }
  get capitalizationOptions() { return [{ value: 12, label: 'Mensual (m=12)' }, { value: 4, label: 'Trimestral (m=4)' }, { value: 2, label: 'Semestral (m=2)' }, { value: 365, label: 'Diaria (m=365)' }]; }
  get gracePeriodOptions()    { return [{ value: 'none', label: 'Ninguno' }, { value: 'partial', label: 'Parcial (sólo interés)' }, { value: 'total', label: 'Total (capital + interés)' }]; }

  ngOnInit(): void {
    this.store.loadCreditConfigs();
    this.armStore.loadClients();
    this.armStore.loadVehicles();

    // Es vital cargar las particiones para poder leer brand y model al buscar
    this.armStore.loadVehicleSpecifications();
    this.armStore.loadVehicleCommercials();
  }

  // ── Búsqueda por DNI ─────────────────────────────────────────
  onDniChange(): void {
    this.dniError   = '';
    this.clientName = '';
    this.clientId   = '';

    // Esperar a que el DNI tenga 8 dígitos
    if (this.dni.length < 8) return;

    const clients = this.armStore.clients();

    // Verificar que ya cargaron; si no, recargar y reintentar
    if (clients.length === 0) {
      this.armStore.loadClients();
      return;
    }

    const found = clients.find(c => c.dni === this.dni);
    if (found) {
      this.clientId   = found.id;
      this.clientName = found.name;
      this.store.setFlowClient(found.id, found.name);
    } else {
      this.dniError = 'Cliente no encontrado';
    }
  }

  // -- Autocomplete de vehiculo (codigo + imagen) --------------
  /**
   * Merges each vehicle with its specification for display, keeping ONLY the
   * vehicles published by the currently signed-in administrator (matched through
   * the commercial partition's userId), just like the dashboard does.
   */
  get vehicleOptions() {
    const specs = this.armStore.vehicleSpecifications();
    const commercials = this.armStore.vehicleCommercials();
    const userId = this.iamStore.currentUserId() || '';

    return this.armStore.vehicles()
      .filter(v => commercials.find(c => c.vehicleId === v.id)?.userId === userId)
      .map(v => {
        const spec = specs.find(s => s.vehicleId === v.id);
        const brand = spec?.brand ?? '';
        const model = spec?.model ?? '';
        return {
          id: v.id,
          code: v.code,
          imageUrl: v.imageUrl,
          brand,
          model,
          label: brand && model ? `${brand} ${model}` : v.code,
        };
      });
  }

  /** Vehicles filtered live by what the user types (code, brand or model). */
  get filteredVehicles() {
    const q = this.codigoAuto.trim().toLowerCase();
    const all = this.vehicleOptions;
    if (!q) return all.slice(0, 8);
    return all
      .filter(v =>
        v.code.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }

  get showCarNotFound(): boolean {
    return !!this.codigoAuto.trim() && !this.vehicleId && this.filteredVehicles.length === 0;
  }

  openVehicleList(): void {
    if (this.armStore.vehicles().length === 0) {
      this.armStore.loadVehicles();
      this.armStore.loadVehicleSpecifications();
    }
    this.showVehicleList = true;
  }

  closeVehicleList(): void {
    this.showVehicleList = false;
  }

  /** Fires while typing: keeps the list open and clears any previous selection. */
  onVehicleInput(): void {
    this.carError = '';
    this.vehicleId = '';
    this.vehicleName = '';
    this.showVehicleList = true;
  }

  selectVehicle(option: { id: string; code: string; label: string }): void {
    this.vehicleId = option.id;
    this.vehicleName = option.label;
    this.codigoAuto = option.code;
    this.carError = '';
    this.showVehicleList = false;
    this.store.setFlowCar(option.id, option.label);
  }

  get canContinue(): boolean {
    return !!this.clientId && !!this.vehicleId;
  }

  onContinue(): void {
    if (!this.canContinue) return;

    const config = new CreditConfig({
      id:                   this.savedConfig?.id ?? '',
      currency:             this.currency,
      interestRateType:     this.interestRateType,
      annualRate:           this.annualRate,
      capitalization:       this.isNominal ? this.capitalization : undefined,
      gracePeriodType:      this.gracePeriodType,
      gracePeriodMonths:    this.gracePeriodMonths,
      insuranceRatePct:     this.insuranceRatePct,
      postageFeeAmount:     this.postageFeeAmount,
      administrationFeePct: this.administrationFeePct,
    });

    const operation$ = this.savedConfig?.id
      ? this.store.updateCreditConfig(config)
      : this.store.createCreditConfig(config);

    operation$.subscribe({
      next: () => this.router.navigate(['/simulation']),
      error: (err) => console.error('Error guardando config:', err),
    });
  }

  onNewRecord(): void {
    this.store.clearAll();

    this.dni = '';
    this.codigoAuto = '';
    this.clientId = '';
    this.clientName = '';
    this.vehicleId = '';
    this.vehicleName = '';
    this.dniError = '';
    this.carError = '';
    this.showVehicleList = false;

    this.currency = 'PEN';
    this.interestRateType = 'efectiva';
    this.annualRate = 9.5;
    this.capitalization = 12;
    this.gracePeriodMonths = 0;
    this.gracePeriodType = 'none';
    this.insuranceRatePct = 0.05;
    this.postageFeeAmount = 3.50;
    this.administrationFeePct = 0;
    this.igvPct = 0;
  }
}
