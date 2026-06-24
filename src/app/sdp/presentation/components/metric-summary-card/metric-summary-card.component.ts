import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';

export interface MetricItem {
  label: string;
  value: string;
  highlight?: boolean;   // true → valor en dorado
}

@Component({
  selector:    'app-metric-summary-card',
  standalone:  true,
  imports:     [CommonModule, TranslateModule],
  templateUrl: './metric-summary-card.component.html',
  styleUrls:   ['./metric-summary-card.component.css'],
})
export class MetricSummaryCardComponent {
  @Input() metrics: MetricItem[] = [];
}
