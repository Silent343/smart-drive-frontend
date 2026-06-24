import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { Vehicle } from '../../../domain/model/vehicle.entity';
import {Component, EventEmitter, Input, input, Output, output} from '@angular/core';

@Component({
  selector: 'app-vehicles-catalog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, TranslateModule],
  templateUrl: './vehicles-catalog.component.html',
  styleUrl: './vehicles-catalog.component.css'
})
export class VehiclesCatalogComponent {
  @Input({ required: true }) vehicles: Vehicle[] = [];

  @Output() viewDetails = new EventEmitter<Vehicle>();
}
