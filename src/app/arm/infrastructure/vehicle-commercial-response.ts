import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface VehicleCommercialResource extends BaseResource {
  id: string;
  vehicleId: string;
  userId: string;
  price: number;
  company: string;
}

export interface VehicleCommercialsResponse extends BaseResponse {
  vehicleCommercials: VehicleCommercialResource[];
}
