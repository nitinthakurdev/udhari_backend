import type { Model, Optional } from "sequelize";

export interface IOrganizationSchema {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  country: string;
  state: string;
  city: string;
  address: string;
  address_2: string | null;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type OrganizationCreationSchema = Optional<
  IOrganizationSchema,
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

export interface IOrganizationModel
  extends Model<IOrganizationSchema, OrganizationCreationSchema>, IOrganizationSchema {}

export type IOrganizationCreatePayload = Pick<
  IOrganizationSchema,
  "name" | "slug" | "country" | "state" | "city" | "address"
> &
  Partial<Pick<IOrganizationSchema, "address_2"  | "created_by">>;

export type IOrganizationPublic = Pick<
  IOrganizationSchema,
  | "uuid"
  | "name"
  | "slug"
  | "country"
  | "state"
  | "city"
  | "address"
  | "address_2"
  | "created_at"
  | "updated_at"
>;
