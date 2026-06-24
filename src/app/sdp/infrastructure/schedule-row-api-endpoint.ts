import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {ScheduleRow } from '../domain/model/schedule-row';
import {ScheduleRowAssembler} from './schedule-row-assembler';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ScheduleRowResource, ScheduleRowResponse} from './schedule-row-response';

export class ScheduleRowApiEndpoint extends BaseApiEndpoint<
  ScheduleRow,
  ScheduleRowResource,
  ScheduleRowResponse,
  ScheduleRowAssembler
> {
  constructor(http: HttpClient, loanId: string) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderLoansEndpointPath}/${loanId}/schedule`,
      new ScheduleRowAssembler(),
    );
  }
}
