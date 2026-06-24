import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GracePeriodType } from '../../../domain/model/credit-config';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
  selector:    'app-grace-period-info',
  standalone:  true,
  imports:     [CommonModule, TranslateModule],
  templateUrl: './grace-period-info.component.html',
  styleUrls:   ['./grace-period-info.component.css'],
})
export class GracePeriodInfoComponent {
  @Input() months = 0;
  @Input() type: GracePeriodType = 'none';

  constructor(private translate: TranslateService) {}

  get isVisible(): boolean {
    return this.months > 0 && this.type !== 'none';
  }

  get message(): string {
    if (this.type === 'partial') {
      return this.translate.instant('sdp.components.gracePeriodInfo.partialMessage', {
        months: this.months,
        nextMonth: this.months + 1
      });
    }

    return this.translate.instant('sdp.components.gracePeriodInfo.totalMessage', {
      months: this.months
    });
  }
}
