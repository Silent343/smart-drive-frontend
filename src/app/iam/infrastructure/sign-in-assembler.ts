import { SignInResource, SignInResponse } from './sign-in-response';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInRequest } from './sign-in.request';

export class SignInAssembler {
  toResourceFromResponse(response: SignInResponse): SignInResource {
    return {
      id: response.id,
      identifier: response.identifier,
      fullName: response.fullName,
      token: response.token,
      role: response.role,
      dni: response.dni,
      companyDomain: response.companyDomain,
      requiresTotp: response.requiresTotp,
      userId: response.userId,
    } as SignInResource;
  }

  toRequestFromCommand(command: SignInCommand): SignInRequest {
    return {
      identifier: command.identifier,
      password: command.password,
    } as SignInRequest;
  }
}
