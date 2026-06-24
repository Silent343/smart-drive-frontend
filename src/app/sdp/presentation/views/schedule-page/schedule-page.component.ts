import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SdpStore } from '../../../application/sdp.store';
import { NotificationStore } from '../../../../shared/application/notification.store';
import { FlowHeaderComponent } from '../../components/flow-header/flow-header.component';
import { ScheduleTableComponent } from '../../components/schedule-table/schedule-table.component';

@Component({
  selector:    'app-schedule-page',
  standalone:  true,
  imports:     [CommonModule, TranslateModule, FlowHeaderComponent, ScheduleTableComponent],
  templateUrl: './schedule-page.component.html',
  styleUrls:   ['./schedule-page.component.css'],
})
export class SchedulePageComponent implements OnInit {
  private readonly store  = inject(SdpStore);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationStore);

  // Signals directos del store — persisten entre navegaciones
  readonly schedule     = this.store.currentSchedule;
  readonly currentLoan  = this.store.currentLoan;
  readonly activeConfig = this.store.activeCreditConfig;
  readonly isLoading    = this.store.isLoading;

  get currency(): string {
    return this.activeConfig()?.currency ?? 'PEN';
  }

  get metaText(): string {
    const loan = this.currentLoan();
    const cfg  = this.activeConfig();
    if (!loan || !cfg) return '—';
    return `${loan.installmentsQty} cuotas · Método francés vencido · TEA ${cfg.effectiveAnnualRate.toFixed(2)}%`;
  }

  ngOnInit(): void {
    // Si el cronograma no está en memoria (ej. recarga de página con id guardado)
    const loan = this.currentLoan();
    if (loan?.id && this.schedule().length === 0) {
      this.store.loadScheduleByLoan(loan.id);
    }
  }

  onContinue(): void {
    const loan = this.currentLoan();
    if (!loan) return;
    this.notifyScheduleConfirmed(loan);
    this.store.loadReportByLoan(loan.id);
    this.router.navigate(['/report']);
  }

  /** Raises a toast + history entry summarising the just-confirmed schedule. */
  private notifyScheduleConfirmed(loan: any): void {
    const cfg = this.activeConfig();
    const now = new Date();
    const fecha = now.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const cliente = this.store.flowClientName() || 'Cliente';
    const vehiculo = this.store.flowCarName() || 'Vehículo';
    const symbol = this.currency === 'USD' ? '$' : 'S/';
    const cuota = `${symbol} ${Number(loan.fixedInstallment || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    const tcea = `${(Number(loan.tcea || 0) * 100).toFixed(2)}%`;

    this.notifications.notify({
      title: 'Cronograma confirmado',
      message:
        `Cliente: ${cliente}\n` +
        `Vehículo: ${vehiculo}\n` +
        `${loan.installmentsQty} cuotas · Cuota fija ${cuota} · TCEA ${tcea}\n` +
        `${fecha} · ${hora}`,
      icon: 'event_available',
      type: 'success',
    });
  }

  onBack(): void {
    this.router.navigate(['/simulation']);
  }
}
