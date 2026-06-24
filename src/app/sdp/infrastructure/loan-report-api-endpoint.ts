import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import {LoanReport} from '../domain/model/loan-report';
import { LoanReportResource, LoanReportResponse } from './loan-report-response';
import {LoanReportAssembler} from './loan-report-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';

export class LoanReportApiEndpoint extends BaseApiEndpoint<
  LoanReport,
  LoanReportResource,
  LoanReportResponse,
  LoanReportAssembler
> {
  constructor(http: HttpClient, loanId: string) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderLoansEndpointPath}/${loanId}/report`,
      new LoanReportAssembler(),
    );
  }
}
