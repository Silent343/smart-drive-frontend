import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { VehicleCommercial } from '../domain/model/vehicle-commercial.entity';
import { VehicleCommercialResource, VehicleCommercialsResponse } from './vehicle-commercial-response';

export class VehicleCommercialAssembler
  implements BaseAssembler<VehicleCommercial, VehicleCommercialResource, VehicleCommercialsResponse>
{
  toEntityFromResource(resource: VehicleCommercialResource): VehicleCommercial {
    return new VehicleCommercial({
      id: resource.id,
      vehicleId: resource.vehicleId,
      userId: resource.userId,
      price: resource.price,
      company: resource.company,
    });
  }

  toResourceFromEntity(entity: VehicleCommercial): VehicleCommercialResource {
    return {
      id: entity.id,
      vehicleId: entity.vehicleId,
      userId: entity.userId,
      price: entity.price,
      company: entity.company,
    };
  }

  toEntitiesFromResponse(response: VehicleCommercialsResponse): VehicleCommercial[] {
    return (response.vehicleCommercials ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
