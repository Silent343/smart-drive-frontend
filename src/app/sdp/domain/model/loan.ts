import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class Loan implements BaseEntity {
  private _id!: string;
  private _carId!: string;                 // FK → vehicle-entity (bounded ARM)
  private _clientId!: string;              // FK → client-entity  (bounded ARM)
  private _configId!: string;              // FK → CreditConfig
  private _initialFee!: number;            // cuota inicial (down payment)
  private _vehiclePrice!: number;          // precio del vehículo
  private _loanAmount!: number;            // vehiclePrice - initialFee
  private _installmentsQty!: number;       // plazo en meses
  private _startDate!: Date;

  // Resultados calculados (se persisten tras simulación)
  private _fixedInstallment!: number;      // cuota base francesa (sin extras)
  private _npvDebtor!: number;             // VAN desde perspectiva del deudor
  private _irrDebtor!: number;             // TIR mensual del deudor
  private _tcea!: number;                  // Tasa de costo efectivo anual (SBS)
  private _totalInterest!: number;
  private _totalInsurance!: number;
  private _totalPostage!: number;
  private _totalCommission!: number;
  private _ctc!: number;                   // Costo total del crédito


  constructor(props:{
    id: string, carId: string, clientId: string, configId: string,
    initialFee: number, vehiclePrice: number, loanAmount: number,
    installmentsQty: number, startDate: Date, fixedInstallment: number,
    npvDebtor: number, irrDebtor: number, tcea: number, totalInterest: number,
    totalInsurance: number, totalPostage: number, totalCommission: number,
    ctc: number
  }) {
    this._id = props.id;
    this._carId = props.carId;
    this._clientId = props.clientId;
    this._configId = props.configId;
    this._initialFee = props.initialFee;
    this._vehiclePrice = props.vehiclePrice;
    this._loanAmount = props.loanAmount;
    this._installmentsQty = props.installmentsQty;
    this._startDate = props.startDate;
    this._fixedInstallment = props.fixedInstallment;
    this._npvDebtor = props.npvDebtor;
    this._irrDebtor = props.irrDebtor;
    this._tcea = props.tcea;
    this._totalInterest = props.totalInterest;
    this._totalInsurance = props.totalInsurance;
    this._totalPostage = props.totalPostage;
    this._totalCommission = props.totalCommission;
    this._ctc = props.ctc;
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get carId(): string {
    return this._carId;
  }

  set carId(value: string) {
    this._carId = value;
  }

  get clientId(): string {
    return this._clientId;
  }

  set clientId(value: string) {
    this._clientId = value;
  }

  get configId(): string {
    return this._configId;
  }

  set configId(value: string) {
    this._configId = value;
  }

  get initialFee(): number {
    return this._initialFee;
  }

  set initialFee(value: number) {
    this._initialFee = value;
  }

  get vehiclePrice(): number {
    return this._vehiclePrice;
  }

  set vehiclePrice(value: number) {
    this._vehiclePrice = value;
  }

  get loanAmount(): number {
    return this._loanAmount;
  }

  set loanAmount(value: number) {
    this._loanAmount = value;
  }

  get installmentsQty(): number {
    return this._installmentsQty;
  }

  set installmentsQty(value: number) {
    this._installmentsQty = value;
  }

  get startDate(): Date {
    return this._startDate;
  }

  set startDate(value: Date) {
    this._startDate = value;
  }

  get fixedInstallment(): number {
    return this._fixedInstallment;
  }

  set fixedInstallment(value: number) {
    this._fixedInstallment = value;
  }

  get npvDebtor(): number {
    return this._npvDebtor;
  }

  set npvDebtor(value: number) {
    this._npvDebtor = value;
  }

  get irrDebtor(): number {
    return this._irrDebtor;
  }

  set irrDebtor(value: number) {
    this._irrDebtor = value;
  }

  get tcea(): number {
    return this._tcea;
  }

  set tcea(value: number) {
    this._tcea = value;
  }

  get totalInterest(): number {
    return this._totalInterest;
  }

  set totalInterest(value: number) {
    this._totalInterest = value;
  }

  get totalInsurance(): number {
    return this._totalInsurance;
  }

  set totalInsurance(value: number) {
    this._totalInsurance = value;
  }

  get totalPostage(): number {
    return this._totalPostage;
  }

  set totalPostage(value: number) {
    this._totalPostage = value;
  }

  get totalCommission(): number {
    return this._totalCommission;
  }

  set totalCommission(value: number) {
    this._totalCommission = value;
  }

  get ctc(): number {
    return this._ctc;
  }

  set ctc(value: number) {
    this._ctc = value;
  }
}
