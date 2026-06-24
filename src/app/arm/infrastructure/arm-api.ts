import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';
import { Client } from '../domain/model/client.entity';
import { Vehicle } from '../domain/model/vehicle.entity';
import { VehicleSpecification } from '../domain/model/vehicle-specification.entity';
import { VehicleCommercial } from '../domain/model/vehicle-commercial.entity';
import { ClientsApiEndpoint } from './clients-api-endpoint';
import { VehiclesApiEndpoint } from './vehicles-api-endpoint';
import {VehicleSpecificationsApiEndpoint} from './vehicle-specification-api-endpoint';
import {VehicleCommercialsApiEndpoint} from './vehicle-commercial-api-endpoint';

/**
 * Infrastructure facade for the arm bounded context.
 */
@Injectable({ providedIn: 'root' })
export class ArmApi extends BaseApi {
  private readonly clientsEndpoint: ClientsApiEndpoint;
  private readonly vehiclesEndpoint: VehiclesApiEndpoint;
  private readonly vehicleSpecificationsEndpoint: VehicleSpecificationsApiEndpoint;
  private readonly vehicleCommercialsEndpoint: VehicleCommercialsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.clientsEndpoint = new ClientsApiEndpoint(http);
    this.vehiclesEndpoint = new VehiclesApiEndpoint(http);
    this.vehicleSpecificationsEndpoint = new VehicleSpecificationsApiEndpoint(http);
    this.vehicleCommercialsEndpoint = new VehicleCommercialsApiEndpoint(http);
  }

  // ==========================================
  // CLIENTS CRUD OPERATIONS
  // ==========================================

  getClients(): Observable<Client[]> {
    return this.clientsEndpoint.getAll();
  }

  getClientById(id: string): Observable<Client> {
    return this.clientsEndpoint.getById(id);
  }

  createClient(client: Omit<Client, 'id'>): Observable<Client> {
    return this.clientsEndpoint.create(<Client>client);
  }

  updateClient(client: Client): Observable<Client> {
    return this.clientsEndpoint.update(client, client.id);
  }

  deleteClient(id: string): Observable<void> {
    return this.clientsEndpoint.delete(id);
  }

  // ==========================================
  // VEHICLES CRUD OPERATIONS
  // ==========================================

  getVehicles(): Observable<Vehicle[]> {
    return this.vehiclesEndpoint.getAll();
  }

  getVehicleById(id: string): Observable<Vehicle> {
    return this.vehiclesEndpoint.getById(id);
  }

  createVehicle(vehicle: Omit<Vehicle, 'id'>): Observable<Vehicle> {
    return this.vehiclesEndpoint.create(<Vehicle>vehicle);
  }

  updateVehicle(vehicle: Vehicle): Observable<Vehicle> {
    return this.vehiclesEndpoint.update(vehicle, vehicle.id);
  }

  deleteVehicle(id: string): Observable<void> {
    return this.vehiclesEndpoint.delete(id);
  }

  // ==========================================
  // VEHICLE SPECIFICATIONS CRUD OPERATIONS
  // ==========================================

  getVehicleSpecifications(): Observable<VehicleSpecification[]> {
    return this.vehicleSpecificationsEndpoint.getAll();
  }

  getVehicleSpecificationById(id: string): Observable<VehicleSpecification> {
    return this.vehicleSpecificationsEndpoint.getById(id);
  }

  createVehicleSpecification(specification: Omit<VehicleSpecification, 'id'>): Observable<VehicleSpecification> {
    return this.vehicleSpecificationsEndpoint.create(<VehicleSpecification>specification);
  }

  updateVehicleSpecification(specification: VehicleSpecification): Observable<VehicleSpecification> {
    return this.vehicleSpecificationsEndpoint.update(specification, specification.id);
  }

  deleteVehicleSpecification(id: string): Observable<void> {
    return this.vehicleSpecificationsEndpoint.delete(id);
  }

  // ==========================================
  // VEHICLE COMMERCIALS CRUD OPERATIONS
  // ==========================================

  getVehicleCommercials(): Observable<VehicleCommercial[]> {
    return this.vehicleCommercialsEndpoint.getAll();
  }

  getVehicleCommercialById(id: string): Observable<VehicleCommercial> {
    return this.vehicleCommercialsEndpoint.getById(id);
  }

  createVehicleCommercial(commercial: Omit<VehicleCommercial, 'id'>): Observable<VehicleCommercial> {
    return this.vehicleCommercialsEndpoint.create(<VehicleCommercial>commercial);
  }

  updateVehicleCommercial(commercial: VehicleCommercial): Observable<VehicleCommercial> {
    return this.vehicleCommercialsEndpoint.update(commercial, commercial.id);
  }

  deleteVehicleCommercial(id: string): Observable<void> {
    return this.vehicleCommercialsEndpoint.delete(id);
  }
}
