import type { Model, Optional } from "sequelize";

export interface IUserSchema {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string | null;
  email: string;
  username: string;
  phone: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  verification_token: string | null;
  verification_token_expiry: Date | null;
  dial_code: string | null;
  otp: string | null;
  otp_expiry: Date | null;
  score: number;
  role_id: number;
  password: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type UserCreationSchema = Optional<
  IUserSchema,
  | "id"
  | "uuid"
  | "last_name"
  | "dial_code"
  | "is_email_verified"
  | "is_phone_verified"
  | "verification_token"
  | "verification_token_expiry"
  | "otp"
  | "otp_expiry"
  | "score"
  | "created_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface IUserModel extends Model<IUserSchema, UserCreationSchema>, IUserSchema { }

export interface IUserCreatePayload {
  first_name: string;
  last_name: string | null;
  email: string;
  username: string;
  phone: string;
  dial_code?: string | null;
  password: string;
}

export interface IUserCreateData extends IUserCreatePayload {
  role_id: number;
}

export interface IUserSigninPayload {
  identifier: string;
  password: string;
}

export type ICurrentUser = Pick<
  IUserSchema,
  | "id"
  | "uuid"
  | "first_name"
  | "last_name"
  | "email"
  | "username"
  | "phone"
  | "dial_code"
  | "is_email_verified"
  | "is_phone_verified"
  | "role_id"
  | "created_at"
>;

export type IUserPublic = Pick<
  IUserSchema,
  | "uuid"
  | "first_name"
  | "last_name"
  | "email"
  | "username"
  | "phone"
  | "dial_code"
  | "is_email_verified"
  | "is_phone_verified"
  | "score"
  | "created_at"
  | "updated_at"
>;
