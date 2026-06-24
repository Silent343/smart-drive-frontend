import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class Client implements BaseEntity{
  private _id: string;
  private _userId: string;
  private _name: string;
  private _dni: string;
  private _income: number;
  private _occupation: string;
  private _phone: string;
  private _vehicleId: string;

  constructor(props:{
     id: string;
     userId: string;
     name: string;
     dni: string;
     income: number;
     occupation: string;
     phone: string;
     vehicleId: string;
  }) {
    this._id = props.id;
    this._userId = props.userId;
    this._name = props.name;
    this._dni = props.dni;
    this._income = props.income;
    this._occupation = props.occupation;
    this._phone = props.phone;
    this._vehicleId = props.vehicleId
  }


  get userId(): string {
    return this._userId;
  }

  set userId(value: string) {
    this._userId = value;
  }

  get vehicleId(): string {
    return this._vehicleId;
  }

  set vehicleId(value: string) {
    this._vehicleId = value;
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get dni(): string {
    return this._dni;
  }

  set dni(value: string) {
    this._dni = value;
  }

  get income(): number {
    return this._income;
  }

  set income(value: number) {
    this._income = value;
  }

  get occupation(): string {
    return this._occupation;
  }

  set occupation(value: string) {
    this._occupation = value;
  }

  get phone(): string {
    return this._phone;
  }

  set phone(value: string) {
    this._phone = value;
  }
}
