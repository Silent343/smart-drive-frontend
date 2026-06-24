import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface ClientResource extends BaseResource {
  id: string;
  userId: string;
  name: string;
  dni: string;
  income: number;
  occupation: string;
  phone: string;
  vehicleId: string
}

export interface ClientsResponse extends BaseResponse {
  clients: ClientResource[];
}
