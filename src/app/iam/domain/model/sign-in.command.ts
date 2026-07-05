export class SignInCommand {
  private readonly _identifier: string;
  private readonly _password: string;

  constructor(props: { identifier: string; password: string }) {
    this._identifier = props.identifier.trim().toLowerCase();
    this._password = props.password;
  }

  get identifier(): string { return this._identifier; }

  get password(): string { return this._password; }
}
