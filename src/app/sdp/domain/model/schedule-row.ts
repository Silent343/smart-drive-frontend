import {GracePeriodType} from './credit-config';
import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class ScheduleRow implements BaseEntity{
  private _id!: string;
  private _loanId!: string;
  private _installmentNo!: number;
  private _paymentDate!: Date;
  private _openingBalance!: number;        // saldo al inicio del período
  private _interest!: number;
  private _amortization!: number;
  private _insurance!: number;
  private _postage!: number;
  private _commission!: number;
  private _monthlyPayment!: number;        // cuota total del mes
  private _endingBalance!: number;         // saldo al cierre
  private _gracePeriodType!: GracePeriodType;  // tipo de gracia aplicado ese mes


  constructor(props: {
    id: string, loanId: string, installmentNo: number, paymentDate: Date, openingBalance: number, interest: number, amortization: number, insurance: number, postage: number, commission: number, monthlyPayment: number, endingBalance: number, gracePeriodType: GracePeriodType
  }) {
    this._id = props.id;
    this._loanId = props.loanId;
    this._installmentNo = props.installmentNo;
    this._paymentDate = props.paymentDate;
    this._openingBalance = props.openingBalance;
    this._interest = props.interest;
    this._amortization = props.amortization;
    this._insurance = props.insurance;
    this._postage = props.postage;
    this._commission = props.commission;
    this._monthlyPayment = props.monthlyPayment;
    this._endingBalance = props.endingBalance;
    this._gracePeriodType = props.gracePeriodType;
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get loanId(): string {
    return this._loanId;
  }

  set loanId(value: string) {
    this._loanId = value;
  }

  get installmentNo(): number {
    return this._installmentNo;
  }

  set installmentNo(value: number) {
    this._installmentNo = value;
  }

  get paymentDate(): Date {
    return this._paymentDate;
  }

  set paymentDate(value: Date) {
    this._paymentDate = value;
  }

  get openingBalance(): number {
    return this._openingBalance;
  }

  set openingBalance(value: number) {
    this._openingBalance = value;
  }

  get interest(): number {
    return this._interest;
  }

  set interest(value: number) {
    this._interest = value;
  }

  get amortization(): number {
    return this._amortization;
  }

  set amortization(value: number) {
    this._amortization = value;
  }

  get insurance(): number {
    return this._insurance;
  }

  set insurance(value: number) {
    this._insurance = value;
  }

  get postage(): number {
    return this._postage;
  }

  set postage(value: number) {
    this._postage = value;
  }

  get commission(): number {
    return this._commission;
  }

  set commission(value: number) {
    this._commission = value;
  }

  get monthlyPayment(): number {
    return this._monthlyPayment;
  }

  set monthlyPayment(value: number) {
    this._monthlyPayment = value;
  }

  get endingBalance(): number {
    return this._endingBalance;
  }

  set endingBalance(value: number) {
    this._endingBalance = value;
  }

  get gracePeriodType(): GracePeriodType {
    return this._gracePeriodType;
  }

  set gracePeriodType(value: GracePeriodType) {
    this._gracePeriodType = value;
  }
}
