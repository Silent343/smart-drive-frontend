import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {LoanResource, LoanResponse} from './loan-response';
import {Loan} from '../domain/model/loan';
import {LoanAssembler} from './loan-assembler';

export class LoanApiEndpoint extends BaseApiEndpoint<
  Loan,
  LoanResource,
  LoanResponse,
  LoanAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderLoansEndpointPath}`,
      new LoanAssembler(),
    );
  }
}
