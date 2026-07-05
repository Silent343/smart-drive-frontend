import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Capitalization, CreditConfig, Currency, GracePeriodType, InterestRateType } from '../domain/model/credit-config';
import { CreditConfigResource, CreditConfigResponse } from './credit-config-response';

export class CreditConfigAssembler
  implements BaseAssembler<CreditConfig, CreditConfigResource, CreditConfigResponse>
{
  toEntityFromResource(resource: CreditConfigResource): CreditConfig {
    return new CreditConfig({
      id: resource.id != null ? String(resource.id) : '',
      currency: resource.currency as Currency,
      interestRateType: resource.interest_rate_type as InterestRateType,
      annualRate: resource.annual_rate,
      capitalization: resource.capitalization != null
        ? (resource.capitalization as Capitalization)
        : undefined,
      gracePeriodType: resource.grace_period_type as GracePeriodType,
      gracePeriodMonths: resource.grace_period_months,
      insuranceRatePct: resource.insurance_rate_pct,
      postageFeeAmount: resource.postage_fee_amount,
      administrationFeePct: resource.administration_fee_pct,
      riskInsuranceRatePct: resource.risk_insurance_rate_pct ?? 0,
      gpsFeeAmount: resource.gps_fee_amount ?? 0,
      finalInstallmentPct: resource.final_installment_pct ?? 0,
      igvItfPct: resource.igv_itf_pct ?? 0,
      notaryCostAmount: resource.notary_cost_amount ?? 0,
      registryCostAmount: resource.registry_cost_amount ?? 0,
      appraisalCostAmount: resource.appraisal_cost_amount ?? 0,
      studyCommissionAmount: resource.study_commission_amount ?? 0,
      activationCommissionAmount: resource.activation_commission_amount ?? 0,
      discountAnnualRatePct: resource.discount_annual_rate_pct ?? 0,
    });
  }

  toResourceFromEntity(entity: CreditConfig): CreditConfigResource {
    return {
      id: (entity.id ? entity.id : null) as any,
      currency: entity.currency,
      interest_rate_type: entity.interestRateType,
      annual_rate: entity.annualRate,
      capitalization: entity.capitalization ?? null,
      grace_period_type: entity.gracePeriodType,
      grace_period_months: entity.gracePeriodMonths,
      insurance_rate_pct: entity.insuranceRatePct,
      postage_fee_amount: entity.postageFeeAmount,
      administration_fee_pct: entity.administrationFeePct,
      risk_insurance_rate_pct: entity.riskInsuranceRatePct,
      gps_fee_amount: entity.gpsFeeAmount,
      final_installment_pct: entity.finalInstallmentPct,
      igv_itf_pct: entity.igvItfPct,
      notary_cost_amount: entity.notaryCostAmount,
      registry_cost_amount: entity.registryCostAmount,
      appraisal_cost_amount: entity.appraisalCostAmount,
      study_commission_amount: entity.studyCommissionAmount,
      activation_commission_amount: entity.activationCommissionAmount,
      discount_annual_rate_pct: entity.discountAnnualRatePct,
    };
  }

  toEntitiesFromResponse(response: CreditConfigResponse): CreditConfig[] {
    return (response.creditConfigs ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
