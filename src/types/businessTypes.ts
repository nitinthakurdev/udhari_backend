import type { Model, Optional } from "sequelize";

export interface IBusinessSchema {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  address: string;
  address_2: string | null;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type BusinessCreationSchema = Optional<
  IBusinessSchema,
  | "id"
  | "uuid"
  | "address_2"
  | "created_by"
  | "updated_by"
  | "deleted_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface IBusinessModel
  extends Model<IBusinessSchema, BusinessCreationSchema>, IBusinessSchema {}

export type IBusinessCreatePayload = Pick<
  IBusinessSchema,
  "name" | "slug" | "country" | "state" | "city" | "pincode" | "address"
> &
  Partial<Pick<IBusinessSchema, "address_2" | "created_by">>;

export type IBusinessUpdatePayload = Partial<
  Pick<IBusinessSchema, "name" | "country" | "state" | "city" | "pincode" | "address" | "address_2">
>;

export type IBusinessUpdateData = IBusinessUpdatePayload &
  Partial<Pick<IBusinessSchema, "slug" | "updated_by">>;

export type IBusinessPublic = Pick<
  IBusinessSchema,
  | "uuid"
  | "name"
  | "slug"
  | "country"
  | "state"
  | "city"
  | "pincode"
  | "address"
  | "address_2"
  | "created_at"
  | "updated_at"
>;
