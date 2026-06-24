import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Vehicle } from '../../../domain/model/vehicle.entity';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-vehicle-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, TranslateModule, FormsModule, MatIconModule],
  templateUrl: './vehicle-form-dialog.component.html',
  styleUrl: './vehicle-form-dialog.component.css',
})
export class VehicleFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<VehicleFormDialogComponent>);


  protected data = inject<Vehicle | null>(MAT_DIALOG_DATA);

  vehicleForm!: FormGroup;
  isEditMode = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data;

    this.vehicleForm = this.fb.group({
      id: [this.data?.id || null],
      specificationId: [this.data?.specification?.id || null],
      commercialId: [this.data?.commercial?.id || null],
      userId: [this.data?.commercial?.userId || null],

      code: [this.data?.code || '', [Validators.required]],
      status: [this.data?.status || '', [Validators.required]],
      imageUrl: [this.data?.imageUrl || null],

      brand: [this.data?.specification?.brand || '', [Validators.required]],
      model: [this.data?.specification?.model || '', [Validators.required]],
      year: [this.data?.specification?.year || new Date().getFullYear(), [Validators.required, Validators.min(1886)]],
      transmission: [this.data?.specification?.transmission || '', [Validators.required]],

      price: [this.data?.commercial?.price || '', [Validators.required, Validators.min(0)]],
      company: [this.data?.commercial?.company || '', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.vehicleForm.valid) {
      this.dialogRef.close(this.vehicleForm.value);
    }
  }


}
