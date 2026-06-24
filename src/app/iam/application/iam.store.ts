import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AccessStatus } from '../domain/model/access-status';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { IamApi } from '../infrastructure/iam-api';

/**
 * Persisted IAM session payload kept in browser storage.
 */
interface PersistedSession {
  id: string;
  email: string;
  fullName: string;
  role: string;
  token: string;
  dni: string;
}

const SESSION_STORAGE_KEY = 'SmartdriveFinance.session';

/**
 * Application service managing IAM domain state and authentication orchestration.
 */
@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly isSignedInSignal = signal<boolean>(false);
  private readonly currentEmailSignal = signal<string | null>(null);
  private readonly currentFullNameSignal = signal<string | null>(null);
  private readonly currentUserIdSignal = signal<string | null>(null);
  private readonly currentRoleSignal = signal<string | null>(null);
  private readonly currentDniSignal = signal<string | null>(null);
  private readonly currentTokenSignal = signal<string | null>(null);
  private readonly requiresTotpSignal = signal<boolean>(false);
  private readonly pendingTotpUserIdSignal = signal<string | null>(null);

  readonly requiresTotp = this.requiresTotpSignal.asReadonly();
  readonly pendingTotpUserId = this.pendingTotpUserIdSignal.asReadonly();
  readonly isSignedIn = this.isSignedInSignal.asReadonly();
  readonly currentEmail = this.currentEmailSignal.asReadonly();
  readonly currentFullName = this.currentFullNameSignal.asReadonly();
  readonly currentUserId = this.currentUserIdSignal.asReadonly();
  readonly currentRole = this.currentRoleSignal.asReadonly();
  readonly currentDni = this.currentDniSignal.asReadonly();
  readonly currentToken = computed(() => this.isSignedIn() ? this.currentTokenSignal() : null);

  readonly currentUser = computed(() => {
    if (!this.isSignedInSignal()) return null;
    return {
      fullName: this.currentFullNameSignal() || 'Usuario Invitado',
      role: this.currentRoleSignal() || 'Operador',
      email: this.currentEmailSignal() || '',
      dni: this.currentDniSignal() || 'Sin DNI'
    };
  });

  constructor(private iamApi: IamApi) {
    const persisted = this.loadPersistedSession();
    if (persisted) {
      this.applySession(persisted);
    } else {
      this.clearSessionSignals();
    }
  }

  /**
   * Executes sign-in flow and persists session.
   */
  signIn(signInCommand: SignInCommand, router: Router): void {
    this.iamApi.signIn(signInCommand).subscribe({
      next: (resource) => {
        // ← NUEVO: si el backend pide 2FA
        if (resource.requiresTotp) {
          this.requiresTotpSignal.set(true);
          this.pendingTotpUserIdSignal.set(resource.userId!);
          router.navigate(['/totp-verify']);
          return;
        }

        const session: PersistedSession = {
          id: resource.id!,
          email: resource.email!,
          fullName: resource.fullName!,
          role: resource.role || 'Operador',
          token: resource.token!,
          dni: resource.dni || 'Sin DNI',
        };
        this.savePersistedSession(session);
        this.applySession(session);
        router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Sign-in failed:', err);
        this.clearPersistedSession();
        this.clearSessionSignals();
        this.signOut(router);
      },
    });
  }


  confirmTotpVerification(
    token: string,
    router: Router,
    onError?: () => void,
    onSuccess?: () => void
  ): void {
    const userId = this.pendingTotpUserIdSignal();
    if (!userId) return;

    this.iamApi.verifyTotp(userId, token).subscribe({
      next: (resource) => {
        const session: PersistedSession = {
          id:       resource.id!,
          email:    resource.email!,
          fullName: resource.fullName!,
          role:     resource.role  || 'Operador',
          token:    resource.token!,
          dni:      resource.dni   || 'Sin DNI',
        };
        this.requiresTotpSignal.set(false);
        this.pendingTotpUserIdSignal.set(null);
        this.savePersistedSession(session);
        this.applySession(session);
        onSuccess?.();
        router.navigate(['/dashboard-analytics/home']);
      },
      error: () => onError?.()
    });
  }

  /**
   * Executes sign-up flow.
   */
  signUp(signUpCommand: SignUpCommand, router: Router): void {
    this.iamApi.signUp(signUpCommand).subscribe({
      next: () => router.navigate(['/iam/sign-in']),
      error: (err) => console.error('Sign-up failed:', err),
    });
  }

  /**
   * Clears session and redirects to sign-in.
   */
  signOut(router: Router): void {
    this.clearPersistedSession();
    this.clearSessionSignals();
    router.navigate(['/iam/sign-in']).then();
  }

  private loadPersistedSession(): PersistedSession | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private savePersistedSession(session: PersistedSession): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private clearPersistedSession(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }



  private applySession(session: PersistedSession): void {
    this.isSignedInSignal.set(true);
    this.currentEmailSignal.set(session.email);
    this.currentFullNameSignal.set(session.fullName);
    this.currentUserIdSignal.set(session.id);
    this.currentRoleSignal.set(session.role);
    this.currentTokenSignal.set(session.token);
    this.currentDniSignal.set(session.dni);
  }

  private clearSessionSignals(): void {
    this.isSignedInSignal.set(false);
    this.currentEmailSignal.set(null);
    this.currentFullNameSignal.set(null);
    this.currentUserIdSignal.set(null);
    this.currentRoleSignal.set(null);
    this.currentTokenSignal.set(null);
    this.currentDniSignal.set(null);
  }

}
