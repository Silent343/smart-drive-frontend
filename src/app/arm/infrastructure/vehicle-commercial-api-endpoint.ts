import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { VehicleCommercial } from '../domain/model/vehicle-commercial.entity';
import { VehicleCommercialAssembler } from './vehicle-commercial-assembler';
import { VehicleCommercialResource, VehicleCommercialsResponse } from './vehicle-commercial-response';

export class VehicleCommercialsApiEndpoint extends BaseApiEndpoint<
  VehicleCommercial,
  VehicleCommercialResource,
  VehicleCommercialsResponse,
  VehicleCommercialAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      // Asegúrate de definir esta variable en tu archivo environment.ts
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderVehicleCommercialsEndpointPath}`,
      new VehicleCommercialAssembler(),
    );
  }
}
