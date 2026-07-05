import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ArmStore } from '../../../application/arm.store';
import { Client } from '../../../domain/model/client.entity';
import { ClientsTableComponent } from '../../components/client-table/client-table.component';
import { ClientFormDialogComponent } from '../../components/client-form-dialog/client-form-dialog.component';
import { ClientDeleteDialogComponent } from '../../components/client-delete-dialog/client-delete-dialog.component';
import { Vehicle } from '../../../domain/model/vehicle.entity';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-client-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, TranslateModule, ClientsTableComponent],
  templateUrl: './client-page.component.html',
  styleUrl: './client-page.component.css'
})
export class ClientPageComponent implements OnInit {
  private store = inject(ArmStore);
  private dialog = inject(MatDialog);
  private iam = inject(IamStore);

  /** Only sellers register/edit clients; the admin has a read-only view. */
  readonly canManage = this.iam.isSeller;

  clients = computed(() =>
    this.store.clients().filter(c => this.iam.belongsToCompany(c.userId))
  );

  vehicles = computed(() => {
    const baseVehicles = this.store.vehicles();
    const specs = this.store.vehicleSpecifications();
    const commercials = this.store.vehicleCommercials();

    return baseVehicles.map(v => {
      v.specification = specs.find(s => s.vehicleId === v.id);
      v.commercial = commercials.find(c => c.vehicleId === v.id);
      return v;
    }).filter(v => this.iam.belongsToCompany(v.commercial?.userId));
  });

  ngOnInit(): void {
    this.store.loadClients();
    this.store.loadVehicles();
    this.store.loadVehicleSpecifications();
    this.store.loadVehicleCommercials();
  }

  openRegisterForm(): void {
    const dialogRef = this.dialog.open(ClientFormDialogComponent, {
      width: '450px',
      data: {
        client: null,
        }
    });

    dialogRef.afterClosed().subscribe((result: Omit<Client, 'id'> | null) => {
      if (result) {
        // Records are tagged with the shared company scope so every
        // worker of the company (admin + sellers) sees the same data.
        const newClientWithUser = {
          ...result,
          userId: this.iam.companyScope()
        };

        this.store.createClient(newClientWithUser);

        if (result.vehicleId) {
          this.updateVehicleStatus(result.vehicleId, 'Vendido');
        }
      }
    });
  }

  openEditForm(client: Client): void {
    const dialogRef = this.dialog.open(ClientFormDialogComponent, {
      width: '450px',
      data: {
        client: client,
       }
    });

    dialogRef.afterClosed().subscribe((result: Client | null) => {
      if (result) {
        this.store.updateClient(result);
      }

      const oldVehicleId = client.vehicleId;
      const newVehicleId = result?.vehicleId;

      if (oldVehicleId !== newVehicleId) {
        if (oldVehicleId) {
          this.updateVehicleStatus(oldVehicleId, 'Disponible');
        }
        if (newVehicleId) {
          this.updateVehicleStatus(newVehicleId, 'Vendido');
        }
      }
    });
  }

  openDeleteConfirmation(client: Client): void {
    const dialogRef = this.dialog.open(ClientDeleteDialogComponent, {
      width: '400px',
      data: client
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.store.deleteClient(client.id);

        if (client.vehicleId) {
          this.updateVehicleStatus(client.vehicleId, 'Disponible');
        }
      }
    });
  }

  private updateVehicleStatus(vehicleId: string, newStatus: string): void {
    const vehicle = this.vehicles().find(v => v.id === vehicleId);

    if (vehicle && vehicle.status !== newStatus) {
      this.store.updateVehicle(new Vehicle({
        id: vehicle.id,
        code: vehicle.code,
        status: newStatus,
        imageUrl: vehicle.imageUrl
      }));
    }
  }

  onUnlinkVehicle(client: Client): void {
    const updatedClient = new Client({
      id: client.id,
      name: client.name,
      dni: client.dni,
      income: client.income,
      occupation: client.occupation,
      phone: client.phone,
      userId: client.userId,
      vehicleId: ''
    });

    this.store.updateClient(updatedClient);
  }

}
