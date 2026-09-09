import type { Model, Optional } from "sequelize";
import type { IOrganizationPublic } from "@/types/organizationTypes";
import type { IRoleSchema } from "@/types/roleTypes";

export type IUserRole = Pick<IRoleSchema, "uuid" | "name" | "slug" | "created_at">;
export type IUserUniqueField = "email" | "username" | "phone";

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
  password_reset_token: string | null;
  password_reset_token_expiry: Date | null;
  organization_id: number | null;
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
  user_role?: IUserRole;
  organization?: IOrganizationPublic | null;
}

export type IUserCreationSchema = Optional<
  IUserSchema,
  | "id"
  | "uuid"
  | "last_name"
  | "dial_code"
  | "is_email_verified"
  | "is_phone_verified"
  | "verification_token"
  | "verification_token_expiry"
  | "password_reset_token"
  | "password_reset_token_expiry"
  | "organization_id"
  | "otp"
  | "otp_expiry"
  | "score"
  | "created_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface IUserModel extends Model<IUserSchema, IUserCreationSchema>, IUserSchema {}

export interface IUserCreatePayload {
  first_name: string;
  last_name: string | null;
  email: string;
  username: string;
  phone: string;
  dial_code?: string | null;
  password: string;
}

export interface IUserUpdateSchema {
  first_name?: string;
  last_name?: string | null;
  email?: string;
  username?: string;
  phone?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  verification_token?: string | null;
  verification_token_expiry?: Date | null;
  password_reset_token?: string | null;
  password_reset_token_expiry?: Date | null;
  organization_id?: number | null;
  dial_code?: string | null;
  otp?: string | null;
  otp_expiry?: Date | null;
  score?: number;
  role_id?: number;
  password?: string | null;
  created_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface IUserCreateData extends IUserCreatePayload {
  role_id: number;
  verification_token?: string | null;
  verification_token_expiry?: Date | null;
}

export interface IUserSigninPayload {
  identifier: string;
  password: string;
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  token: string;
  password: string;
}

export interface IResendVerificationPayload {
  email?: string;
  token?: string;
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
  | "created_at"
> & {
  user_role?: IUserRole;
  organization?: IOrganizationPublic | null;
};

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
  | "user_role"
  | "score"
  | "created_at"
  | "updated_at"
>;

export type IUserAdminListItem = Pick<
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
  | "user_role"
  | "organization"
>;
