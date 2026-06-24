import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Vehicle } from '../../../domain/model/vehicle.entity';
import {Component, EventEmitter, Input, input, Output, output} from '@angular/core';

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './vehicle-details.component.html',
  styleUrl: './vehicle-details.component.css'
})
export class VehicleDetailsComponent {
// Recibe el vehículo específico desde el padre
  @Input({ required: true }) vehicle!: Vehicle;

  // Emite los eventos hacia el padre
  @Output() back = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Vehicle>();
  @Output() delete = new EventEmitter<Vehicle>();
}
