import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Capitalization, CreditConfig, Currency, GracePeriodType, InterestRateType } from '../domain/model/credit-config';
import { CreditConfigResource, CreditConfigResponse } from './credit-config-response';

export class CreditConfigAssembler
  implements BaseAssembler<CreditConfig, CreditConfigResource, CreditConfigResponse>
{
  toEntityFromResource(resource: CreditConfigResource): CreditConfig {
    return new CreditConfig({
      id: resource.id,
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
    });
  }

  toResourceFromEntity(entity: CreditConfig): CreditConfigResource {
    return {
      id: entity.id,
      currency: entity.currency,
      interest_rate_type: entity.interestRateType,
      annual_rate: entity.annualRate,
      capitalization: entity.capitalization ?? null,
      grace_period_type: entity.gracePeriodType,
      grace_period_months: entity.gracePeriodMonths,
      insurance_rate_pct: entity.insuranceRatePct,
      postage_fee_amount: entity.postageFeeAmount,
      administration_fee_pct: entity.administrationFeePct,
    };
  }

  toEntitiesFromResponse(response: CreditConfigResponse): CreditConfig[] {
    return (response.creditConfigs ?? []).map((resource) => this.toEntityFromResource(resource));
  }
}
