import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface VehicleSpecificationResource extends BaseResource {
  id: string;
  vehicleId: string;
  brand: string;
  model: string;
  year: number;
  transmission: string;
}

export interface VehicleSpecificationsResponse extends BaseResponse {
  vehicleSpecifications: VehicleSpecificationResource[];
}
