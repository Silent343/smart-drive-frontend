import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface VehicleResource extends BaseResource {
  id: string;
  code: string;
  status: string;
  imageUrl: string | null;
}

export interface VehiclesResponse extends BaseResponse {
  vehicles: VehicleResource[];
}
