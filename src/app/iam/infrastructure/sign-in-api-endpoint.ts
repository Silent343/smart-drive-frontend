import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { SignInAssembler } from './sign-in-assembler';
import { SignInCommand } from '../domain/model/sign-in.command';
import { catchError, map, Observable } from 'rxjs';
import { SignInResource, SignInResponse } from './sign-in-response';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

const signInApiEndpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignInEndpointPath}`;

/**
 * HTTP endpoint client for user sign-in (authentication) operations.
 *
 * @remarks
 * This endpoint encapsulates all HTTP communication for the sign-in operation
 * in the IAM domain. It handles the authentication workflow by converting
 * domain commands to HTTP requests and responses to application resources.
 */
export class SignInApiEndpoint extends ErrorHandlingEnabledBaseType {
  /**
   * Creates an instance of SignInApiEndpoint.
   *
   * @param http - Angular HttpClient for making HTTP requests
   * @param assembler - The assembler for converting between commands, requests, and responses
   */
  constructor(
    private http: HttpClient,
    private assembler: SignInAssembler,
  ) {
    super();
  }

  /**
   * Authenticates a user with the remote IAM endpoint.
   *
   * @param signInCommand - Domain command containing user credentials (username and password)
   * @returns Observable stream emitting the authenticated user resource including access token and role
   */
  signIn(signInCommand: SignInCommand): Observable<SignInResource> {
    const signInRequest = this.assembler.toRequestFromCommand(signInCommand);
    return this.http.post<SignInResponse>(signInApiEndpointUrl, signInRequest).pipe(
      map((response) => this.assembler.toResourceFromResponse(response)),
      catchError(this.handleError('Failed to sign-in')),
    );
  }
}
