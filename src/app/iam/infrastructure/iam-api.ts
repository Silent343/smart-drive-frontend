import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { SignInApiEndpoint } from './sign-in-api-endpoint';
import { SignInAssembler } from './sign-in-assembler';
import { SignInResource } from './sign-in-response';
import { SignUpApiEndpoint } from './sign-up-api-endpoint';
import { SignUpAssembler } from './sign-up-assembler';
import { SignUpResource } from './sign-up-response';
import {environment} from '../../../environments/environment';

export interface ForgotPasswordResult {
  requested: boolean;
  resetToken?: string | null;
}

export interface ResetPasswordResult {
  success: boolean;
}

export interface SellerResource {
  id: string;
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  code: string;
  dni: string;
  phone: string;
}

export interface RegisterSellerRequest {
  firstName: string;
  lastName: string;
  code: string;
  dni: string;
  phone: string;
}

export interface SellerRegistrationResult {
  id: string;
  username: string;
  initialPassword: string;
  fullName: string;
  code: string;
}

/**
 * Application service facade for IAM domain API operations.
 */
@Injectable({ providedIn: 'root' })
export class IamApi extends BaseApi {
  private readonly signUpEndpoint: SignUpApiEndpoint;
  private readonly signInEndpoint: SignInApiEndpoint;
  private readonly http: HttpClient;

  /**
   * Initializes the IAM API facade with required HTTP client and assemblers.
   * * @param http - Angular HttpClient
   */
  constructor(http: HttpClient) {
    super();
    this.http = http;
    this.signUpEndpoint = new SignUpApiEndpoint(http, new SignUpAssembler());
    this.signInEndpoint = new SignInApiEndpoint(http, new SignInAssembler());
  }

  /**
   * Registers a new user account using the provided registration command.
   * * @param signUpCommand - Domain command containing user profile and credentials
   * @returns Observable of the created user resource
   */
  signUp(signUpCommand: SignUpCommand): Observable<SignUpResource> {
    return this.signUpEndpoint.signUp(signUpCommand);
  }

  /**
   * Authenticates a user and returns an authentication resource containing the session token.
   * * @param signInCommand - Domain command containing email and password credentials
   * @returns Observable of the authenticated user resource
   */
  signIn(signInCommand: SignInCommand): Observable<SignInResource> {
    return this.signInEndpoint.signIn(signInCommand);
  }

  getTotpSetup(userId: string): Observable<{ qrCode: string; secret: string }> {
    return this.http.post<{ qrCode: string; secret: string }>(
      `${environment.platformProviderApiBaseUrl}/totp-setup`,
      { userId }
    );
  }

  verifyTotpSetup(userId: string, token: string): Observable<any> {
    return this.http.post(
      `${environment.platformProviderApiBaseUrl}/verify-totp-setup`,
      { userId, token }
    );
  }

  verifyTotp(userId: string, token: string): Observable<any> {
    return this.http.post(
      `${environment.platformProviderApiBaseUrl}/verify-totp`,
      { userId, token }
    );
  }

  forgotPassword(identifier: string): Observable<ForgotPasswordResult> {
    return this.http.post<ForgotPasswordResult>(
      `${environment.platformProviderApiBaseUrl}/authentication/forgot-password`,
      { identifier }
    );
  }

  resetPassword(token: string, newPassword: string): Observable<ResetPasswordResult> {
    return this.http.post<ResetPasswordResult>(
      `${environment.platformProviderApiBaseUrl}/authentication/reset-password`,
      { token, newPassword }
    );
  }

  listSellers(): Observable<SellerResource[]> {
    return this.http.get<SellerResource[]>(`${environment.platformProviderApiBaseUrl}/sellers`);
  }

  registerSeller(request: RegisterSellerRequest): Observable<SellerRegistrationResult> {
    return this.http.post<SellerRegistrationResult>(
      `${environment.platformProviderApiBaseUrl}/sellers`,
      request
    );
  }
}
