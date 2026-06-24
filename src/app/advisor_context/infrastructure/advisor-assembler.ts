import { AdvisorAnswer } from '../domain/model/advisor-answer';
import { AdvisorAnswerResource } from './advisor-response';

/**
 * Translates advisor answer resources (wire format) into domain entities.
 *
 * The advisor endpoint is request/response rather than CRUD, so this assembler
 * only implements the resource→entity direction the UI needs.
 */
export class AdvisorAssembler {
  /**
   * Maps an answer resource from the API into a domain {@link AdvisorAnswer}.
   *
   * @param resource - The wire resource.
   * @returns The domain entity.
   */
  toEntityFromResource(resource: AdvisorAnswerResource): AdvisorAnswer {
    return {
      id: resource.id,
      answer: resource.answer,
      usedFigures: resource.used_figures ?? [],
    };
  }
}
