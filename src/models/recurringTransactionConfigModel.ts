import { sequelize } from "@/config/dbConfig";
import type { IRecurringTransactionConfigModel } from "@/types/recurringTransactionConfigTypes";
import { DataTypes } from "sequelize";

const recurringTransactionConfigModel = sequelize.define<IRecurringTransactionConfigModel>(
  "RecurringTransactionConfigModel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    customer_business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("product", "service"),
      allowNull: false,
      defaultValue: "product",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unit_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    week_days: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    time_ranges: {
      type: DataTypes.JSONB,
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
    tableName: "recurring_transaction_configs",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      {
        name: "recurring_transaction_configs_uuid_unique",
        unique: true,
        fields: ["uuid"],
      },
      {
        name: "recurring_transaction_configs_business_id",
        fields: ["business_id"],
      },
      {
        name: "recurring_transaction_configs_customer_id",
        fields: ["customer_id"],
      },
    ],
  },
);

export { recurringTransactionConfigModel };
