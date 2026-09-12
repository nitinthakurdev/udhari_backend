import { sequelize } from "@/config/dbConfig";
import type { IUnitModel } from "@/types/unitTypes";
import { DataTypes } from "sequelize";

const unitModel = sequelize.define<IUnitModel>(
  "UnitModel",
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
      type: DataTypes.STRING(50),
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
    tableName: "management_units",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      { name: "management_units_uuid_unique", unique: true, fields: ["uuid"] },
      {
        name: "management_units_creator_name_unique",
        unique: true,
        fields: ["name", "created_by"],
        where: { deleted_at: null },
      },
    ],
  },
);

export { unitModel };
