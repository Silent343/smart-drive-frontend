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

      // Code is an auto-generated serial (read-only). On create we mint a fresh one;
      // on edit we keep the existing code untouched.
      code: [{ value: this.data?.code || this.generateSerialCode(), disabled: true }, [Validators.required]],
      // A newly registered vehicle is always "available"; the status changes later on sale.
      status: [this.data?.status || 'available', [Validators.required]],
      imageUrl: [this.data?.imageUrl || null],

      brand: [this.data?.specification?.brand || '', [Validators.required]],
      model: [this.data?.specification?.model || '', [Validators.required]],
      year: [this.data?.specification?.year || new Date().getFullYear(), [Validators.required, Validators.min(1886)]],
      transmission: [this.data?.specification?.transmission || '', [Validators.required]],

      price: [this.data?.commercial?.price || '', [Validators.required, Validators.min(0)]],
      company: [this.data?.commercial?.company || '', [Validators.required]]
    });
  }

  /**
   * Builds an auto-incrementing-looking serial code for a new vehicle, e.g. "VH-7F3A2K".
   * Uses a timestamp-derived, uppercased base-36 suffix so codes are unique and readable
   * without needing a server round-trip. Read-only in the form.
   */
  private generateSerialCode(): string {
    const stamp = Date.now().toString(36).toUpperCase().slice(-4);
    const rand = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, '0');
    return `VH-${stamp}${rand}`;
  }

  onSubmit(): void {
    if (this.vehicleForm.valid) {
      // getRawValue includes disabled controls (code), so the generated serial is preserved.
      this.dialogRef.close(this.vehicleForm.getRawValue());
    }
  }


}
