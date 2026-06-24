import { SignUpResource, SignUpResponse } from './sign-up-response';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { SignUpRequest } from './sign-up.request';

/**
 * Assembler for converting between SignUpCommand domain commands
 * and infrastructure payloads.
 */
export class SignUpAssembler {

  /**
   * Converts API response to application resource.
   */
  toResourceFromResponse(response: SignUpResponse): SignUpResource {
    return {
      id: response.id,
      email: response.email,
    } as SignUpResource;
  }

  /**
   * Converts domain sign-up command to API request payload.
   */
  toRequestFromCommand(command: SignUpCommand): SignUpRequest {
    return {
      email: command.email,
      password: command.password,
      fullName: command.fullName,
      dni: command.dni,
      ruc: command.ruc,
      phone: command.phone,
      businessName: command.businessName,
    } as SignUpRequest;
  }
}
