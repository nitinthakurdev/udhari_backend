import type { Model, Optional } from "sequelize";

export type PushPlatform = "android" | "ios";

export interface IPushTokenSchema {
  id: number;
  uuid: string;
  user_id: number;
  expo_push_token: string;
  platform: PushPlatform;
  device_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export type IPushTokenCreationSchema = Optional<
  IPushTokenSchema,
  "id" | "uuid" | "device_name" | "created_at" | "updated_at"
>;

export interface IPushTokenModel
  extends Model<IPushTokenSchema, IPushTokenCreationSchema>, IPushTokenSchema {}

export interface IRegisterPushTokenPayload {
  expo_push_token: string;
  platform: PushPlatform;
  device_name?: string | null;
}
