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
  risk_insurance_rate_pct?: number;
  gps_fee_amount?: number;
  final_installment_pct?: number;
  igv_itf_pct?: number;
  notary_cost_amount?: number;
  registry_cost_amount?: number;
  appraisal_cost_amount?: number;
  study_commission_amount?: number;
  activation_commission_amount?: number;
  discount_annual_rate_pct?: number;
}

export interface CreditConfigResponse extends BaseResponse {
  creditConfigs: CreditConfigResource[];
}
