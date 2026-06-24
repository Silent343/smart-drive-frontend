import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class VehicleSpecification implements BaseEntity {
  private _id: string;
  private _vehicleId: string;
  private _brand: string;
  private _model: string;
  private _year: number;
  private _transmission: string;

  constructor(props: {
    id: string;
    vehicleId: string;
    brand: string;
    model: string;
    year: number;
    transmission: string;
  }) {
    this._id = props.id;
    this._vehicleId = props.vehicleId;
    this._brand = props.brand;
    this._model = props.model;
    this._year = props.year;
    this._transmission = props.transmission;
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

  get brand(): string {
    return this._brand;
  }

  set brand(value: string) {
    this._brand = value;
  }

  get model(): string {
    return this._model;
  }

  set model(value: string) {
    this._model = value;
  }

  get year(): number {
    return this._year;
  }

  set year(value: number) {
    this._year = value;
  }

  get transmission(): string {
    return this._transmission;
  }

  set transmission(value: string) {
    this._transmission = value;
  }
}
