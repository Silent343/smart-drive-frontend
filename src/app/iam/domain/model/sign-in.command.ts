/**
 * Command to encapsulate the intent to authenticate via e-mail and password.
 */
export class SignInCommand {
  private readonly _email: string;
  private readonly _password: string;

  /**
   * @param {Object} props - Credentials.
   * @param {string} props.email - Authentication email.
   * @param {string} props.password - User secret key.
   */
  constructor(props: { email: string; password: string }) {
    this._email = props.email.toLowerCase();
    this._password = props.password;
  }

  /** @returns {string} Email identifier. */
  get email(): string { return this._email; }

  /** @returns {string} Password. */
  get password(): string { return this._password; }
}
