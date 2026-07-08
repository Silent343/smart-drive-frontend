import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Loan } from '../domain/model/loan';
import {LoanResource, LoanResponse} from './loan-response';

export class LoanAssembler
  implements BaseAssembler<Loan, LoanResource, LoanResponse>
{
  toEntityFromResource(resource: LoanResource): Loan {
    return new Loan({
      id: resource.id != null ? String(resource.id) : '',
      carId: resource.car_id,
      clientId: resource.client_id,
      configId: resource.config_id != null ? String(resource.config_id) : '',
      sellerId: resource.seller_id != null ? String(resource.seller_id) : '',
      sellerName: resource.seller_name ?? '',
      status: resource.status ?? 'SIMULATED',
      initialFee: resource.initial_fee,
      vehiclePrice: resource.vehicle_price,
      loanAmount: resource.loan_amount,
      installmentsQty: resource.instalments_qty,
      startDate: new Date(resource.start_date),
      fixedInstallment: resource.fixed_installment,
      npvDebtor: resource.npv_debtor,
      irrDebtor: resource.irr_debtor,
      tcea: resource.tcea,
      trea: resource.trea ?? 0,
      totalInterest: resource.total_interest,
      totalInsurance: resource.total_insurance,
      totalRiskInsurance: resource.total_risk_insurance ?? 0,
      totalGps: resource.total_gps ?? 0,
      totalPostage: resource.total_postage,
      totalCommission: resource.total_commission,
      totalTax: resource.total_tax ?? 0,
      initialCosts: resource.initial_costs ?? 0,
      residualValue: resource.residual_value ?? 0,
      ctc: resource.ctc,
      vehicles: (resource.vehicles ?? []).map(v => ({ carId: v.car_id, price: v.price })),
    });
  }

  toResourceFromEntity(entity: Loan): LoanResource {
    const sellerId = Number(entity.sellerId);
    return {
      id: (entity.id ? entity.id : null) as any,
      car_id: entity.carId,
      client_id: entity.clientId,
      config_id: entity.configId,
      // The backend stamps the real seller from the authenticated token. Do not send
      // the frontend public UUID here because the API field is a numeric internal id.
      seller_id: Number.isFinite(sellerId) ? sellerId as any : null as any,
      status: entity.status,
      initial_fee: entity.initialFee,
      vehicle_price: entity.vehiclePrice,
      loan_amount: entity.loanAmount,
      instalments_qty: entity.installmentsQty,
      start_date: entity.startDate.toISOString(),
      fixed_installment: entity.fixedInstallment,
      npv_debtor: entity.npvDebtor,
      irr_debtor: entity.irrDebtor,
      tcea: entity.tcea,
      trea: entity.trea,
      total_interest: entity.totalInterest,
      total_insurance: entity.totalInsurance,
      total_risk_insurance: entity.totalRiskInsurance,
      total_gps: entity.totalGps,
      total_postage: entity.totalPostage,
      total_commission: entity.totalCommission,
      total_tax: entity.totalTax,
      initial_costs: entity.initialCosts,
      residual_value: entity.residualValue,
      ctc: entity.ctc,
      vehicles: (entity.vehicles ?? []).map(v => ({ car_id: v.carId, price: v.price })),
    };
  }

  toEntitiesFromResponse(response: LoanResponse): Loan[] {
    return (response.loans ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
