import {
  Capitalization,
  Currency,
  GracePeriodType,
  InterestRateType,
} from './credit-config';

export type SimulationStatus = 'DRAFT' | 'REVIEWED' | 'CONFIRMED';

export interface SimulationVehicleSnapshot {
  id: string;
  label: string;
  price: number;
}

export interface CreditConfigSnapshot {
  id: string;
  currency: Currency;
  interestRateType: InterestRateType;
  annualRate: number;
  capitalization?: Capitalization;
  gracePeriodType: GracePeriodType;
  gracePeriodMonths: number;
  insuranceRatePct: number;
  postageFeeAmount: number;
  administrationFeePct: number;
  riskInsuranceRatePct: number;
  gpsFeeAmount: number;
  finalInstallmentPct: number;
  igvItfPct: number;
  notaryCostAmount: number;
  registryCostAmount: number;
  appraisalCostAmount: number;
  studyCommissionAmount: number;
  activationCommissionAmount: number;
  discountAnnualRatePct: number;
}

export interface LoanSnapshot {
  id: string;
  carId: string;
  clientId: string;
  configId: string;
  sellerId: string;
  sellerName: string;
  status: string;
  initialFee: number;
  vehiclePrice: number;
  loanAmount: number;
  installmentsQty: number;
  startDate: string;
  fixedInstallment: number;
  npvDebtor: number;
  irrDebtor: number;
  tcea: number;
  trea: number;
  totalInterest: number;
  totalInsurance: number;
  totalRiskInsurance: number;
  totalGps: number;
  totalPostage: number;
  totalCommission: number;
  totalTax: number;
  initialCosts: number;
  residualValue: number;
  ctc: number;
  vehicles: { carId: string; price: number }[];
}

export interface ScheduleRowSnapshot {
  id: string;
  loanId: string;
  installmentNo: number;
  paymentDate: string;
  openingBalance: number;
  interest: number;
  amortization: number;
  insurance: number;
  postage: number;
  commission: number;
  monthlyPayment: number;
  endingBalance: number;
  gracePeriodType: GracePeriodType;
}

export interface SimulationSnapshot {
  id: string;
  ownerIdentifier: string;
  ownerUserId: string;
  companyDomain: string;
  sellerId: string;
  sellerName: string;
  status: SimulationStatus;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  clientName: string;
  carId: string;
  carName: string;
  vehicles: SimulationVehicleSnapshot[];
  config: CreditConfigSnapshot;
  loan: LoanSnapshot;
  schedule: ScheduleRowSnapshot[];
}
