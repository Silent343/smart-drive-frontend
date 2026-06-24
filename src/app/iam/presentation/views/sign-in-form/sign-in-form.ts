import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IamStore } from '../../../application/iam.store';
import { SignInCommand } from '../../../domain/model/sign-in.command';

@Component({
  selector: 'app-sign-in-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './sign-in-form.html',
  styleUrls: ['./sign-in-form.css']
})
export class SignInForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  showPassword = false;

  signInForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  performSignIn(): void {
    if (this.signInForm.valid) {
      const command = new SignInCommand({
        email: this.signInForm.value.email,
        password: this.signInForm.value.password
      });
      this.store.signIn(command, this.router);
    } else {
      this.signInForm.markAllAsTouched();
    }
  }
}
