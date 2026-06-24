/**
 * HTTP request payload for sign-up operations.
 */
export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  dni: string;
  ruc: string;
  phone: string;
  businessName: string;
}
