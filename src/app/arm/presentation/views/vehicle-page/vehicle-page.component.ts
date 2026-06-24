import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ArmStore } from '../../../application/arm.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { Vehicle } from '../../../domain/model/vehicle.entity';
import { VehiclesCatalogComponent } from '../../components/vehicles-catalog/vehicles-catalog.component';
import { VehicleDetailsComponent } from '../../components/vehicle-details/vehicle-details.component';
import { VehicleFormDialogComponent } from '../../components/vehicle-form-dialog/vehicle-form-dialog.component';
import { VehicleDeleteDialogComponent } from '../../components/vehicle-delete-dialog/vehicle-delete-dialog.component';
import {VehicleSpecification} from '../../../domain/model/vehicle-specification.entity';
import {VehicleCommercial} from '../../../domain/model/vehicle-commercial.entity';

@Component({
  selector: 'app-vehicle-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    TranslateModule,
    VehiclesCatalogComponent,
    VehicleDetailsComponent
  ],
  templateUrl: './vehicle-page.component.html',
  styleUrl: './vehicle-page.component.css'
})
export class VehiclePageComponent implements OnInit {

  private store = inject(ArmStore);
  private dialog = inject(MatDialog);
  private iam = inject(IamStore);

  selectedVehicle = signal<Vehicle | null>(null);
  filterModel = signal<string>('');

  vehicles = computed(() => {
    const userId = this.iam.currentUserId() || '';
    const baseVehicles = this.store.vehicles();
    const specs = this.store.vehicleSpecifications();
    const commercials = this.store.vehicleCommercials();
    const clients = this.store.clients();

    return baseVehicles.map(v => {
      v.specification = specs.find(s => s.vehicleId === v.id);
      v.commercial = commercials.find(c => c.vehicleId === v.id);

      const isSold = clients.some(client => client.vehicleId === v.id);

      if (isSold) {
        v.status = 'vendido';
      }

      return v;
    }).filter(v => v.commercial?.userId === userId);
  });

  filteredVehicles = computed(() => {
    const all = this.vehicles();
    const term = this.filterModel();
    if (!term) return all;
    return all.filter(v => v.specification?.model === term);
  });

  uniqueModels = computed(() => {
    const allVehicles = this.vehicles();
    const models = allVehicles.map(v => v.specification?.model || '');
    return [...new Set(models.filter(m => m !== ''))];
  });

  ngOnInit(): void {
    this.store.loadVehicles();
    this.store.loadVehicleSpecifications();
    this.store.loadVehicleCommercials();
    this.store.loadClients();
  }

  onFilterChange(event: any): void {
    this.filterModel.set(event.target.value);
  }

  onViewDetails(vehicle: Vehicle): void {
    this.selectedVehicle.set(vehicle);
  }

  onBackToCatalog(): void {
    this.selectedVehicle.set(null);
  }

  openRegisterForm(): void {
    const dialogRef = this.dialog.open(VehicleFormDialogComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const currentUserId = this.iam.currentUserId() || '';

        this.store.createVehicle({
          code: result.code,
          status: result.status,
          imageUrl: result.imageUrl,
          specification: undefined,
          commercial: undefined
        }).subscribe((newVehicle) => {

          const generatedId = newVehicle.id;

          this.store.createVehicleSpecification({
            vehicleId: generatedId,
            brand: result.brand,
            model: result.model,
            year: result.year,
            transmission: result.transmission
          });

          this.store.createVehicleCommercial({
            vehicleId: generatedId,
            userId: currentUserId,
            price: result.price,
            company: result.company
          });

        });
      }
    });

  }

  onEdit(vehicle: Vehicle): void {
    const dialogRef = this.dialog.open(VehicleFormDialogComponent, {
      width: '500px',
      data: vehicle
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.store.updateVehicle(new Vehicle({
          id: result.id,
          code: result.code,
          status: result.status,
          imageUrl: result.imageUrl
        }));

        if (result.specificationId) {
          this.store.updateVehicleSpecification(new VehicleSpecification({
            id: result.specificationId,
            vehicleId: result.id,
            brand: result.brand,
            model: result.model,
            year: result.year,
            transmission: result.transmission
          }));
        }

        if (result.commercialId) {
          this.store.updateVehicleCommercial(new VehicleCommercial({
            id: result.commercialId,
            vehicleId: result.id,
            userId: result.userId,
            price: result.price,
            company: result.company
          }));
        }

        if (this.selectedVehicle()?.id === result.id) {
          this.selectedVehicle.set(null);
        }
      }
    });
  }

  onDelete(vehicle: Vehicle): void {
    const dialogRef = this.dialog.open(VehicleDeleteDialogComponent, {
      width: '400px',
      data: vehicle
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.store.deleteVehicle(vehicle.id);
        if (this.selectedVehicle()?.id === vehicle.id) {
          this.selectedVehicle.set(null);
        }
      }
    });
  }
}
