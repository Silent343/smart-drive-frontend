import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface ScheduleRowResource extends BaseResource{
  id: string;
  loan_id: string;
  installment_no: number;
  payment_date: string;         // ISO-8601
  opening_balance: number;
  interest: number;
  amortization: number;
  insurance: number;
  postage: number;
  commission: number;
  monthly_payment: number;
  ending_balance: number;
  grace_period_type: string;
}

export interface ScheduleRowResponse extends BaseResponse {
  scheduleRows: ScheduleRowResource[];
}
