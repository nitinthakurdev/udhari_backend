import { sequelize } from "@/config/dbConfig";
import type { ITransitionModel } from "@/types/transitionTypes";
import { DataTypes } from "sequelize";

const transitionsModel = sequelize.define<ITransitionModel>(
  "TransitionsModel",
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
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    product_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    product_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "pending",
    },
    approved_by_user: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    approved_by_business: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    unit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
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
    tableName: "transitions",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      { name: "transitions_uuid_unique", unique: true, fields: ["uuid"] },
      { name: "transitions_user_id", fields: ["user_id"] },
      { name: "transitions_business_id", fields: ["business_id"] },
      { name: "transitions_unit_id", fields: ["unit_id"] },
    ],
  },
);

export { transitionsModel };
