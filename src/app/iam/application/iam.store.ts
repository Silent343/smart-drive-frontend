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
  identifier: string;
  fullName: string;
  role: string;
  token: string;
  dni: string;
  companyDomain: string;
}

const SESSION_STORAGE_KEY = 'SmartdriveFinance.session';

/**
 * Application service managing IAM domain state and authentication orchestration.
 */
@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly isSignedInSignal = signal<boolean>(false);
  private readonly currentIdentifierSignal = signal<string | null>(null);
  private readonly currentFullNameSignal = signal<string | null>(null);
  private readonly currentUserIdSignal = signal<string | null>(null);
  private readonly currentRoleSignal = signal<string | null>(null);
  private readonly currentDniSignal = signal<string | null>(null);
  private readonly currentTokenSignal = signal<string | null>(null);
  private readonly currentCompanyDomainSignal = signal<string | null>(null);
  private readonly requiresTotpSignal = signal<boolean>(false);
  private readonly pendingTotpUserIdSignal = signal<string | null>(null);
  private readonly authLoadingSignal = signal<boolean>(false);

  /** True while a sign-in or sign-up request is in flight; used to show button spinners. */
  readonly authLoading = this.authLoadingSignal.asReadonly();

  readonly requiresTotp = this.requiresTotpSignal.asReadonly();
  readonly pendingTotpUserId = this.pendingTotpUserIdSignal.asReadonly();
  readonly isSignedIn = this.isSignedInSignal.asReadonly();
  readonly currentIdentifier = this.currentIdentifierSignal.asReadonly();
  readonly currentEmail = this.currentIdentifierSignal.asReadonly();
  readonly currentFullName = this.currentFullNameSignal.asReadonly();
  readonly currentUserId = this.currentUserIdSignal.asReadonly();
  readonly currentRole = this.currentRoleSignal.asReadonly();
  readonly currentDni = this.currentDniSignal.asReadonly();
  readonly currentCompanyDomain = this.currentCompanyDomainSignal.asReadonly();
  readonly currentToken = computed(() => this.isSignedIn() ? this.currentTokenSignal() : null);
  readonly isAdmin = computed(() => (this.currentRoleSignal() ?? '').toUpperCase() === 'ADMIN');
  readonly isSeller = computed(() => (this.currentRoleSignal() ?? '').toUpperCase() === 'SELLER');

  /**
   * Shared scope key for company-wide data. All workers (admin + sellers) of the same
   * company share the same scope, so records tagged with it are visible to everyone
   * in the organization. Falls back to the user id for legacy sessions without domain.
   */
  readonly companyScope = computed(() =>
    this.currentCompanyDomainSignal() || this.currentUserIdSignal() || ''
  );

  /** Company domain rendered in the SmartDrive handle format, e.g. `@rekir.sdf`. */
  readonly displayDomain = computed(() => {
    const domain = this.currentCompanyDomainSignal();
    return domain ? `@${domain}.sdf` : '';
  });

  /**
   * Returns true when a record owner id belongs to the current company.
   * Accepts both the new company-scope key and legacy per-user ids so
   * previously created records keep showing for their creator.
   */
  belongsToCompany(ownerId?: string | null): boolean {
    if (!ownerId) return false;
    return ownerId === this.companyScope() || ownerId === this.currentUserIdSignal();
  }

  readonly currentUser = computed(() => {
    if (!this.isSignedInSignal()) return null;
    const role = (this.currentRoleSignal() || 'SELLER').toUpperCase();
    return {
      fullName: this.currentFullNameSignal() || 'Usuario Invitado',
      role,
      roleLabel: role === 'ADMIN' ? 'Administrador' : 'Vendedor',
      identifier: this.currentIdentifierSignal() || '',
      email: this.currentIdentifierSignal() || '',
      dni: this.currentDniSignal() || 'Sin DNI',
      companyDomain: this.currentCompanyDomainSignal() || '',
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
  signIn(signInCommand: SignInCommand, router: Router, onError?: () => void): void {
    this.authLoadingSignal.set(true);
    this.iamApi.signIn(signInCommand).subscribe({
      next: (resource) => {
        // ← NUEVO: si el backend pide 2FA
        if (resource.requiresTotp) {
          this.authLoadingSignal.set(false);
          this.requiresTotpSignal.set(true);
          this.pendingTotpUserIdSignal.set(resource.userId!);
          router.navigate(['/totp-verify']);
          return;
        }

        const session: PersistedSession = {
          id: resource.id!,
          identifier: resource.identifier!,
          fullName: resource.fullName!,
          role: resource.role || 'SELLER',
          token: resource.token!,
          dni: resource.dni || 'Sin DNI',
          companyDomain: resource.companyDomain || '',
        };
        this.savePersistedSession(session);
        this.applySession(session);
        this.authLoadingSignal.set(false);
        router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Sign-in failed:', err);
        this.authLoadingSignal.set(false);
        this.clearPersistedSession();
        this.clearSessionSignals();
        onError?.();
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
          identifier: resource.identifier!,
          fullName: resource.fullName!,
          role:     resource.role  || 'SELLER',
          token:    resource.token!,
          dni:      resource.dni   || 'Sin DNI',
          companyDomain: resource.companyDomain || '',
        };
        this.requiresTotpSignal.set(false);
        this.pendingTotpUserIdSignal.set(null);
        this.savePersistedSession(session);
        this.applySession(session);
        onSuccess?.();
        router.navigate(['/home']);
      },
      error: () => onError?.()
    });
  }

  /**
   * Executes sign-up flow.
   */
  signUp(signUpCommand: SignUpCommand, router: Router, onError?: () => void): void {
    this.authLoadingSignal.set(true);
    this.iamApi.signUp(signUpCommand).subscribe({
      next: () => {
        this.authLoadingSignal.set(false);
        router.navigate(['/iam/sign-in']);
      },
      error: (err) => {
        console.error('Sign-up failed:', err);
        this.authLoadingSignal.set(false);
        onError?.();
      },
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
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        identifier: parsed.identifier ?? parsed.email ?? '',
        companyDomain: parsed.companyDomain ?? '',
      } as PersistedSession;
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
    this.currentIdentifierSignal.set(session.identifier);
    this.currentFullNameSignal.set(session.fullName);
    this.currentUserIdSignal.set(session.id);
    this.currentRoleSignal.set(session.role);
    this.currentTokenSignal.set(session.token);
    this.currentDniSignal.set(session.dni);
    this.currentCompanyDomainSignal.set(session.companyDomain);
  }

  private clearSessionSignals(): void {
    this.isSignedInSignal.set(false);
    this.currentIdentifierSignal.set(null);
    this.currentFullNameSignal.set(null);
    this.currentUserIdSignal.set(null);
    this.currentRoleSignal.set(null);
    this.currentTokenSignal.set(null);
    this.currentDniSignal.set(null);
    this.currentCompanyDomainSignal.set(null);
  }

}
