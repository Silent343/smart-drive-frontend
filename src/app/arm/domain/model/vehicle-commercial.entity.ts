import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class VehicleCommercial implements BaseEntity {
  private _id: string;
  private _vehicleId: string;
  private _userId: string;
  private _price: number;
  private _company: string;

  constructor(props: {
    id: string;
    vehicleId: string;
    userId: string;
    price: number;
    company: string;
  }) {
    this._id = props.id;
    this._vehicleId = props.vehicleId;
    this._userId = props.userId;
    this._price = props.price;
    this._company = props.company;
  }

  // ==========================================
  // GETTERS & SETTERS
  // ==========================================

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get vehicleId(): string {
    return this._vehicleId;
  }

  set vehicleId(value: string) {
    this._vehicleId = value;
  }

  get userId(): string {
    return this._userId;
  }

  set userId(value: string) {
    this._userId = value;
  }

  get price(): number {
    return this._price;
  }

  set price(value: number) {
    this._price = value;
  }

  get company(): string {
    return this._company;
  }

  set company(value: string) {
    this._company = value;
  }
}
