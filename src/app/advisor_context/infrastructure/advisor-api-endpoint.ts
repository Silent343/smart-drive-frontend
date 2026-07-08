import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdvisorAnswer } from '../domain/model/advisor-answer';
import { ChatMessage } from '../domain/model/chat-message';
import { AdvisorAssembler } from './advisor-assembler';
import {
  AdvisorAnswerResource,
  AdvisorAskResource,
  AdvisorFiguresResource,
  AdvisorHistoryItem,
} from './advisor-response';

/**
 * HTTP client for the loan advisor endpoint.
 *
 * Mirrors the project's endpoint convention but exposes a single `ask`
 * operation, since the advisor is a request/response resource rather than CRUD.
 */
export class AdvisorApiEndpoint {
  private readonly assembler = new AdvisorAssembler();

  /**
   * @param http - The Angular HTTP client.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Sends a question about a loan and returns the grounded answer.
   *
   * <p>Pass a `loanId` for a confirmed loan, or `figures` for a simulated loan
   * that has not been saved yet. Sending both lets the backend prefer the
   * persisted loan and fall back to the figures if the id resolves to nothing.</p>
   *
   * @param loanId - The id of the confirmed loan, or `null` in simulation.
   * @param question - The user's question.
   * @param history - Prior conversation turns for context.
   * @param figures - Inline figures of the simulated loan, when there is no id.
   * @returns An observable of the {@link AdvisorAnswer}.
   */
  ask(
    loanId: string | null,
    question: string,
    history: ChatMessage[],
    figures?: AdvisorFiguresResource,
  ): Observable<AdvisorAnswer> {
    const url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderAdvisorAskEndpointPath}`;

    const body: AdvisorAskResource = {
      loan_id: loanId,
      question,
      history: history.map(
        (message): AdvisorHistoryItem => ({
          role: message.role,
          content: message.content,
        }),
      ),
    };
    if (figures) {
      body.figures = figures;
    }

    return this.http.post<AdvisorAnswerResource>(url, body).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to get an answer from the advisor')),
    );
  }

  /**
   * Produces an RxJS error handler that normalizes HTTP errors.
   *
   * @param operation - A label describing the failed operation.
   * @returns A function mapping an {@link HttpErrorResponse} to a thrown error.
   */
  private handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      let message = operation;
      if (error.status === 404) {
        message = `${operation}: Resource not found`;
      } else if (error.error instanceof ErrorEvent) {
        message = `${operation}: ${error.error.message}`;
      } else {
        message = `${operation}: ${error.status || 'Unexpected error'}`;
      }
      return throwError(() => new Error(message));
    };
  }
}
