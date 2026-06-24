import {Loan} from './loan';
import {CreditConfig} from './credit-config';
import {ScheduleRow} from './schedule-row';
import {config} from 'rxjs';

export class LoanReport {
  private _id!: string;
  private _loan!: Loan;
  private _config!: CreditConfig;
  private _schedule!: ScheduleRow[];

  get totalCostCredit(): number {
    return this._loan.ctc;
  }

  get tceaFormatted(): string {
    return (this._loan.tcea * 100).toFixed(4) + '%';
  }


  constructor(props:{
    id: string,loan: Loan, config: CreditConfig, schedule: ScheduleRow[]
  }) {
    this._id = props.id;
    this._loan = props.loan;
    this._config = props.config;
    this._schedule = props.schedule;
  }


  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get loan(): Loan {
    return this._loan;
  }

  set loan(value: Loan) {
    this._loan = value;
  }

  get config(): CreditConfig {
    return this._config;
  }

  set config(value: CreditConfig) {
    this._config = value;
  }

  get schedule(): ScheduleRow[] {
    return this._schedule;
  }

  set schedule(value: ScheduleRow[]) {
    this._schedule = value;
  }
}
