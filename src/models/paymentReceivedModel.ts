import { sequelize } from "@/config/dbConfig";
import type { IPaymentReceivedModel } from "@/types/paymentReceivedTypes";
import { DataTypes } from "sequelize";

const paymentReceivedModel = sequelize.define<IPaymentReceivedModel>(
  "PaymentReceivedModel",
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
    billing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    transition_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount_received: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0.01 },
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
    tableName: "payments_received",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      { name: "payments_received_uuid_unique", unique: true, fields: ["uuid"] },
      { name: "payments_received_billing_id", fields: ["billing_id"] },
      { name: "payments_received_transition_id", fields: ["transition_id"] },
    ],
  },
);

export { paymentReceivedModel };
