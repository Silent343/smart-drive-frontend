/**
 * Command to encapsulate the intent of creating a new Administrator account.
 */
export class SignUpCommand {
  private readonly _email: string;
  private readonly _password: string;
  private readonly _fullName: string;
  private readonly _dni: string;
  private readonly _ruc: string;
  private readonly _phone: string;
  private readonly _businessName: string;
  private readonly _companyDomain: string;
  private readonly _maxWorkers: number;

  /**
   * @param {Object} props - Sign-up credentials and profile info.
   */
  constructor(props: {
    email: string;
    password: string;
    fullName: string;
    dni: string;
    ruc: string;
    phone: string;
    businessName: string;
    companyDomain: string;
    maxWorkers: number;
  }) {
    this._email = props.email.toLowerCase();
    this._password = props.password;
    this._fullName = props.fullName;
    this._dni = props.dni;
    this._ruc = props.ruc;
    this._phone = props.phone;
    this._businessName = props.businessName;
    this._companyDomain = props.companyDomain.trim().toLowerCase();
    this._maxWorkers = props.maxWorkers;
  }

  /** @returns {string} The email used for authentication. */
  get email(): string { return this._email; }

  /** @returns {string} The raw password string. */
  get password(): string { return this._password; }

  /** @returns {string} User full name. */
  get fullName(): string { return this._fullName; }

  /** @returns {string} User DNI. */
  get dni(): string { return this._dni; }

  /** @returns {string} User RUC. */
  get ruc(): string { return this._ruc; }

  /** @returns {string} User phone. */
  get phone(): string { return this._phone; }

  /** @returns {string} User business name. */
  get businessName(): string { return this._businessName; }

  get companyDomain(): string { return this._companyDomain; }

  get maxWorkers(): number { return this._maxWorkers; }
}
