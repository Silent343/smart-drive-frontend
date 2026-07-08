import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';
import { AdvisorAnswer } from '../domain/model/advisor-answer';
import { ChatMessage } from '../domain/model/chat-message';
import { AdvisorApiEndpoint } from './advisor-api-endpoint';
import { AdvisorFiguresResource } from './advisor-response';

/**
 * Coarse-grained infrastructure facade for the advisor bounded context.
 *
 * Follows the project convention of one `*Api` per context that wraps the
 * endpoint clients and is consumed by the application store.
 */
@Injectable({ providedIn: 'root' })
export class AdvisorApi extends BaseApi {
  private readonly advisorEndpoint: AdvisorApiEndpoint;

  /**
   * @param http - The Angular HTTP client.
   */
  constructor(http: HttpClient) {
    super();
    this.advisorEndpoint = new AdvisorApiEndpoint(http);
  }

  /**
   * Asks the advisor a question about a loan.
   *
   * @param loanId - The id of the confirmed loan, or `null` in simulation.
   * @param question - The user's question.
   * @param history - Prior conversation turns.
   * @param figures - Inline figures of the simulated loan, when there is no id.
   * @returns An observable of the grounded {@link AdvisorAnswer}.
   */
  ask(
    loanId: string | null,
    question: string,
    history: ChatMessage[],
    figures?: AdvisorFiguresResource,
  ): Observable<AdvisorAnswer> {
    return this.advisorEndpoint.ask(loanId, question, history, figures);
  }
}
