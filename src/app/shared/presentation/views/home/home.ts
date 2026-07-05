import {Component, computed, inject, OnInit} from '@angular/core';
import {TranslateModule, TranslatePipe} from '@ngx-translate/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {ArmStore} from '../../../../arm/application/arm.store';
import {ChartConfiguration} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import {IamStore} from '../../../../iam/application/iam.store';
import {PreferencesStore} from '../../../application/preferences.store';

/**
 * Home view for the shared presentation context.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule, BaseChartDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private store = inject(ArmStore);
  private readonly iamStore = inject(IamStore);
  private readonly preferences = inject(PreferencesStore);

  currentUser = this.iamStore.currentUser;
  readonly userId = this.iamStore.currentUserId;
  readonly avatarPhoto = this.preferences.photo;

  ngOnInit(): void {
    this.store.loadClients();
    this.store.loadVehicles();
    this.store.loadVehicleSpecifications();
    this.store.loadVehicleCommercials();
  }

  clients = computed(() =>
    this.store.clients().filter(c => this.iamStore.belongsToCompany(c.userId))
  );

  vehicles = computed(() => {
    // Obtenemos todas las colecciones del store
    const baseVehicles = this.store.vehicles();
    const specs = this.store.vehicleSpecifications();
    const commercials = this.store.vehicleCommercials();
    const clients = this.store.clients();

    return baseVehicles.map(v => {
      // 1. Ensamblamos el vehículo con sus partes
      v.specification = specs.find(s => s.vehicleId === v.id);
      v.commercial = commercials.find(c => c.vehicleId === v.id);

      // 2. Evaluamos dinámicamente si está vendido
      const isSold = clients.some(client => client.vehicleId === v.id);

      // 3. Sobrescribimos el estado para que los contadores funcionen
      if (isSold) {
        v.status = 'Vendido';
      } else {
        // Asegúrate de que este string coincida con la validación de tu contador
        v.status = 'Disponible';
      }

      return v;
    }).filter(v => this.iamStore.belongsToCompany(v.commercial?.userId));
  });

  totalClients = computed(() => {
    return this.clients().length;
  });

  availableVehicles = computed(() => {
    return this.vehicles().filter(v => v.status === 'Disponible').length;
  });

  soldVehicles = computed(() => {
    return this.vehicles().filter(v => v.status === 'Vendido').length;
  });

  // =========================================
  // LÓGICA DEL GRÁFICO FINANCIERO
  // =========================================

  financialChartData = computed<ChartConfiguration['data']>(() => {
    const sold = this.vehicles().filter(v => v.status === 'Vendido');

    const grouped = sold.reduce((acc, v) => {
      // Extraemos el año de specification y el precio de commercial
      // Usamos un valor por defecto en caso de que las entidades hijas no se hayan cargado aún
      const vehicleYear = v.specification?.year || new Date().getFullYear();
      const vehiclePrice = v.commercial?.price || 0;

      if (!acc[vehicleYear]) {
        acc[vehicleYear] = { year: vehicleYear, totalAmount: 0, count: 0 };
      }
      acc[vehicleYear].totalAmount += vehiclePrice;
      acc[vehicleYear].count += 1;
      return acc;
    }, {} as Record<number, { year: number, totalAmount: number, count: number }>);

    const sortedData = Object.values(grouped).sort((a, b) => a.year - b.year);

    return {
      labels: sortedData.map(d => d.year.toString()), // Eje X: Años
      datasets: [
        {
          data: sortedData.map(d => d.totalAmount), // Eje Y: Montos
          label: 'Ingresos',
          backgroundColor: 'rgba(11, 27, 61, 0.1)',
          borderColor: '#0b1b3d',
          pointBackgroundColor: '#d4af37',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#d4af37',
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: 'origin',
          tension: 0.4,

          countData: sortedData.map(d => d.count)
        } as any
      ]
    };
  });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0b1b3d',
        titleFont: { size: 14, family: 'Roboto' },
        bodyFont: { size: 14, family: 'Roboto' },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const amount = context.raw;
            const count = context.dataset.countData[context.dataIndex];
            return [
              `Monto Total: $${amount.toLocaleString()}`,
              `Autos Vendidos: ${count}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          callback: (value) => '$' + value.toLocaleString()
        }
      }
    }
  };
}
