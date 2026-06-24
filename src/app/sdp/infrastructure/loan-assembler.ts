import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Loan } from '../domain/model/loan';
import {LoanResource, LoanResponse} from './loan-response';

export class LoanAssembler
  implements BaseAssembler<Loan, LoanResource, LoanResponse>
{
  toEntityFromResource(resource: LoanResource): Loan {
    return new Loan({
      id: resource.id,
      carId: resource.car_id,
      clientId: resource.client_id,
      configId: resource.config_id,
      initialFee: resource.initial_fee,
      vehiclePrice: resource.vehicle_price,
      loanAmount: resource.loan_amount,
      installmentsQty: resource.instalments_qty,
      startDate: new Date(resource.start_date),
      fixedInstallment: resource.fixed_installment,
      npvDebtor: resource.npv_debtor,
      irrDebtor: resource.irr_debtor,
      tcea: resource.tcea,
      totalInterest: resource.total_interest,
      totalInsurance: resource.total_insurance,
      totalPostage: resource.total_postage,
      totalCommission: resource.total_commission,
      ctc: resource.ctc,
    });
  }

  toResourceFromEntity(entity: Loan): LoanResource {
    return {
      id: entity.id,
      car_id: entity.carId,
      client_id: entity.clientId,
      config_id: entity.configId,
      initial_fee: entity.initialFee,
      vehicle_price: entity.vehiclePrice,
      loan_amount: entity.loanAmount,
      instalments_qty: entity.installmentsQty,
      start_date: entity.startDate.toISOString(),
      fixed_installment: entity.fixedInstallment,
      npv_debtor: entity.npvDebtor,
      irr_debtor: entity.irrDebtor,
      tcea: entity.tcea,
      total_interest: entity.totalInterest,
      total_insurance: entity.totalInsurance,
      total_postage: entity.totalPostage,
      total_commission: entity.totalCommission,
      ctc: entity.ctc,
    };
  }

  toEntitiesFromResponse(response: LoanResponse): Loan[] {
    return (response.loans ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
