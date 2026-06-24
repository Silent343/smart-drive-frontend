import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { AccessStatus } from './access-status'; // Asegúrate de importar el tipo

/**
 * Represents a registered Administrator in the system.
 */
export class AdminUser implements BaseEntity {
  private _id: string;
  private _email: string;
  private _fullName: string;
  private _dni: string;
  private _ruc: string;
  private _phone: string;
  private _businessName: string;
  private _accessStatus: AccessStatus;

  /**
   * @param {Object} props - Initialization properties.
   */
  constructor(props: {
    id: string;
    email: string;
    fullName: string;
    dni: string;
    ruc: string;
    phone: string;
    businessName: string;
    accessStatus?: AccessStatus; // Opcional al crear, por defecto 'active'
  }) {
    this._id = props.id;
    this._email = props.email.toLowerCase();
    this._fullName = props.fullName;
    this._dni = props.dni;
    this._ruc = props.ruc;
    this._phone = props.phone;
    this._businessName = props.businessName;
    this._accessStatus = props.accessStatus || 'active'; // QA Good practice: default to active
  }

  get id(): string { return this._id; }
  get email(): string { return this._email; }
  get fullName(): string { return this._fullName; }
  get dni(): string { return this._dni; }
  get ruc(): string { return this._ruc; }
  get phone(): string { return this._phone; }
  get businessName(): string { return this._businessName; }

  /** @returns {AccessStatus} The current operational state. */
  get accessStatus(): AccessStatus { return this._accessStatus; }

  /** Updates the access status (useful for lock/suspend operations). */
  set accessStatus(status: AccessStatus) { this._accessStatus = status; }
}
