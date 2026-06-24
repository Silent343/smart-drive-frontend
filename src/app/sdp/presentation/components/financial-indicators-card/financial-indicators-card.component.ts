import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';

export interface IndicatorRow {
  label:      string;
  value:      string;
  highlight?: boolean;
}

@Component({
  selector:    'app-financial-indicators-card',
  standalone:  true,
  imports:     [CommonModule, TranslateModule],
  templateUrl: './financial-indicators-card.component.html',
  styleUrls:   ['./financial-indicators-card.component.css'],
})
export class FinancialIndicatorsCardComponent {
  @Input() indicators: IndicatorRow[] = [];
  @Input() footNote = '* Costo total del crédito (norma SBS)';
}
