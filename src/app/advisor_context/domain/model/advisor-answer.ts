import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * The assistant's answer to a question about a loan.
 *
 * The backend grounds the answer in the loan's real financial figures, so the
 * `usedFigures` list lets the UI show which numbers informed the response.
 */
export interface AdvisorAnswer extends BaseEntity {
  /** Stable id of the answer. */
  id: string;
  /** The natural-language answer. */
  answer: string;
  /** Human-readable labels of the loan figures used to ground the answer. */
  usedFigures: string[];
}
