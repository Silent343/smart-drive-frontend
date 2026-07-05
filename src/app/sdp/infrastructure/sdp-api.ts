import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';
import { CreditConfig } from '../domain/model/credit-config';
import { Loan } from '../domain/model/loan';
import { ScheduleRow } from '../domain/model/schedule-row';
import { LoanReport } from '../domain/model/loan-report';

import { CreditConfigApiEndpoint } from './credit-config-api-endpoint';
import { LoanApiEndpoint } from './loan-api-endpoint';
import { ScheduleRowApiEndpoint } from './schedule-row-api-endpoint';
import { LoanReportApiEndpoint } from './loan-report-api-endpoint';

import { environment } from '../../../environments/environment';
import { LoanAssembler } from './loan-assembler';
import { LoanResource } from './loan-response';

/**
 * Infrastructure facade for the SDP bounded context.
 */
@Injectable({ providedIn: 'root' })
export class SdpApi extends BaseApi {
  private readonly creditConfigEndpoint: CreditConfigApiEndpoint;
  private readonly loanEndpoint: LoanApiEndpoint;

  constructor(private http: HttpClient) {
    super();
    // Instanciamos los endpoints generales
    this.creditConfigEndpoint = new CreditConfigApiEndpoint(http);
    this.loanEndpoint = new LoanApiEndpoint(http);
  }

  // ==========================================
  // CREDIT CONFIG OPERATIONS
  // ==========================================

  getCreditConfigs(): Observable<CreditConfig[]> {
    return this.creditConfigEndpoint.getAll();
  }

  getCreditConfigById(id: string): Observable<CreditConfig> {
    return this.creditConfigEndpoint.getById(id);
  }

  createCreditConfig(config: Omit<CreditConfig, 'id'>): Observable<CreditConfig> {
    return this.creditConfigEndpoint.create(<CreditConfig>config);
  }

  updateCreditConfig(config: CreditConfig): Observable<CreditConfig> {
    return this.creditConfigEndpoint.update(config, config.id);
  }

  // ==========================================
  // LOAN OPERATIONS
  // ==========================================

  getLoanById(id: string): Observable<Loan> {
    return this.loanEndpoint.getById(id);
  }

  getConfirmedLoans(): Observable<Loan[]> {
    const assembler = new LoanAssembler();
    const url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderLoansEndpointPath}/confirmed`;
    return this.http
      .get<LoanResource[]>(url)
      .pipe(map(resources => resources.map(resource => assembler.toEntityFromResource(resource))));
  }

  /** Persiste el préstamo una vez confirmado */
  createLoan(loan: Omit<Loan, 'id'>): Observable<Loan> {
    return this.loanEndpoint.create(<Loan>loan);
  }

  /** Simula sin persistir — útil para la vista Simulación */
  simulateLoan(loan: Loan): Observable<Loan> {
    // Como esta es una ruta especial (/simulate) que no cumple con el estándar estricto
    // de CRUD de BaseApiEndpoint, utilizamos HttpClient directamente con nuestro assembler instanciado.
    const assembler = new LoanAssembler();
    const simulateUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderLoansEndpointPath}/simulate`;

    return this.http
      .post<LoanResource>(simulateUrl, assembler.toResourceFromEntity(loan))
      .pipe(map(resource => assembler.toEntityFromResource(resource)));
  }

  // ==========================================
  // SCHEDULE OPERATIONS
  // ==========================================

  getScheduleByLoan(loanId: string): Observable<ScheduleRow[]> {
    // Se instancia dinámicamente porque la URL requiere el loanId en su path
    const scheduleEndpoint = new ScheduleRowApiEndpoint(this.http, loanId);
    return scheduleEndpoint.getAll();
  }

  // ==========================================
  // REPORT OPERATIONS
  // ==========================================

  getReportByLoan(loanId: string): Observable<LoanReport> {
    // Se instancia dinámicamente porque la URL requiere el loanId en su path
    const reportEndpoint = new LoanReportApiEndpoint(this.http, loanId);

    // Asumiendo que tu método 'getAll()' del BaseApiEndpoint devuelve un Array basado
    // en la interfaz LoanReportResponse, extraemos el primer elemento con un pipe(map).
    return reportEndpoint.getAll().pipe(map(reports => reports[0]));
  }
}
