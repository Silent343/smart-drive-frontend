import {Component, inject, OnInit} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {SignUpCommand} from '../../../domain/model/sign-up.command';
import {IamStore} from '../../../application/iam.store';

interface Country {
  code: string;
  name: string;
  flag: string;
  dial: string;
}

interface PasswordRules {
  length: boolean; upper: boolean;
  number: boolean; special: boolean; noRepeat: boolean;
}

function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? '';

  const hasUpper   = /[A-Z]/.test(v);
  const hasNumber  = /[0-9]/.test(v);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
  const noRepeat   = !/(.)\1{3,}/.test(v);          // no más de 3 chars iguales seguidos
  const notWeak    = !/^(.)\1+$/.test(v);            // no es todo el mismo carácter
  const minLength  = v.length >= 8;

  const valid = hasUpper && hasNumber && hasSpecial && noRepeat && notWeak && minLength;
  return valid ? null : { weakPassword: true };
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass    = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass && confirm && pass !== confirm ? { mismatch: true } : null;
}

function dniValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? '';
  return /^\d{8}$/.test(v) ? null : { invalidDni: true };
}

function rucValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? '';
  return /^(10|20)\d{9}$/.test(v) ? null : { invalidRuc: true };
}

@Component({
  selector: 'app-sign-up-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './sign-up-form.component.html',
  styleUrls: ['./sign-up-form.component.css']
})
export class SignUpForm implements OnInit{
  private readonly fb = inject(FormBuilder);
  private router = inject(Router);
  private store = inject(IamStore)

  showPassword = false;
  showConfirm  = false;
  showCountryDropdown = false;

  emailDomain = '';
  emailPreview = '';

  strengthLevel = 0;
  strengthColor = 'red';
  strengthLabel = '';
  rules: PasswordRules = {
    length: false, upper: false,
    number: false, special: false, noRepeat: false
  };

  countries: Country[] = [
    { code: 'PE', name: 'Perú',      flag: '🇵🇪', dial: '+51' },
    { code: 'MX', name: 'México',    flag: '🇲🇽', dial: '+52' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', dial: '+54' },
    { code: 'CL', name: 'Chile',     flag: '🇨🇱', dial: '+56' },
    { code: 'CO', name: 'Colombia',  flag: '🇨🇴', dial: '+57' },
    { code: 'US', name: 'USA',       flag: '🇺🇸', dial: '+1'  },
  ];

  selectedCountry: Country = this.countries[0];

  signUpForm: FormGroup = this.fb.group({
    fullName:     ['', Validators.required],
    /*email:        ['', Validators.required],*/
    dni:          ['', [Validators.required, dniValidator]],
    ruc:          ['', [Validators.required, rucValidator]],
    businessName: ['', Validators.required],
    phone:        ['', [Validators.required, Validators.pattern('^[0-9]{9,15}$')]],
    recoveryEmail:   ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  /** Genera el dominio y el preview cuando cambia la razón social */
  /*
  onBusinessNameChange(): void {
    const raw: string = this.signUpForm.value.businessName ?? '';
    const slug = raw.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

    if (slug) {
      this.emailDomain  = `@${slug}.sdf.pe`;
      this.emailPreview = `nombre@${slug}.sdf.pe`;
    } else {
      this.emailDomain  = '';
      this.emailPreview = '';
    }
  }
  */

  get passwordMismatch(): boolean {
    return !!(
      this.signUpForm.hasError('mismatch') &&
      this.signUpForm.get('confirmPassword')?.dirty
    );
  }

  ngOnInit(): void {
    this.signUpForm.get('password')!.valueChanges.subscribe(v => {
      this.evaluatePassword(v ?? '');
    });
  }

  evaluatePassword(v: string): void {
    this.rules = {
      length:   v.length >= 8,
      upper:    /[A-Z]/.test(v),
      number:   /[0-9]/.test(v),
      special:  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v),
      noRepeat: !(/(.)\1{3,}/.test(v)) && !(/^(.)\1+$/.test(v)),
    };

    const score = Object.values(this.rules).filter(Boolean).length;

    const levels: Record<number, [number, string, string]> = {
      0: [0, 'red',    ''],
      1: [1, 'red',    'Muy débil'],
      2: [2, 'orange', 'Débil'],
      3: [3, 'yellow', 'Regular'],
      4: [4, 'yellow', 'Buena'],
      5: [4, 'green',  'Segura'],
    };

    const [level, color, label] = levels[score] ?? levels[0];
    this.strengthLevel = level;
    this.strengthColor = color;
    this.strengthLabel = label;
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
  toggleConfirm():  void { this.showConfirm  = !this.showConfirm;  }
  toggleCountryDropdown(): void { this.showCountryDropdown = !this.showCountryDropdown; }


  selectCountry(country: Country): void {
    this.selectedCountry = country;
    this.showCountryDropdown = false;
  }

  performSignUp(): void {
    if(this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    };

    const formValues = this.signUpForm.getRawValue()

    const signUpCommand = new SignUpCommand({
      email: formValues.recoveryEmail,
      password: formValues.password,
      fullName: formValues.fullName,
      dni: formValues.dni,
      ruc: formValues.ruc,
      phone: formValues.phone,
      businessName: formValues.businessName,
    })

    this.store.signUp(signUpCommand, this.router)
  }


}
