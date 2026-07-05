import {BaseEntity} from '../../../shared/domain/model/base-entity';

export type Currency        = 'PEN' | 'USD';
export type InterestRateType = 'efectiva' | 'nominal';
export type Capitalization  = 12 | 4 | 2 | 365;
export type GracePeriodType = 'none' | 'partial' | 'total';

export class CreditConfig implements BaseEntity {
  private _id!: string;
  private _currency!: Currency;
  private _interestRateType!: InterestRateType;
  private _annualRate!: number;
  private _capitalization?: Capitalization;
  private _gracePeriodType!: GracePeriodType;
  private _gracePeriodMonths!: number;
  private _insuranceRatePct!: number;
  private _postageFeeAmount!: number;
  private _administrationFeePct!: number;
  private _riskInsuranceRatePct!: number;
  private _gpsFeeAmount!: number;
  private _finalInstallmentPct!: number;
  private _igvItfPct!: number;
  private _notaryCostAmount!: number;
  private _registryCostAmount!: number;
  private _appraisalCostAmount!: number;
  private _studyCommissionAmount!: number;
  private _activationCommissionAmount!: number;
  private _discountAnnualRatePct!: number;

  /** Convierte TNA → TEA si es nominal */
  get effectiveAnnualRate(): number {
    if (this.interestRateType === 'efectiva') return this.annualRate;
    const m: number = this.capitalization ?? 12;
    return (Math.pow(1 + this.annualRate / 100 / m, m) - 1) * 100;
  }

  /** TEA → TEM (tasa efectiva mensual) */
  get monthlyRate(): number {
    return Math.pow(1 + this.effectiveAnnualRate / 100, 1 / 12) - 1;
  }


  constructor(props: {
    id: string;
    currency: "PEN" | "USD";
    interestRateType: "efectiva" | "nominal";
    annualRate: number;
    capitalization: 12 | 4 | 2 | 365 | undefined;
    gracePeriodType: "none" | "partial" | "total";
    gracePeriodMonths: number;
    insuranceRatePct: number;
    postageFeeAmount: number;
    administrationFeePct: number;
    riskInsuranceRatePct?: number;
    gpsFeeAmount?: number;
    finalInstallmentPct?: number;
    igvItfPct?: number;
    notaryCostAmount?: number;
    registryCostAmount?: number;
    appraisalCostAmount?: number;
    studyCommissionAmount?: number;
    activationCommissionAmount?: number;
    discountAnnualRatePct?: number;
  }) {
    this._id = props.id;
    this._currency = props.currency;
    this._interestRateType = props.interestRateType;
    this._annualRate = props.annualRate;
    this._capitalization = props.capitalization;
    this._gracePeriodType = props.gracePeriodType;
    this._gracePeriodMonths = props.gracePeriodMonths;
    this._insuranceRatePct = props.insuranceRatePct;
    this._postageFeeAmount = props.postageFeeAmount;
    this._administrationFeePct = props.administrationFeePct;
    this._riskInsuranceRatePct = props.riskInsuranceRatePct ?? 0;
    this._gpsFeeAmount = props.gpsFeeAmount ?? 0;
    this._finalInstallmentPct = props.finalInstallmentPct ?? 0;
    this._igvItfPct = props.igvItfPct ?? 0;
    this._notaryCostAmount = props.notaryCostAmount ?? 0;
    this._registryCostAmount = props.registryCostAmount ?? 0;
    this._appraisalCostAmount = props.appraisalCostAmount ?? 0;
    this._studyCommissionAmount = props.studyCommissionAmount ?? 0;
    this._activationCommissionAmount = props.activationCommissionAmount ?? 0;
    this._discountAnnualRatePct = props.discountAnnualRatePct ?? 0;
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get currency(): Currency {
    return this._currency;
  }

  set currency(value: Currency) {
    this._currency = value;
  }

  get interestRateType(): InterestRateType {
    return this._interestRateType;
  }

  set interestRateType(value: InterestRateType) {
    this._interestRateType = value;
  }

  get annualRate(): number {
    return this._annualRate;
  }

  set annualRate(value: number) {
    this._annualRate = value;
  }

  get capitalization(): Capitalization | undefined  {
    return this._capitalization;
  }

  set capitalization(value: Capitalization | undefined ) {
    this._capitalization = value;
  }

  get gracePeriodType(): GracePeriodType {
    return this._gracePeriodType;
  }

  set gracePeriodType(value: GracePeriodType) {
    this._gracePeriodType = value;
  }

  get gracePeriodMonths(): number {
    return this._gracePeriodMonths;
  }

  set gracePeriodMonths(value: number) {
    this._gracePeriodMonths = value;
  }

  get insuranceRatePct(): number {
    return this._insuranceRatePct;
  }

  set insuranceRatePct(value: number) {
    this._insuranceRatePct = value;
  }

  get postageFeeAmount(): number {
    return this._postageFeeAmount;
  }

  set postageFeeAmount(value: number) {
    this._postageFeeAmount = value;
  }

  get administrationFeePct(): number {
    return this._administrationFeePct;
  }

  set administrationFeePct(value: number) {
    this._administrationFeePct = value;
  }

  get riskInsuranceRatePct(): number {
    return this._riskInsuranceRatePct;
  }

  set riskInsuranceRatePct(value: number) {
    this._riskInsuranceRatePct = value;
  }

  get gpsFeeAmount(): number {
    return this._gpsFeeAmount;
  }

  set gpsFeeAmount(value: number) {
    this._gpsFeeAmount = value;
  }

  get finalInstallmentPct(): number {
    return this._finalInstallmentPct;
  }

  set finalInstallmentPct(value: number) {
    this._finalInstallmentPct = value;
  }

  get igvItfPct(): number {
    return this._igvItfPct;
  }

  set igvItfPct(value: number) {
    this._igvItfPct = value;
  }

  get notaryCostAmount(): number {
    return this._notaryCostAmount;
  }

  set notaryCostAmount(value: number) {
    this._notaryCostAmount = value;
  }

  get registryCostAmount(): number {
    return this._registryCostAmount;
  }

  set registryCostAmount(value: number) {
    this._registryCostAmount = value;
  }

  get appraisalCostAmount(): number {
    return this._appraisalCostAmount;
  }

  set appraisalCostAmount(value: number) {
    this._appraisalCostAmount = value;
  }

  get studyCommissionAmount(): number {
    return this._studyCommissionAmount;
  }

  set studyCommissionAmount(value: number) {
    this._studyCommissionAmount = value;
  }

  get activationCommissionAmount(): number {
    return this._activationCommissionAmount;
  }

  set activationCommissionAmount(value: number) {
    this._activationCommissionAmount = value;
  }

  get discountAnnualRatePct(): number {
    return this._discountAnnualRatePct;
  }

  set discountAnnualRatePct(value: number) {
    this._discountAnnualRatePct = value;
  }
}
