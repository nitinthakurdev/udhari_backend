import type { Model, Optional } from "sequelize";

export interface ITransitionSchema {
  id: number;
  uuid: string;
  user_id: number;
  business_id: number;
  unit_id: number;
  product_name: string;
  product_qty: number;
  product_price: number | string;
  total_price: number | string;
  status: string;
  approved_by_user: boolean;
  approved_by_business: boolean;
  comment: string | null;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type TransitionCreationSchema = Optional<
  ITransitionSchema,
  | "id"
  | "uuid"
  | "product_qty"
  | "total_price"
  | "status"
  | "approved_by_user"
  | "approved_by_business"
  | "comment"
  | "created_by"
  | "updated_by"
  | "deleted_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface ITransitionModel
  extends Model<ITransitionSchema, TransitionCreationSchema>, ITransitionSchema {}

export type ITransitionCreatePayload = Pick<
  ITransitionSchema,
  "user_id" | "business_id" | "unit_id" | "product_name" | "product_price" | "total_price"
> &
  Partial<Pick<ITransitionSchema, "product_qty" | "status" | "comment">>;

export type ITransitionCreateData = ITransitionCreatePayload & {
  created_by: number;
};

export type ITransitionUpdatePayload = Partial<
  Pick<
    ITransitionSchema,
    | "product_name"
    | "unit_id"
    | "product_qty"
    | "product_price"
    | "total_price"
    | "status"
    | "approved_by_user"
    | "approved_by_business"
    | "comment"
  >
>;

export type ITransitionUpdateData = ITransitionUpdatePayload & { updated_by: number };

export type ITransitionPublic = Pick<
  ITransitionSchema,
  | "uuid"
  | "user_id"
  | "business_id"
  | "unit_id"
  | "product_name"
  | "product_qty"
  | "product_price"
  | "status"
  | "approved_by_user"
  | "approved_by_business"
  | "comment"
  | "created_at"
  | "updated_at"
> & {
  product_price: number;
  total_price: number;
};

export interface ITransitionAccess {
  userExists: boolean;
  businessExists: boolean;
  connectionExists: boolean;
  canAccess: boolean;
  isUser: boolean;
  isBusinessOwner: boolean;
}
