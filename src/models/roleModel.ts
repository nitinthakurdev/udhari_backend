import { sequelize } from "@/config/dbConfig";
import type { IRoleModel } from "@/types/roleTypes";
import { DataTypes } from "sequelize";

const roleModel = sequelize.define<IRoleModel>(
  "RoleModel",
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    slag: {
      type: DataTypes.STRING,
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
    tableName: "roles",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      {
        name: "roles_uuid_unique",
        unique: true,
        fields: ["uuid"],
      },
      {
        name: "roles_name_unique",
        unique: true,
        fields: ["name"],
      },
      {
        name: "roles_slag_unique",
        unique: true,
        fields: ["slag"],
      },
    ],
  },
);

void roleModel.sync();

export { roleModel };
