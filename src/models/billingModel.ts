import { sequelize } from "@/config/dbConfig";
import type { IBillingModel } from "@/types/billingTypes";
import { DataTypes, Op } from "sequelize";

const billingModel = sequelize.define<IBillingModel>(
  "BillingModel",
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
    current_outstanding: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    business_owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date_of_month: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date_of_month: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    extend_due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: "billings",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      { name: "billings_uuid_unique", unique: true, fields: ["uuid"] },
      { name: "billings_customer_id", fields: ["customer_id"] },
      { name: "billings_customer_business_id", fields: ["customer_business_id"] },
      { name: "billings_business_id", fields: ["business_id"] },
      { name: "billings_business_owner_id", fields: ["business_owner_id"] },
      {
        name: "billings_user_business_month_unique",
        unique: true,
        fields: ["customer_id", "business_id", "start_date_of_month", "end_date_of_month"],
        where: { customer_business_id: null },
      },
      {
        name: "billings_business_pair_month_unique",
        unique: true,
        fields: ["customer_business_id", "business_id", "start_date_of_month", "end_date_of_month"],
        where: { customer_business_id: { [Op.ne]: null } },
      },
    ],
  },
);

export { billingModel };
