import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduleRow } from '../../../domain/model/schedule-row';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector:    'app-schedule-table',
  standalone:  true,
  imports:     [CommonModule, TranslateModule],
  templateUrl: './schedule-table.component.html',
  styleUrls:   ['./schedule-table.component.css'],
})
export class ScheduleTableComponent {
  @Input() rows:     ScheduleRow[] = [];
  @Input() currency: string        = 'PEN';
  initialBalance: number = 0;
  endingBalance:  number = 0;

  get symbol(): string {
    return this.currency === 'USD' ? '$' : 'S/';
  }

  fmt(n: number): string {
    return `${this.symbol} ${n.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
