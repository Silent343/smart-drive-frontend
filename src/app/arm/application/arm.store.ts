import { Injectable, signal } from '@angular/core';

import { Client } from '../domain/model/client.entity';
import { Vehicle } from '../domain/model/vehicle.entity';
import { VehicleSpecification } from '../domain/model/vehicle-specification.entity';
import { VehicleCommercial } from '../domain/model/vehicle-commercial.entity';
import { ArmApi } from '../infrastructure/arm-api';
import {Observable, tap} from 'rxjs';

/**
 * Application service for the arm bounded context.
 *
 * @remarks
 * Holds primary domain projections and handles full CRUD local state synchronization:
 * - Clients registry (CRUD - view "Clientes")
 * - Vehicles inventory (CRUD - view "Vehículos")
 * - Vehicle Specifications
 * - Vehicle Commercials
 */
@Injectable({ providedIn: 'root' })
export class ArmStore {
  // Writable Signals privados para la mutación interna del estado
  private readonly clientsSignal = signal<Client[]>([]);
  private readonly vehiclesSignal = signal<Vehicle[]>([]);
  private readonly vehicleSpecificationsSignal = signal<VehicleSpecification[]>([]);
  private readonly vehicleCommercialsSignal = signal<VehicleCommercial[]>([]);
  private readonly errorSignal = signal<string | null>(null);

  // Readonly Signals públicos expuestos directamente a los componentes de presentación
  readonly clients = this.clientsSignal.asReadonly();
  readonly vehicles = this.vehiclesSignal.asReadonly();
  readonly vehicleSpecifications = this.vehicleSpecificationsSignal.asReadonly();
  readonly vehicleCommercials = this.vehicleCommercialsSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private armApi: ArmApi) {}

  // ==========================================
  // CLIENTS ACTIONS (CRUD)
  // ==========================================

  loadClients(): void {
    this.errorSignal.set(null);
    this.armApi.getClients().subscribe({
      next: (clients) => this.clientsSignal.set(clients),
      error: (err) => {
        console.error('Failed to load clients:', err);
        this.errorSignal.set('Failed to load clients');
      },
    });
  }

  createClient(clientData: Omit<Client, 'id'>): void {
    this.errorSignal.set(null);
    this.armApi.createClient(clientData).subscribe({
      next: (newClient) => {
        this.clientsSignal.update((list) => [...list, newClient]);
      },
      error: (err) => {
        console.error('Failed to create client:', err);
        this.errorSignal.set('Failed to register client');
      },
    });
  }

  updateClient(client: Client): void {
    this.errorSignal.set(null);
    this.armApi.updateClient(client).subscribe({
      next: (updatedClient) => {
        this.clientsSignal.update((list) =>
          list.map((c) => (c.id === updatedClient.id ? updatedClient : c))
        );
      },
      error: (err) => {
        console.error('Failed to update client:', err);
        this.errorSignal.set('Failed to update client details');
      },
    });
  }

  deleteClient(clientId: string): void {
    this.errorSignal.set(null);
    this.armApi.deleteClient(clientId.toString()).subscribe({
      next: () => {
        this.clientsSignal.update((list) => list.filter((c) => c.id !== clientId));
      },
      error: (err) => {
        console.error('Failed to delete client:', err);
        this.errorSignal.set('Failed to remove client from registry');
      },
    });
  }

  // ==========================================
  // VEHICLES ACTIONS (CRUD)
  // ==========================================

  loadVehicles(): void {
    this.errorSignal.set(null);
    this.armApi.getVehicles().subscribe({
      next: (vehicles) => this.vehiclesSignal.set(vehicles),
      error: (err) => {
        console.error('Failed to load vehicles:', err);
        this.errorSignal.set('Failed to load vehicles');
      },
    });
  }

  /**
   * Dispatches a create vehicle command and adds the new instance to the inventory state.
   * Retorna el Observable para que el componente pueda encadenar peticiones.
   */
  createVehicle(vehicleData: Omit<Vehicle, 'id'>): Observable<Vehicle> {
    this.errorSignal.set(null);
    return this.armApi.createVehicle(vehicleData).pipe(
      tap({
        next: (newVehicle) => {
          this.vehiclesSignal.update((list) => [...list, newVehicle]);
        },
        error: (err) => {
          console.error('Failed to create vehicle:', err);
          this.errorSignal.set('Failed to register vehicle');
        }
      })
    );
  }

  updateVehicle(vehicle: Vehicle): void {
    this.errorSignal.set(null);
    this.armApi.updateVehicle(vehicle).subscribe({
      next: (updatedVehicle) => {
        this.vehiclesSignal.update((list) =>
          list.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v))
        );
      },
      error: (err) => {
        console.error('Failed to update vehicle:', err);
        this.errorSignal.set('Failed to update vehicle state');
      },
    });
  }

  deleteVehicle(vehicleId: string): void {
    this.errorSignal.set(null);
    this.armApi.deleteVehicle(vehicleId.toString()).subscribe({
      next: () => {
        this.vehiclesSignal.update((list) => list.filter((v) => v.id !== vehicleId));
      },
      error: (err) => {
        console.error('Failed to delete vehicle:', err);
        this.errorSignal.set('Failed to remove vehicle from inventory');
      },
    });
  }

  // ==========================================
  // VEHICLE SPECIFICATIONS ACTIONS (CRUD)
  // ==========================================

  loadVehicleSpecifications(): void {
    this.errorSignal.set(null);
    this.armApi.getVehicleSpecifications().subscribe({
      next: (specifications) => this.vehicleSpecificationsSignal.set(specifications),
      error: (err) => {
        console.error('Failed to load vehicle specifications:', err);
        this.errorSignal.set('Failed to load vehicle specifications');
      },
    });
  }

  createVehicleSpecification(specificationData: Omit<VehicleSpecification, 'id'>): void {
    this.errorSignal.set(null);
    this.armApi.createVehicleSpecification(specificationData).subscribe({
      next: (newSpecification) => {
        this.vehicleSpecificationsSignal.update((list) => [...list, newSpecification]);
      },
      error: (err) => {
        console.error('Failed to create vehicle specification:', err);
        this.errorSignal.set('Failed to register vehicle specification');
      },
    });
  }

  updateVehicleSpecification(specification: VehicleSpecification): void {
    this.errorSignal.set(null);
    this.armApi.updateVehicleSpecification(specification).subscribe({
      next: (updatedSpecification) => {
        this.vehicleSpecificationsSignal.update((list) =>
          list.map((s) => (s.id === updatedSpecification.id ? updatedSpecification : s))
        );
      },
      error: (err) => {
        console.error('Failed to update vehicle specification:', err);
        this.errorSignal.set('Failed to update vehicle specification details');
      },
    });
  }

  deleteVehicleSpecification(specificationId: string): void {
    this.errorSignal.set(null);
    this.armApi.deleteVehicleSpecification(specificationId).subscribe({
      next: () => {
        this.vehicleSpecificationsSignal.update((list) => list.filter((s) => s.id !== specificationId));
      },
      error: (err) => {
        console.error('Failed to delete vehicle specification:', err);
        this.errorSignal.set('Failed to remove vehicle specification');
      },
    });
  }

  // ==========================================
  // VEHICLE COMMERCIALS ACTIONS (CRUD)
  // ==========================================

  loadVehicleCommercials(): void {
    this.errorSignal.set(null);
    this.armApi.getVehicleCommercials().subscribe({
      next: (commercials) => this.vehicleCommercialsSignal.set(commercials),
      error: (err) => {
        console.error('Failed to load vehicle commercials:', err);
        this.errorSignal.set('Failed to load vehicle commercials');
      },
    });
  }

  createVehicleCommercial(commercialData: Omit<VehicleCommercial, 'id'>): void {
    this.errorSignal.set(null);
    this.armApi.createVehicleCommercial(commercialData).subscribe({
      next: (newCommercial) => {
        this.vehicleCommercialsSignal.update((list) => [...list, newCommercial]);
      },
      error: (err) => {
        console.error('Failed to create vehicle commercial:', err);
        this.errorSignal.set('Failed to register vehicle commercial');
      },
    });
  }

  updateVehicleCommercial(commercial: VehicleCommercial): void {
    this.errorSignal.set(null);
    this.armApi.updateVehicleCommercial(commercial).subscribe({
      next: (updatedCommercial) => {
        this.vehicleCommercialsSignal.update((list) =>
          list.map((c) => (c.id === updatedCommercial.id ? updatedCommercial : c))
        );
      },
      error: (err) => {
        console.error('Failed to update vehicle commercial:', err);
        this.errorSignal.set('Failed to update vehicle commercial details');
      },
    });
  }

  deleteVehicleCommercial(commercialId: string): void {
    this.errorSignal.set(null);
    this.armApi.deleteVehicleCommercial(commercialId).subscribe({
      next: () => {
        this.vehicleCommercialsSignal.update((list) => list.filter((c) => c.id !== commercialId));
      },
      error: (err) => {
        console.error('Failed to delete vehicle commercial:', err);
        this.errorSignal.set('Failed to remove vehicle commercial');
      },
    });
  }
}
