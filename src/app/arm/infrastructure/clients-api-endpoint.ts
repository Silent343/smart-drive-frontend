import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Client } from '../domain/model/client.entity';
import { ClientAssembler } from './client-assembler';
import { ClientResource, ClientsResponse } from './client-response';

/**
 * HTTP endpoint client for the clients management projection.
 */
export class ClientsApiEndpoint extends BaseApiEndpoint<
  Client,
  ClientResource,
  ClientsResponse,
  ClientAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderClientsEndpointPath}`,
      new ClientAssembler(),
    );
  }
}
