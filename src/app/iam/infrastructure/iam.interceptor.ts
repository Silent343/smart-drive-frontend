import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { IamStore } from '../application/iam.store';

/**
 * HTTP interceptor that automatically adds IAM authentication credentials to outgoing requests.
 *
 * @remarks
 * In Angular, an interceptor is a service that can intercept HTTP requests and responses.
 * This interceptor implements the HttpInterceptorFn function type and:
 * - Reads the authentication token from the IamStore
 * - Adds the token to the Authorization header of outgoing requests (when authenticated)
 * - Uses the standard Bearer token authentication scheme
 * - Passes unmodified requests when no token is available (guest/public endpoints)
 *
 * This interceptor should be registered in the application configuration:
 *
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(withInterceptors([iamInterceptor])),
 *     // other providers
 *   ]
 * };
 * ```
 *
 * @param request - The outgoing HTTP request to be intercepted
 * @param next - The next handler in the interceptor chain
 * @returns The HTTP request handler chain, with the token added to headers if available
 */
export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(IamStore);
  const token = store.currentToken();

  const handledRequest = token
    ? request.clone({ headers: request.headers.set('Authorization', `Bearer ${token}`) })
    : request;

  return next(handledRequest);
};
