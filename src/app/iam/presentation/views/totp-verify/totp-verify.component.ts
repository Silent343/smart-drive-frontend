import { Component, inject, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IamStore } from '../../../application/iam.store';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-totp-verify',
  standalone: true,
  imports: [
    CommonModule,         // *ngIf, *ngFor, ng-template
    ReactiveFormsModule,  // formGroup
    RouterLink,           // routerLink="/iam/sign-in"
    MatButtonModule,
    TranslateModule,
    MatIconModule,
  ],
  templateUrl: './totp-verify.component.html',
  styleUrls: ['./totp-verify.component.css'],
})
export class TotpVerifyComponent implements OnInit, OnDestroy {
  private store  = inject(IamStore);
  private router = inject(Router);
  private fb     = inject(FormBuilder);

  @ViewChild('hiddenInput') hiddenInputRef!: ElementRef<HTMLInputElement>;

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  digits: string[]  = Array(6).fill('');
  digitIndices      = [0, 1, 2, 3, 4, 5];
  currentLength     = 0;
  errorMsg          = '';
  verified          = false;
  timerDisplay      = '0:29';

  private timerRef?: ReturnType<typeof setInterval>;

  ngOnInit():  void { this.startTimer(); }
  ngOnDestroy(): void { clearInterval(this.timerRef); }

  startTimer(seconds = 29): void {
    clearInterval(this.timerRef);
    let s = seconds;
    this.timerRef = setInterval(() => {
      s--;
      this.timerDisplay = `0:${String(s).padStart(2, '0')}`;
      if (s <= 0) clearInterval(this.timerRef);
    }, 1000);
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value
      .replace(/\D/g, '').slice(0, 6);
    (event.target as HTMLInputElement).value = val;
    this.digits        = Array.from({ length: 6 }, (_, i) => val[i] || '');
    this.currentLength = val.length;
    this.errorMsg      = '';
    this.form.get('code')!.setValue(val);
  }

  verify(): void {
    if (this.form.invalid) return;
    const userId = this.store.pendingTotpUserId();
    if (!userId) { this.router.navigate(['/iam/sign-in']); return; }

    this.store.confirmTotpVerification(
      this.form.value.code!,
      this.router,
      () => {
        this.errorMsg      = 'Código incorrecto. Verifica tu app de autenticación.';
        this.digits        = Array(6).fill('');
        this.currentLength = 0;
        this.form.get('code')!.setValue('');
        setTimeout(() => this.hiddenInputRef?.nativeElement.focus(), 50);
      },
      () => { this.verified = true; }
    );
  }

  requestNewCode(): void {
    this.digits        = Array(6).fill('');
    this.currentLength = 0;
    this.errorMsg      = '';
    this.form.get('code')!.setValue('');
    this.startTimer();
    setTimeout(() => this.hiddenInputRef?.nativeElement.focus(), 50);
  }
}
