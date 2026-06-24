import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

import { Client } from '../../../domain/model/client.entity';

export interface ClientDialogData {
  client: Client | null;
}

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    FormsModule,
    MatSelectModule,
  ],
  templateUrl: './client-form-dialog.component.html',
  styleUrl: './client-form-dialog.component.css',
})
export class ClientFormDialogComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private dialogRef  = inject(MatDialogRef<ClientFormDialogComponent>);
  protected data     = inject<ClientDialogData>(MAT_DIALOG_DATA);

  clientForm!: FormGroup;
  isEditMode = false;

  countryCodes = [
    { code: '+51', iso: 'pe', name: 'Perú'      },
    { code: '+52', iso: 'mx', name: 'México'     },
    { code: '+54', iso: 'ar', name: 'Argentina'  },
    { code: '+56', iso: 'cl', name: 'Chile'      },
    { code: '+57', iso: 'co', name: 'Colombia'   },
    { code: '+1',  iso: 'us', name: 'USA'        },
    { code: '+34', iso: 'es', name: 'España'     },
  ];

  ngOnInit(): void {
    const clientData = this.data?.client;
    this.isEditMode  = !!clientData;

    let initialCountryCode = '+51';
    let initialPhoneNumber = '';

    if (clientData?.phone) {
      const parts = clientData.phone.split(' ');
      if (parts.length > 1) {
        initialCountryCode = parts[0];
        initialPhoneNumber = parts.slice(1).join('');
      } else {
        initialPhoneNumber = clientData.phone;
      }
    }

    this.clientForm = this.fb.group({
      id:               [clientData?.id       || null],
      userId:           [clientData?.userId   || null],
      name:             [clientData?.name     || '', [Validators.required]],
      dni:              [clientData?.dni      || '', [Validators.required, Validators.pattern('^[0-9]{8,12}$')]],
      income:           [clientData?.income   || '', [Validators.required, Validators.min(0)]],
      occupation:       [clientData?.occupation || '', [Validators.required]],
      phoneCountryCode: [initialCountryCode,          [Validators.required]],
      phoneNumber:      [initialPhoneNumber,          [Validators.required, Validators.pattern('^[0-9]{9,15}$')]],
    });
  }

  allowOnlyNumbers(event: Event, controlName: string): void {
    const input      = event.target as HTMLInputElement;
    const numericValue = input.value.replace(/[^0-9]/g, '');
    this.clientForm.get(controlName)?.setValue(numericValue, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      const formValue  = { ...this.clientForm.value };
      formValue.phone  = `${formValue.phoneCountryCode} ${formValue.phoneNumber}`;
      delete formValue.phoneCountryCode;
      delete formValue.phoneNumber;
      this.dialogRef.close(formValue);
    }
  }

  getSelectedIso(): string {
    const code = this.clientForm.get('phoneCountryCode')?.value;
    return this.countryCodes.find(c => c.code === code)?.iso || 'pe';
  }
}
