import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { IamApi } from '../../../infrastructure/iam-api';

function strongPassword(control: AbstractControl): ValidationErrors | null {
  const value = control.value ?? '';
  const ok = value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
  return ok ? null : { weakPassword: true };
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly iamApi = inject(IamApi);

  readonly resetToken = signal<string | null>(null);
  readonly requestSent = signal(false);
  readonly resetDone = signal(false);
  readonly error = signal('');
  isRequesting = false;
  isResetting = false;

  forgotForm = this.fb.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
  });

  resetForm = this.fb.group({
    token: ['', Validators.required],
    newPassword: ['', [Validators.required, strongPassword]],
    confirmPassword: ['', Validators.required],
  });

  get passwordsMismatch(): boolean {
    const values = this.resetForm.getRawValue();
    return !!values.confirmPassword && values.newPassword !== values.confirmPassword;
  }

  requestReset(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isRequesting = true;
    this.error.set('');
    const identifier = this.forgotForm.value.identifier!.trim().toLowerCase();
    this.iamApi.forgotPassword(identifier).subscribe({
      next: (result) => {
        this.requestSent.set(true);
        this.resetToken.set(result.resetToken ?? null);
        if (result.resetToken) {
          this.resetForm.patchValue({ token: result.resetToken });
        }
        this.isRequesting = false;
      },
      error: () => {
        this.error.set('We could not start the reset process. Please try again.');
        this.isRequesting = false;
      },
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid || this.passwordsMismatch) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const values = this.resetForm.getRawValue();
    this.isResetting = true;
    this.error.set('');
    this.iamApi.resetPassword(values.token!, values.newPassword!).subscribe({
      next: () => {
        this.resetDone.set(true);
        this.isResetting = false;
      },
      error: () => {
        this.error.set('The token is invalid, expired or already used.');
        this.isResetting = false;
      },
    });
  }
}
