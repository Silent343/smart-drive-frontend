import { SignInResource, SignInResponse } from './sign-in-response';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInRequest } from './sign-in.request';

export class SignInAssembler {
  toResourceFromResponse(response: SignInResponse): SignInResource {
    return {
      id: response.id,
      email: response.email,
      fullName: response.fullName,
      token: response.token,
      role: response.role,
      dni: response.dni,
      requiresTotp: response.requiresTotp,  // ← faltaba esto
      userId:       response.userId,
    } as SignInResource;
  }

  toRequestFromCommand(command: SignInCommand): SignInRequest {
    return {
      email: command.email, // Mapeo correcto
      password: command.password,
    } as SignInRequest;
  }
}
