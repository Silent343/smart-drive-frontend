import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { LoanReport } from '../domain/model/loan-report';
import { LoanReportResource, LoanReportResponse } from './loan-report-response';
import { LoanAssembler } from './loan-assembler';
import { ScheduleRowAssembler } from './schedule-row-assembler';
import { CreditConfigAssembler } from './credit-config-assembler';

export class LoanReportAssembler
  implements BaseAssembler<LoanReport, LoanReportResource, LoanReportResponse>
{
  private loanAssembler = new LoanAssembler();
  private configAssembler = new CreditConfigAssembler();
  private scheduleRowAssembler = new ScheduleRowAssembler();

  toEntityFromResource(resource: LoanReportResource): LoanReport {
    return new LoanReport({
      id: resource.id,
      loan: this.loanAssembler.toEntityFromResource(resource.loan),
      config: this.configAssembler.toEntityFromResource(resource.config),
      schedule: resource.schedule.map((row) =>
        this.scheduleRowAssembler.toEntityFromResource(row)
      ),
    });
  }

  toResourceFromEntity(entity: LoanReport): LoanReportResource {
    return {
      id: entity.id,
      loan: this.loanAssembler.toResourceFromEntity(entity.loan),
      config: this.configAssembler.toResourceFromEntity(entity.config),
      schedule: entity.schedule.map((row) => this.scheduleRowAssembler.toResourceFromEntity(row))
    };
  }

  toEntitiesFromResponse(response: LoanReportResponse): LoanReport[] {
    return (response.loanReports ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
