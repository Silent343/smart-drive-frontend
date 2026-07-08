import { Injectable, computed, signal } from '@angular/core';

import { CreditConfig } from '../domain/model/credit-config';
import { Loan } from '../domain/model/loan';
import { ScheduleRow } from '../domain/model/schedule-row';
import { LoanReport } from '../domain/model/loan-report';
import { SdpApi } from '../infrastructure/sdp-api';
import {Observable, tap} from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { amountFromPen } from './currency-conversion';

// ─── French Amortization Utilities ───────────────────────────────────────────

function calcTEM(config: CreditConfig): number {
  return Math.pow(1 + config.effectiveAnnualRate / 100, 1 / 12) - 1;
}

/**
 * Calculates all loan indicators using the ordinary expired French method
 * (30 days/month) supporting partial and total grace periods.
 * Returns the Loan with financial fields populated.
 */
function calculateFrench(loan: Loan, config: CreditConfig): {
  updatedLoan: Loan;
  schedule: ScheduleRow[];
} {
  const tem   = calcTEM(config);
  const n     = loan.installmentsQty;
  const mg    = config.gracePeriodMonths;
  const tg    = config.gracePeriodType;
  const insPct = config.insuranceRatePct / 100;
  const riskInsPct = config.riskInsuranceRatePct / 100;
  const postage = config.postageFeeAmount;
  const comPct = config.administrationFeePct / 100;
  const gps = config.gpsFeeAmount;
  const taxPct = config.igvItfPct / 100;
  const residualValue = loan.vehiclePrice * (config.finalInstallmentPct / 100);
  const initialCosts =
    config.notaryCostAmount +
    config.registryCostAmount +
    config.appraisalCostAmount +
    config.studyCommissionAmount +
    config.activationCommissionAmount;

  // Base French installment (only for months that amortize)
  const nAmort   = n - (tg !== 'none' ? mg : 0);
  const baseInstallment = nAmort > 0
    ? loan.loanAmount * tem / (1 - Math.pow(1 + tem, -nAmort))
    : 0;

  let balance = loan.loanAmount;
  let totalInterest    = 0;
  let totalInsurance   = 0;
  let totalRiskInsurance = 0;
  let totalGps = 0;
  let totalPostage     = 0;
  let totalCommission  = 0;
  let totalTax = 0;
  const schedule: ScheduleRow[] = [];

  // IRR: debtor's cash flows (negative at the beginning = capital received)
  const cashFlows: number[] = [-loan.loanAmount];

  for (let i = 1; i <= n; i++) {
    const openingBalance = balance;

    const interest  = balance * tem;
    const insurance = balance * insPct;
    const riskInsurance = balance * riskInsPct;
    const commission = balance * comPct;
    let   amortization = 0;
    let   installment  = 0;
    const gracePeriodType = i <= mg && tg !== 'none' ? tg : 'none';

    if (gracePeriodType === 'total') {
      // Pays nothing, interest is capitalized
      amortization = 0;
      installment = 0;
      balance += interest;
    } else if (gracePeriodType === 'partial') {
      // Only pays interest, does not amortize capital
      amortization = 0;
      installment = interest;
    } else {
      amortization = baseInstallment - interest;
      installment = baseInstallment;
    }

    const taxableBase = interest + insurance + riskInsurance + postage + commission + gps;
    const tax = taxableBase * taxPct;
    const totalInstallment = installment + insurance + riskInsurance + postage + commission + gps + tax;
    balance -= amortization;
    if (balance < 0.001) balance = 0;

    totalInterest   += interest;
    totalInsurance  += insurance;
    totalRiskInsurance += riskInsurance;
    totalGps += gps;
    totalPostage    += postage;
    totalCommission += commission;
    totalTax += tax;
    cashFlows.push(totalInstallment);

    schedule.push(new ScheduleRow({
      id:              `row-${i}`,
      loanId:          loan.id || 'pending',
      installmentNo:   i,
      paymentDate:     addMonths(loan.startDate, i),
      openingBalance,
      interest,
      amortization,
      insurance,
      postage,
      commission,
      monthlyPayment:  totalInstallment,
      endingBalance:   Math.max(0, balance),
      gracePeriodType,
    }));
  }

  const ctc  = totalInterest + totalInsurance + totalRiskInsurance + totalGps + totalPostage + totalCommission + totalTax + initialCosts;
  const tcea = Math.pow(1 + tem, 12) - 1;
  const trea = config.discountAnnualRatePct > 0 ? config.discountAnnualRatePct / 100 : tcea;
  const npv  = cashFlows.reduce((acc, f, t) => acc + f / Math.pow(1 + tem, t), 0);
  const irr  = calcIRR(cashFlows);

  const updatedLoan = new Loan({
    id:              loan.id,
    carId:           loan.carId,
    clientId:        loan.clientId,
    configId:        loan.configId,
    initialFee:      loan.initialFee,
    vehiclePrice:    loan.vehiclePrice,
    loanAmount:      loan.loanAmount,
    installmentsQty: loan.installmentsQty,
    startDate:       loan.startDate,
    fixedInstallment: baseInstallment,
    tcea,
    npvDebtor:       npv,
    irrDebtor:       irr,
    totalInterest,
    totalInsurance,
    totalRiskInsurance,
    totalGps,
    totalPostage,
    totalCommission,
    totalTax,
    initialCosts,
    residualValue,
    trea,
    ctc,
    vehicles: loan.vehicles,
  });

  return { updatedLoan, schedule };
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Newton-Raphson for monthly IRR */
function calcIRR(cashFlows: number[], guess = 0.01): number {
  let rate = guess;
  for (let iter = 0; iter < 100; iter++) {
    let f  = 0, df = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      f  += cashFlows[t] / Math.pow(1 + rate, t);
      df -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }
    const newRate = rate - f / df;
    if (Math.abs(newRate - rate) < 1e-8) return newRate;
    rate = newRate;
  }
  return rate;
}

// ─── Store ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SdpStore {

  // Private signals
  private readonly creditConfigsSignal  = signal<CreditConfig[]>([]);
  private readonly activeCreditConfigSignal = signal<CreditConfig | null>(null);
  private readonly currentLoanSignal    = signal<Loan | null>(null);
  private readonly currentScheduleSignal = signal<ScheduleRow[]>([]);
  private readonly currentReportSignal  = signal<LoanReport | null>(null);
  private readonly errorSignal          = signal<string | null>(null);
  private readonly isLoadingSignal      = signal<boolean>(false);

  // Flow data that persists between tabs
  private readonly flowClientIdSignal   = signal<string>('');
  private readonly flowCarIdSignal      = signal<string>('');
  private readonly flowClientNameSignal = signal<string>('');
  private readonly flowCarNameSignal    = signal<string>('');
  /**
   * Multi-vehicle: all vehicles picked for the current credit. Each entry keeps the vehicle id,
   * a display label and its price so the config can show subtotals and a running total, and the
   * confirmation can send the full list. The legacy flowCarId/Name mirror the first vehicle for
   * the parts of the flow that still assume a single car.
   */
  private readonly flowVehiclesSignal   = signal<{ id: string; label: string; price: number }[]>([]);

  // Public signals
  readonly creditConfigs      = this.creditConfigsSignal.asReadonly();
  readonly activeCreditConfig = this.activeCreditConfigSignal.asReadonly();
  readonly currentLoan        = this.currentLoanSignal.asReadonly();
  readonly currentSchedule    = this.currentScheduleSignal.asReadonly();
  readonly currentReport      = this.currentReportSignal.asReadonly();
  readonly error              = this.errorSignal.asReadonly();
  readonly isLoading          = this.isLoadingSignal.asReadonly();

  // Flow data
  readonly flowClientId   = this.flowClientIdSignal.asReadonly();
  readonly flowCarId      = this.flowCarIdSignal.asReadonly();
  readonly flowClientName = this.flowClientNameSignal.asReadonly();
  readonly flowCarName    = this.flowCarNameSignal.asReadonly();
  readonly flowVehicles   = this.flowVehiclesSignal.asReadonly();
  /** Sum of the prices of all vehicles picked for the credit. */
  readonly flowVehiclesTotal = computed(() =>
    this.flowVehiclesSignal().reduce((sum, v) => sum + v.price, 0));

  constructor(private sdpApi: SdpApi, private iamStore: IamStore) {}

  // ── CREDIT CONFIG ───────────────────────────────────────────────────────────

  loadCreditConfigs(): void {
    this.isLoadingSignal.set(true);
    this.sdpApi.getCreditConfigs().subscribe({
      next: (configs) => {
        this.creditConfigsSignal.set(configs);
        // Restores active config if one was already saved
        if (!this.activeCreditConfigSignal() && configs.length > 0) {
          this.activeCreditConfigSignal.set(configs[configs.length - 1]);
        }
        this.isLoadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set('Error loading configurations');
        this.isLoadingSignal.set(false);
      },
    });
  }

  createCreditConfig(config: CreditConfig): Observable<CreditConfig> {
    this.isLoadingSignal.set(true);
    return this.sdpApi.createCreditConfig(config).pipe(
      tap((saved) => {
        this.creditConfigsSignal.update(list => [...list, saved]);
        this.activeCreditConfigSignal.set(saved);
        this.isLoadingSignal.set(false);
      }),
    );
  }

  updateCreditConfig(config: CreditConfig): Observable<CreditConfig> {
    this.isLoadingSignal.set(true);
    return this.sdpApi.updateCreditConfig(config).pipe(
      tap((updated) => {
        this.creditConfigsSignal.update(list =>
          list.map(c => c.id === updated.id ? updated : c)
        );
        this.activeCreditConfigSignal.set(updated);
        this.isLoadingSignal.set(false);
      }),
    );
  }

  // ── FLOW: client and vehicle data ──────────────────────────────────────────

  setFlowClient(id: string, name: string): void {
    this.flowClientIdSignal.set(id);
    this.flowClientNameSignal.set(name);
  }

  setFlowCar(id: string, name: string): void {
    this.flowCarIdSignal.set(id);
    this.flowCarNameSignal.set(name);
  }

  /**
   * Adds a vehicle to the current credit. Ignores duplicates (the same vehicle can't be financed
   * twice in one credit) and keeps the legacy single-car signals pointed at the first vehicle.
   * Returns false when the vehicle was already in the list.
   */
  addFlowVehicle(vehicle: { id: string; label: string; price: number }): boolean {
    const current = this.flowVehiclesSignal();
    if (current.some(v => v.id === vehicle.id)) return false;
    const updated = [...current, vehicle];
    this.flowVehiclesSignal.set(updated);
    this.flowCarIdSignal.set(updated[0].id);
    this.flowCarNameSignal.set(updated[0].label);
    return true;
  }

  /** Removes a vehicle from the current credit and refreshes the single-car mirror. */
  removeFlowVehicle(id: string): void {
    const updated = this.flowVehiclesSignal().filter(v => v.id !== id);
    this.flowVehiclesSignal.set(updated);
    this.flowCarIdSignal.set(updated.length ? updated[0].id : '');
    this.flowCarNameSignal.set(updated.length ? updated[0].label : '');
  }

  /** Clears all vehicles picked for the current credit. */
  clearFlowVehicles(): void {
    this.flowVehiclesSignal.set([]);
    this.flowCarIdSignal.set('');
    this.flowCarNameSignal.set('');
  }

  // ── LOCAL SIMULATION → persist as Loan ─────────────────────────────────────

  /**
   * Calculates the payment schedule locally (no round-trip to the backend)
   * and updates the currentLoan + currentSchedule signals instantly.
   * Then persists the Loan in the loans table of db.json.
   */
  simulateAndSave(
    vehiclePrice: number,
    initialFee: number,
    installmentsQty: number,
    startDate: Date,
  ): void {
    const config = this.activeCreditConfigSignal();
    if (!config) {
      this.errorSignal.set('Please complete the configuration first');
      return;
    }

    const loanAmount = vehiclePrice - initialFee;
    if (loanAmount <= 0) return;
    const vehiclesInLoanCurrency = this.flowVehiclesSignal()
      .map(v => ({ carId: v.id, price: amountFromPen(v.price, config.currency) }));

    // 1. Build base loan with input data
    const baseLoan = new Loan({
      id:               '',
      carId:            this.flowCarIdSignal(),
      clientId:         this.flowClientIdSignal(),
      configId:         config.id,
      sellerId:         this.iamStore.currentUserId() ?? '',
      sellerName:       this.iamStore.currentFullName() ?? '',
      initialFee,
      vehiclePrice,
      loanAmount,
      installmentsQty,
      startDate,
      fixedInstallment: 0,
      npvDebtor:        0,
      irrDebtor:        0,
      tcea:             0,
      totalInterest:    0,
      totalInsurance:   0,
      totalRiskInsurance: 0,
      totalGps:         0,
      totalPostage:     0,
      totalCommission:  0,
      totalTax:         0,
      initialCosts:     0,
      residualValue:    0,
      trea:             0,
      ctc:              0,
      vehicles: vehiclesInLoanCurrency,
    });

    // 2. Calculate locally (immediate, without waiting for backend)
    const { updatedLoan, schedule } = calculateFrench(baseLoan, config);
    this.currentLoanSignal.set(updatedLoan);
    this.currentScheduleSignal.set(schedule);

    // The confirmed loan is persisted only from the report page.
  }

  confirmCurrentLoan(): Observable<Loan> {
    const loan = this.currentLoanSignal();
    if (!loan) {
      throw new Error('No current loan to confirm');
    }

    const confirmedLoan = new Loan({
      id: loan.id && !loan.id.startsWith('pending') ? loan.id : '',
      carId: loan.carId,
      clientId: loan.clientId,
      configId: loan.configId,
      sellerId: loan.sellerId || this.iamStore.currentUserId() || '',
      sellerName: loan.sellerName || this.iamStore.currentFullName() || '',
      status: 'CONFIRMED',
      initialFee: loan.initialFee,
      vehiclePrice: loan.vehiclePrice,
      loanAmount: loan.loanAmount,
      installmentsQty: loan.installmentsQty,
      startDate: loan.startDate,
      fixedInstallment: loan.fixedInstallment,
      npvDebtor: loan.npvDebtor,
      irrDebtor: loan.irrDebtor,
      tcea: loan.tcea,
      trea: loan.trea,
      totalInterest: loan.totalInterest,
      totalInsurance: loan.totalInsurance,
      totalRiskInsurance: loan.totalRiskInsurance,
      totalGps: loan.totalGps,
      totalPostage: loan.totalPostage,
      totalCommission: loan.totalCommission,
      totalTax: loan.totalTax,
      initialCosts: loan.initialCosts,
      residualValue: loan.residualValue,
      ctc: loan.ctc,
      // Multi-vehicle: send the full list picked in the config (falls back to the single car).
      vehicles: this.flowVehiclesSignal().length
        ? this.flowVehiclesSignal().map(v => ({ carId: v.id, price: amountFromPen(v.price, this.activeCreditConfigSignal()?.currency ?? 'PEN') }))
        : (loan.carId ? [{ carId: loan.carId, price: loan.vehiclePrice }] : []),
    });

    return this.sdpApi.createLoan(confirmedLoan).pipe(
      tap((savedLoan) => {
        this.currentLoanSignal.set(savedLoan);
      }),
    );
  }

  // ── SCHEDULE ────────────────────────────────────────────────────────────────

  loadScheduleByLoan(loanId: string): void {
    // If we already have the schedule calculated locally, no need to call backend
    if (this.currentScheduleSignal().length > 0) return;

    this.isLoadingSignal.set(true);
    this.sdpApi.getScheduleByLoan(loanId).subscribe({
      next: (schedule) => {
        this.currentScheduleSignal.set(schedule);
        this.isLoadingSignal.set(false);
      },
      error: () => {
        this.errorSignal.set('Error loading schedule');
        this.isLoadingSignal.set(false);
      },
    });
  }

  // ── REPORT ──────────────────────────────────────────────────────────────────

  loadReportByLoan(loanId: string): void {
    // If we already have the data, we build the report locally
    const loan     = this.currentLoanSignal();
    const config   = this.activeCreditConfigSignal();
    const schedule = this.currentScheduleSignal();

    if (loan && config && schedule.length > 0) {
      this.currentReportSignal.set(new LoanReport({
        id: `report-${loan.id}`, // Add this required property
        loan,
        config,
        schedule
      }));
      return;
    }

    this.isLoadingSignal.set(true);
    this.sdpApi.getReportByLoan(loanId).subscribe({
      next: (report) => {
        this.currentReportSignal.set(report);
        this.isLoadingSignal.set(false);
      },
      error: () => {
        this.errorSignal.set('Error loading report');
        this.isLoadingSignal.set(false);
      },
    });
  }

  // ── RESET ────────────────────────────────────────────────────────────────────

  clearCurrentLoanData(): void {
    this.currentLoanSignal.set(null);
    this.currentScheduleSignal.set([]);
    this.currentReportSignal.set(null);
    this.errorSignal.set(null);
  }

  clearAll(): void {
    this.clearCurrentLoanData();
    this.activeCreditConfigSignal.set(null);
    this.flowClientIdSignal.set('');
    this.flowCarIdSignal.set('');
    this.flowClientNameSignal.set('');
    this.flowCarNameSignal.set('');
    this.clearFlowVehicles();
  }
}
