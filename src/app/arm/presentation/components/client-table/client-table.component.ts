import {Component, input, output} from '@angular/core';
import {Client} from '../../../domain/model/client.entity';
import { TranslateModule } from '@ngx-translate/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {CommonModule} from '@angular/common';
import {Vehicle} from '../../../domain/model/vehicle.entity';

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

  edit = output<Client>();
  delete = output<Client>();

  unlinkVehicle = output<Client>();

  getVehicleCode(vehicleId?: string): string | null {
    if (!vehicleId) return null;
    const vehicle = this.vehicles().find(v => v.id === vehicleId);
    return vehicle ? vehicle.code : null;
  }
}
