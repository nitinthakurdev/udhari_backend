import type { Model, Optional } from "sequelize";

export interface IPaymentReceivedSchema {
  id: number;
  uuid: string;
  billing_id: number;
  transition_id: number;
  amount_received: number | string;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type PaymentReceivedCreationSchema = Optional<
  IPaymentReceivedSchema,
  "id" | "uuid" | "created_by" | "updated_by" | "created_at" | "updated_at" | "deleted_at"
>;

export interface IPaymentReceivedModel
  extends Model<IPaymentReceivedSchema, PaymentReceivedCreationSchema>, IPaymentReceivedSchema {}

export type PaymentReceivedCreationData = Pick<
  IPaymentReceivedSchema,
  "billing_id" | "transition_id" | "amount_received" | "created_by"
>;
