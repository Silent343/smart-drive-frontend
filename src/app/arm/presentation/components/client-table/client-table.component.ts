import {Component, input, output} from '@angular/core';
import {Client} from '../../../domain/model/client.entity';
import { TranslateModule } from '@ngx-translate/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {CommonModule} from '@angular/common';
import {Vehicle} from '../../../domain/model/vehicle.entity';
import {Loan} from '../../../../sdp/domain/model/loan';

@Component({
  selector: 'app-client-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TranslateModule],
  templateUrl: './client-table.component.html',
  styleUrl: './client-table.component.css',
})
export class ClientsTableComponent {
  clients = input.required<Client[]>();
  vehicles = input<Vehicle[]>([]); // Nuevo input para recibir la lista
  loans = input<Loan[]>([]);
  /** When true (admin view) all CRUD actions are hidden: list is read-only. */
  readonly = input<boolean>(false);

  edit = output<Client>();
  delete = output<Client>();

  unlinkVehicle = output<Client>();

  getVehicleLabels(client: Client): string[] {
    const vehicleIds = this.loans()
      .filter(loan => loan.clientId === client.id)
      .flatMap(loan => this.vehicleIdsFromLoan(loan));

    return [...new Set(vehicleIds)]
      .map(vehicleId => this.vehicleLabel(vehicleId))
      .filter(label => !!label);
  }

  private vehicleIdsFromLoan(loan: Loan): string[] {
    if (loan.vehicles?.length) {
      return loan.vehicles.map(vehicle => vehicle.carId).filter(Boolean);
    }
    return loan.carId ? [loan.carId] : [];
  }

  private vehicleLabel(vehicleId: string): string {
    const vehicle = this.vehicles().find(v => v.id === vehicleId);
    const spec = vehicle?.specification;

    if (spec?.brand || spec?.model) {
      return `${spec.brand ?? ''} ${spec.model ?? ''}`.trim();
    }

    return vehicle?.code ?? vehicleId;
  }
}
