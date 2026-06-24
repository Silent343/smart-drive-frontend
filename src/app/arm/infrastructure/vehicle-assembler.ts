import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Vehicle } from '../domain/model/vehicle.entity';
import { VehicleResource, VehiclesResponse } from './vehicle-response';

export class VehicleAssembler
  implements BaseAssembler<Vehicle, VehicleResource, VehiclesResponse>
{
  toEntityFromResource(resource: VehicleResource): Vehicle {
    return new Vehicle({
      id: resource.id,
      code: resource.code,
      status: resource.status,
      imageUrl: resource.imageUrl,
    });
  }

  toResourceFromEntity(entity: Vehicle): VehicleResource {
    return {
      id: entity.id,
      code: entity.code,
      status: entity.status,
      imageUrl: entity.imageUrl,
    };
  }

  toEntitiesFromResponse(response: VehiclesResponse): Vehicle[] {
    return (response.vehicles ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
