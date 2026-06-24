import {CreditConfig} from '../domain/model/credit-config';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {CreditConfigAssembler} from './credit-config-assembler';
import {CreditConfigResource, CreditConfigResponse} from './credit-config-response';

export class CreditConfigApiEndpoint extends BaseApiEndpoint<
  CreditConfig,
  CreditConfigResource,
  CreditConfigResponse,
  CreditConfigAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderCreditConfigsEndpointPath}`,
      new CreditConfigAssembler(),
    );
  }
}
