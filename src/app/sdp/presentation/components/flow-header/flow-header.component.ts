import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';

export type FlowStep = 'configuration' | 'simulation' | 'schedule' | 'report';

export interface FlowStepItem {
  id:    FlowStep;
  label: string;
  icon:  string;
  route: string;
}

@Component({
  selector:    'app-flow-header',
  standalone:  true,
  imports:     [CommonModule, RouterModule, TranslateModule],
  templateUrl: './flow-header.component.html',
  styleUrls:   ['./flow-header.component.css'],
})
export class FlowHeaderComponent {
  @Input() activeStep: FlowStep = 'configuration';

  readonly steps: FlowStepItem[] = [
    { id: 'configuration', label: 'sdp.flow.steps.configuration', icon: 'settings',    route: '/configuration' },
    { id: 'simulation',    label: 'sdp.flow.steps.simulation',    icon: 'calculator',   route: '/simulation'    },
    { id: 'schedule',      label: 'sdp.flow.steps.schedule',      icon: 'table',        route: '/schedule'      },
    { id: 'report',        label: 'sdp.flow.steps.report',        icon: 'report',       route: '/report'        },
  ];

  isActive(step: FlowStepItem): boolean {
    return step.id === this.activeStep;
  }
}
