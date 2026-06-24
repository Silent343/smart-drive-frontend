import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface SignUpResource extends BaseResource {
  id: string;
  email: string;

}

export interface SignUpResponse extends BaseResponse, SignUpResource {}
