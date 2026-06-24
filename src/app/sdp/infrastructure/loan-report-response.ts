import {ScheduleRowResource, ScheduleRowResponse} from './schedule-row-response';
import {LoanResource, LoanResponse} from './loan-response';
import {CreditConfigResource, CreditConfigResponse} from './credit-config-response';
import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';
import {VehicleResource} from '../../arm/infrastructure/vehicle-response';

export interface LoanReportResource extends BaseResource{
  id: string;
  loan: LoanResource;
  config: CreditConfigResource;
  schedule: ScheduleRowResource[];
}

export interface LoanReportResponse extends BaseResponse {
  loanReports: LoanReportResource[];
}
