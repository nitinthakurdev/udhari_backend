"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("push_tokens", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      expo_push_token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      platform: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      device_name: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    const indexes = await queryInterface.showIndex("push_tokens");
    const indexNames = new Set(indexes.map(({ name }) => name));

    if (!indexNames.has("push_tokens_uuid_unique")) {
      await queryInterface.addIndex("push_tokens", ["uuid"], {
        name: "push_tokens_uuid_unique",
        unique: true,
      });
    }
    if (!indexNames.has("push_tokens_token_unique")) {
      await queryInterface.addIndex("push_tokens", ["expo_push_token"], {
        name: "push_tokens_token_unique",
        unique: true,
      });
    }
    if (!indexNames.has("push_tokens_user_id")) {
      await queryInterface.addIndex("push_tokens", ["user_id"], {
        name: "push_tokens_user_id",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("push_tokens");
  },
};
