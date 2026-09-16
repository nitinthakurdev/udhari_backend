import { sequelize } from "@/config/dbConfig";
import type { IPushTokenModel } from "@/types/pushNotificationTypes";
import { DataTypes } from "sequelize";

export const pushTokenModel = sequelize.define<IPushTokenModel>(
  "PushTokenModel",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    expo_push_token: { type: DataTypes.STRING(255), allowNull: false },
    platform: {
      type: DataTypes.STRING(16),
      allowNull: false,
      validate: { isIn: [["android", "ios"]] },
    },
    device_name: { type: DataTypes.STRING(120), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: "push_tokens",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { name: "push_tokens_uuid_unique", unique: true, fields: ["uuid"] },
      {
        name: "push_tokens_token_unique",
        unique: true,
        fields: ["expo_push_token"],
      },
      { name: "push_tokens_user_id", fields: ["user_id"] },
    ],
  },
);
