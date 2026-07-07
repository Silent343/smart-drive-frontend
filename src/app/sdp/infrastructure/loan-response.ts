import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';
import {VehicleResource} from '../../arm/infrastructure/vehicle-response';

export interface LoanResource extends BaseResource{
  id: string;
  car_id: string;
  client_id: string;
  config_id: string;
  seller_id?: string;
  seller_name?: string;
  status?: string;
  initial_fee: number;
  vehicle_price: number;
  loan_amount: number;
  instalments_qty: number;
  start_date: string;          // ISO-8601
  fixed_installment: number;
  npv_debtor: number;
  irr_debtor: number;
  tcea: number;
  trea?: number;
  total_interest: number;
  total_insurance: number;
  total_risk_insurance?: number;
  total_gps?: number;
  total_postage: number;
  total_commission: number;
  total_tax?: number;
  initial_costs?: number;
  residual_value?: number;
  ctc: number;
}

export interface LoanResponse extends BaseResponse {
  loans: LoanResource[];
}
