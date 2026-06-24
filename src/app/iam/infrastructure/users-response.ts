import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import {AccessStatus} from '../domain/model/access-status';

/**
 * Full user account representation including all profile fields.
 */
export interface UserResource extends BaseResource {
  id: string;
  email: string;
  fullName: string;
  dni: string;
  ruc: string;
  phone: string;
  businessName: string;
  accessStatus: AccessStatus;
}

/**
 * Response for collection queries.
 */
export interface UsersResponse extends BaseResponse {
  users: UserResource[];
}
