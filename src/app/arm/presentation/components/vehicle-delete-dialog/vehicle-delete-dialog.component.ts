import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Vehicle } from '../../../domain/model/vehicle.entity';

@Component({
  selector: 'app-vehicle-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, TranslateModule],
  templateUrl: './vehicle-delete-dialog.component.html',
  styleUrl: './vehicle-delete-dialog.component.css',
})
export class VehicleDeleteDialogComponent {
  private dialogRef = inject(MatDialogRef<VehicleDeleteDialogComponent>);

  // Inyectamos el vehículo que el padre envió
  protected data = inject<Vehicle>(MAT_DIALOG_DATA);
}
