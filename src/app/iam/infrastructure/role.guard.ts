import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../application/iam.store';

/**
 * Factory returning a guard that only allows users whose role is in {@code allowedRoles}.
 * Unauthorized users are redirected to the home dashboard.
 *
 * @example
 * { path: 'workers', canActivate: [iamGuard, roleGuard(['ADMIN'])] }
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  const normalized = allowedRoles.map(role => role.toUpperCase());
  return () => {
    const store = inject(IamStore);
    const router = inject(Router);
    const role = (store.currentRole() ?? '').toUpperCase();
    if (normalized.includes(role)) return true;
    return router.createUrlTree(['/home']);
  };
};
