import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { IamStore } from '../../../application/iam.store';
import { SignInCommand } from '../../../domain/model/sign-in.command';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

const REMEMBERED_IDENTIFIER_KEY = 'SmartdriveFinance.rememberedIdentifier';

@Component({
  selector: 'app-sign-in-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    TranslateModule,
    LanguageSwitcher
  ],
  templateUrl: './sign-in-form.html',
  styleUrls: ['./sign-in-form.css']
})
export class SignInForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  showPassword = false;
  signInError = '';
  /** Spinner state shared with the store, so the button reflects the in-flight request. */
  readonly loading = this.store.authLoading;

  signInForm: FormGroup = this.fb.group({
    identifier: [localStorage.getItem(REMEMBERED_IDENTIFIER_KEY) ?? '', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberIdentifier: [!!localStorage.getItem(REMEMBERED_IDENTIFIER_KEY)],
  });

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  performSignIn(): void {
    this.signInError = '';
    if (this.signInForm.valid) {
      const identifier = this.signInForm.value.identifier.trim().toLowerCase();
      if (this.signInForm.value.rememberIdentifier) {
        localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, identifier);
      } else {
        localStorage.removeItem(REMEMBERED_IDENTIFIER_KEY);
      }
      const command = new SignInCommand({
        identifier,
        password: this.signInForm.value.password
      });
      this.store.signIn(command, this.router, () => {
        this.signInError = 'No existe una cuenta con ese identificador o la contrasena es incorrecta.';
        this.signInForm.controls['identifier'].setErrors({ invalidCredentials: true });
        this.signInForm.controls['password'].setErrors({ invalidCredentials: true });
      });
    } else {
      this.signInForm.markAllAsTouched();
    }
  }
}
