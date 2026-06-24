import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { VehicleSpecification } from '../domain/model/vehicle-specification.entity';
import { VehicleSpecificationAssembler } from './vehicle-specification-assembler';
import { VehicleSpecificationResource, VehicleSpecificationsResponse } from './vehicle-specification-response';

export class VehicleSpecificationsApiEndpoint extends BaseApiEndpoint<
  VehicleSpecification,
  VehicleSpecificationResource,
  VehicleSpecificationsResponse,
  VehicleSpecificationAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      // Asegúrate de definir esta variable en tu archivo environment.ts
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderVehicleSpecificationsEndpointPath}`,
      new VehicleSpecificationAssembler(),
    );
  }
}
