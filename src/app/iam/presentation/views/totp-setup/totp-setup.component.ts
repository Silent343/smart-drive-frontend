import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IamApi } from '../../../infrastructure/iam-api';
import { IamStore } from '../../../application/iam.store';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {TranslateModule} from '@ngx-translate/core';

interface AuthApp {
  icon: string;
  name: string;
  desc: string;
}

@Component({
  selector: 'app-totp-setup',
  standalone: true,
  imports: [CommonModule,  RouterLink,  ReactiveFormsModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './totp-setup.component.html',
  styleUrls: ['./totp-setup.component.css']
})
export class TotpSetupComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private iamApi = inject(IamApi);
  private store  = inject(IamStore);
  private router = inject(Router);
  private fb     = inject(FormBuilder);

  @ViewChild('hiddenInput') hiddenInputRef!: ElementRef<HTMLInputElement>;

  // ── Paso actual (1–4) ──────────────────────────────────────────
  currentStep = 1;

  // ── Señales / estado del QR ───────────────────────────────────
  qrCode         = signal<string | null>(null);
  qrCodeSafe = signal<SafeUrl | null>(null);
  secretRaw      = signal<string>('');
  secretFormatted = '';

  // ── Apps de autenticación (paso 1) ───────────────────────────
  readonly authApps: AuthApp[] = [
    { icon: '🔐', name: 'Google Authenticator', desc: 'Disponible en iOS y Android' },
    { icon: '🛡️', name: 'Microsoft Authenticator', desc: 'Disponible en iOS y Android' },
    { icon: '⚡', name: 'Authy', desc: 'Con respaldo en la nube' },
  ];

  // ── Dígitos (paso 3) ─────────────────────────────────────────
  readonly digitIndices = [0, 1, 2, 3, 4, 5];
  digits: string[]  = Array(6).fill('');
  currentLength     = 0;
  errorMsg          = '';

  // ── Códigos de recuperación (paso 4) ─────────────────────────
  recoveryCodes: string[] = [];

  // ── Formulario ───────────────────────────────────────────────
  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  // ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    console.log('=== TOTP SETUP INIT ===');
    console.log('currentUserId:', this.store.currentUserId());
    console.log('pendingTotpUserId:', this.store.pendingTotpUserId());

    const userId = this.store.currentUserId() ?? this.store.pendingTotpUserId();
    console.log('userId final:', userId);

    if (!userId) {
      console.log('SIN userId, redirigiendo a sign-in');
      this.router.navigate(['/iam/sign-in']);
      return;
    }

    this.iamApi.getTotpSetup(userId).subscribe({
      next: (r) => {
        this.qrCode.set(r.qrCode);
        this.qrCodeSafe.set(
          this.sanitizer.bypassSecurityTrustUrl(r.qrCode)
        );
        this.secretRaw.set(r.secret);
        this.secretFormatted = (r.secret ?? '')
          .replace(/(.{4})/g, '$1 ')
          .trim()
          .toUpperCase();
      },
      error: (err) => {
        console.error('getTotpSetup error:', err);
        //this.router.navigate(['/iam/sign-in'])
      }
    });
  }

  // ── Navegación entre pasos ────────────────────────────────────
  nextStep(): void {
    if (this.currentStep < 4) this.currentStep++;
    if (this.currentStep === 3) {
      this.resetDigits();
      // Foco al input oculto en el siguiente ciclo de detección
      setTimeout(() => this.hiddenInputRef?.nativeElement.focus(), 50);
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  // ── Input de dígitos ─────────────────────────────────────────
  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value
      .replace(/\D/g, '')
      .slice(0, 6);
    (event.target as HTMLInputElement).value = raw;
    this.digits       = Array.from({ length: 6 }, (_, i) => raw[i] ?? '');
    this.currentLength = raw.length;
    this.errorMsg      = '';
    this.form.get('code')!.setValue(raw);
  }

  private resetDigits(): void {
    this.digits        = Array(6).fill('');
    this.currentLength = 0;
    this.errorMsg      = '';
    this.form.get('code')!.setValue('');
  }

  // ── Confirmar código y activar 2FA ───────────────────────────
  confirm(): void {
    if (this.form.invalid) return;

    const userId = this.store.currentUserId() ?? this.store.pendingTotpUserId();
    if (!userId) return;

    this.iamApi.verifyTotpSetup(userId, this.form.value.code!).subscribe({
      next: () => {
        this.recoveryCodes = this.generateRecoveryCodes();
        this.currentStep = 4;
      },
      error: () => {
        this.errorMsg = 'Código inválido. Asegúrate de que tu app esté sincronizada.';
        this.resetDigits();
        setTimeout(() => this.hiddenInputRef?.nativeElement.focus(), 50);
      }
    });
  }

  // ── Utilidades ───────────────────────────────────────────────
  copySecret(): void {
    navigator.clipboard?.writeText(this.secretRaw());
  }

  copyRecovery(): void {
    navigator.clipboard?.writeText(this.recoveryCodes.join('\n'));
  }

  /**
   * Genera 6 códigos de recuperación aleatorios en formato XXXX-XXXX.
   * En producción estos deben venir del backend.
   */
  private generateRecoveryCodes(): string[] {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => {
      const part = (n: number) =>
        Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `${part(4)}-${part(4)}`;
    });
  }
}
