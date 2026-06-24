import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Client } from '../domain/model/client.entity';
import { ClientResource, ClientsResponse } from './client-response';

export class ClientAssembler
  implements BaseAssembler<Client, ClientResource, ClientsResponse>
{
  toEntityFromResource(resource: ClientResource): Client {
    return new Client({
      id: resource.id,
      userId: resource.userId,
      name: resource.name,
      dni: resource.dni,
      income: resource.income,
      occupation: resource.occupation,
      phone: resource.phone,
      vehicleId: resource.vehicleId
    });
  }

  toResourceFromEntity(entity: Client): ClientResource {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      dni: entity.dni,
      income: entity.income,
      occupation: entity.occupation,
      phone: entity.phone,
      vehicleId: entity.vehicleId
    };
  }

  toEntitiesFromResponse(response: ClientsResponse): Client[] {
    return (response.clients ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
