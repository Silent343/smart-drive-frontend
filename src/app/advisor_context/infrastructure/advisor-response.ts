import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Request body sent to the advisor endpoint: the user's question plus the id
 * of the loan it is about. The backend loads the loan's real figures to ground
 * the answer.
 */
export interface AdvisorAskResource {
  /** The id of the loan the question is about. */
  loan_id: string;
  /** The user's natural-language question. */
  question: string;
  /** Prior turns, so the assistant has conversational context. */
  history: AdvisorHistoryItem[];
}

/**
 * A prior conversation turn sent for context (snake_case to match the API).
 */
export interface AdvisorHistoryItem {
  /** 'user' or 'assistant'. */
  role: string;
  /** The message text. */
  content: string;
}

/**
 * Resource form of an advisor answer as returned by the API.
 */
export interface AdvisorAnswerResource extends BaseResource {
  id: string;
  answer: string;
  used_figures: string[];
}

/**
 * Wrapped response shape (kept for consistency with other endpoints).
 */
export interface AdvisorAnswerResponse extends BaseResponse {
  answers: AdvisorAnswerResource[];
}
