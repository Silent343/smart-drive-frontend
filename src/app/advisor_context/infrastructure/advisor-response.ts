import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Request body sent to the advisor endpoint: the user's question plus the loan
 * it is about. The loan can be referenced by `loan_id` (a confirmed loan whose
 * figures the backend loads) or by inline `figures` (a simulated loan that has
 * not been saved yet, so it has no id). One of the two must be present.
 */
export interface AdvisorAskResource {
  /** The id of the confirmed loan, or `null` when asking about a simulation. */
  loan_id: string | null;
  /** Inline figures of the simulated loan, sent when there is no `loan_id`. */
  figures?: AdvisorFiguresResource;
  /** The user's natural-language question. */
  question: string;
  /** Prior turns, so the assistant has conversational context. */
  history: AdvisorHistoryItem[];
}

/**
 * Inline figures of a simulated loan (snake_case to match the API).
 *
 * Amounts are in the loan's currency; `tcea_pct` and `irr_debtor_pct` are
 * already percentages (e.g. `18.25`), not fractions.
 */
export interface AdvisorFiguresResource {
  currency_symbol: string;
  vehicle_price: number;
  initial_fee: number;
  loan_amount: number;
  installments_qty: number;
  fixed_installment: number;
  tcea_pct: number;
  total_interest: number;
  total_insurance: number;
  total_postage: number;
  total_commission: number;
  ctc: number;
  npv_debtor: number;
  irr_debtor_pct: number;
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
