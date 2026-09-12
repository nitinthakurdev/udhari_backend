import type { Model, Optional } from "sequelize";

export interface IUnitSchema {
  id: number;
  uuid: string;
  name: string;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type UnitCreationSchema = Optional<
  IUnitSchema,
  | "id"
  | "uuid"
  | "created_by"
  | "updated_by"
  | "deleted_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface IUnitModel extends Model<IUnitSchema, UnitCreationSchema>, IUnitSchema {}

export type IUnitCreatePayload = Pick<IUnitSchema, "name">;

export type IUnitCreateData = IUnitCreatePayload & { created_by: number };

export type IUnitUpdatePayload = Partial<Pick<IUnitSchema, "name">>;

export type IUnitUpdateData = IUnitUpdatePayload & { updated_by: number };

export type IUnitPublic = Pick<
  IUnitSchema,
  "id" | "uuid" | "name" | "created_by" | "created_at" | "updated_at"
> & {
  can_manage: boolean;
};
