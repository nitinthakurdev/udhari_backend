import { sequelize } from "@/config/dbConfig";
import type { IUserSubscriptionModel } from "@/types/userSubscriptionTypes";
import { DataTypes } from "sequelize";

const userSubscriptionModel = sequelize.define<IUserSubscriptionModel>(
  "UserSubscriptionModel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expiry_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    razorpay_order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    razorpay_payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    google_play_purchase_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    google_play_order_id: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    payment_provider: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "MANUAL",
      validate: { isIn: [["MANUAL", "FREE", "RAZORPAY", "GOOGLE_PLAY"]] },
    },
    auto_renew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_subscriptions",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      {
        name: "user_subscriptions_uuid_unique",
        unique: true,
        fields: ["uuid"],
      },
      {
        name: "user_subscriptions_user_id",
        fields: ["user_id"],
      },
      {
        name: "user_subscriptions_subscription_id",
        fields: ["subscription_id"],
      },
      {
        name: "user_subscriptions_user_expiry",
        fields: ["user_id", "expiry_at"],
      },
      {
        name: "user_subscriptions_razorpay_order_unique",
        unique: true,
        fields: ["razorpay_order_id"],
      },
      {
        name: "user_subscriptions_razorpay_payment_unique",
        unique: true,
        fields: ["razorpay_payment_id"],
      },
      {
        name: "user_subscriptions_google_play_token_unique",
        unique: true,
        fields: ["google_play_purchase_token"],
      },
    ],
  },
);

export { userSubscriptionModel };
