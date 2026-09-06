import type { Model, Optional } from "sequelize";

export interface IRoleSchema {
  id: number;
  uuid: string;
  name: string;
  slag: string;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type RoleCreationSchema = Optional<
  IRoleSchema,
  | "id"
  | "uuid"
  | "created_by"
  | "updated_by"
  | "deleted_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface IRoleModel extends Model<IRoleSchema, RoleCreationSchema>, IRoleSchema {}

export type IRoleCreatePayload = Pick<IRoleSchema, "name" | "slag"> &
  Partial<Pick<IRoleSchema, "created_by">>;

export type IRolePublic = Pick<IRoleSchema, "uuid" | "name" | "slag" | "created_at" | "updated_at">;
