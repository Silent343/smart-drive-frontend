import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of authenticated user data.
 */
export interface SignInResource extends BaseResource {
  id: string;
  email: string;
  fullName: string;
  token: string;
  role: string;
  dni: string;
  requiresTotp?: boolean;
  userId?: string;
}

/**
 * Response envelope for sign-in.
 */
export interface SignInResponse extends BaseResponse, SignInResource {}
