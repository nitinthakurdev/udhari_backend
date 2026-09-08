import { sequelize } from "@/config/dbConfig";
import type { ISubscriptionModel } from "@/types/subscriptionTypes";
import { DataTypes } from "sequelize";

const subscriptionModel = sequelize.define<ISubscriptionModel>(
  "SubscriptionModel",
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "INR",
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duration_type: {
      type: DataTypes.ENUM("MONTHLY", "YEARLY", "QUARTERLY"),
      allowNull: false,
      defaultValue: "MONTHLY",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deleted_by: {
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
    tableName: "subscriptions",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      {
        name: "subscriptions_uuid_unique",
        unique: true,
        fields: ["uuid"],
      },
      {
        name: "subscriptions_name_role_unique",
        unique: true,
        fields: ["name", "role_id"],
        where: { deleted_at: null },
      },
    ],
  },
);



export { subscriptionModel };
