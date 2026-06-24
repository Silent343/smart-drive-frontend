import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { VehicleCommercial } from './vehicle-commercial.entity';
import {VehicleSpecification} from './vehicle-specification.entity';

export class Vehicle implements BaseEntity {
  private _id: string;
  private _code: string;
  private _status: string;
  private _imageUrl: string | null;

  // Instancias de las particiones
  private _specification?: VehicleSpecification;
  private _commercial?: VehicleCommercial;

  constructor(props: {
    id: string;
    code: string;
    status: string;
    imageUrl?: string | null;
    specification?: VehicleSpecification;
    commercial?: VehicleCommercial;
  }) {
    this._id = props.id;
    this._code = props.code;
    this._status = props.status;
    this._imageUrl = props.imageUrl ?? null;
    this._specification = props.specification;
    this._commercial = props.commercial;
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

  get code(): string {
    return this._code;
  }

  set code(value: string) {
    this._code = value;
  }

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get imageUrl(): string | null {
    return this._imageUrl;
  }

  set imageUrl(value: string | null) {
    this._imageUrl = value;
  }

  get specification(): VehicleSpecification | undefined {
    return this._specification;
  }

  set specification(value: VehicleSpecification | undefined) {
    this._specification = value;
  }

  get commercial(): VehicleCommercial | undefined {
    return this._commercial;
  }

  set commercial(value: VehicleCommercial | undefined) {
    this._commercial = value;
  }
}
