import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { ScheduleRow } from '../domain/model/schedule-row';
import {ScheduleRowResource, ScheduleRowResponse} from './schedule-row-response';
import { GracePeriodType } from '../domain/model/credit-config';

export class ScheduleRowAssembler
  implements BaseAssembler<ScheduleRow, ScheduleRowResource, ScheduleRowResponse>
{
  toEntityFromResource(resource: ScheduleRowResource): ScheduleRow {
    return new ScheduleRow({
      id: resource.id,
      loanId: resource.loan_id,
      installmentNo: resource.installment_no,
      paymentDate: new Date(resource.payment_date),
      openingBalance: resource.opening_balance,
      interest: resource.interest,
      amortization: resource.amortization,
      insurance: resource.insurance,
      postage: resource.postage,
      commission: resource.commission,
      monthlyPayment: resource.monthly_payment,
      endingBalance: resource.ending_balance,
      gracePeriodType: resource.grace_period_type as GracePeriodType,
    });
  }

  toResourceFromEntity(entity: ScheduleRow): ScheduleRowResource {
    return {
      id: entity.id,
      loan_id: entity.loanId,
      installment_no: entity.installmentNo,
      payment_date: entity.paymentDate.toISOString(),
      opening_balance: entity.openingBalance,
      interest: entity.interest,
      amortization: entity.amortization,
      insurance: entity.insurance,
      postage: entity.postage,
      commission: entity.commission,
      monthly_payment: entity.monthlyPayment,
      ending_balance: entity.endingBalance,
      grace_period_type: entity.gracePeriodType,
    };
  }

  toEntitiesFromResponse(response: ScheduleRowResponse): ScheduleRow[] {
    return (response.scheduleRows ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
