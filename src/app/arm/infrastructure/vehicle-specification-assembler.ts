import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { VehicleSpecification } from '../domain/model/vehicle-specification.entity';
import { VehicleSpecificationResource, VehicleSpecificationsResponse } from './vehicle-specification-response';

export class VehicleSpecificationAssembler
  implements BaseAssembler<VehicleSpecification, VehicleSpecificationResource, VehicleSpecificationsResponse>
{
  toEntityFromResource(resource: VehicleSpecificationResource): VehicleSpecification {
    return new VehicleSpecification({
      id: resource.id,
      vehicleId: resource.vehicleId,
      brand: resource.brand,
      model: resource.model,
      year: resource.year,
      transmission: resource.transmission,
    });
  }

  toResourceFromEntity(entity: VehicleSpecification): VehicleSpecificationResource {
    return {
      id: entity.id,
      vehicleId: entity.vehicleId,
      brand: entity.brand,
      model: entity.model,
      year: entity.year,
      transmission: entity.transmission,
    };
  }

  toEntitiesFromResponse(response: VehicleSpecificationsResponse): VehicleSpecification[] {
    return (response.vehicleSpecifications ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
