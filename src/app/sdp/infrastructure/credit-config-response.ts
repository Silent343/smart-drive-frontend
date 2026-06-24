import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface CreditConfigResource extends BaseResource{
  id: string;
  currency: string;
  interest_rate_type: string;
  annual_rate: number;
  capitalization: number | null;
  grace_period_type: string;
  grace_period_months: number;
  insurance_rate_pct: number;
  postage_fee_amount: number;
  administration_fee_pct: number;
}

export interface CreditConfigResponse extends BaseResponse {
  creditConfigs: CreditConfigResource[];
}
