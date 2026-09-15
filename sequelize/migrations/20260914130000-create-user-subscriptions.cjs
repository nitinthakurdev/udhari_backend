"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableName = "user_subscriptions";
      const tables = await queryInterface.showAllTables({ transaction });

      if (!tables.includes(tableName)) {
        await queryInterface.createTable(
          tableName,
          {
            id: {
              type: DataTypes.INTEGER,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false,
            },
            uuid: {
              type: DataTypes.STRING,
              allowNull: false,
            },
            user_id: {
              type: DataTypes.INTEGER,
              allowNull: false,
              references: { model: "users", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            subscription_id: {
              type: DataTypes.INTEGER,
              allowNull: false,
              references: { model: "subscriptions", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            expiry_at: {
              type: DataTypes.DATE,
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
          { transaction },
        );
      }

      const existingIndexes = new Set(
        (await queryInterface.showIndex(tableName, { transaction })).map((index) => index.name),
      );
      if (!existingIndexes.has("user_subscriptions_uuid_unique")) {
        await queryInterface.addIndex(tableName, ["uuid"], {
          name: "user_subscriptions_uuid_unique",
          unique: true,
          transaction,
        });
      }
      if (!existingIndexes.has("user_subscriptions_user_id")) {
        await queryInterface.addIndex(tableName, ["user_id"], {
          name: "user_subscriptions_user_id",
          transaction,
        });
      }
      if (!existingIndexes.has("user_subscriptions_subscription_id")) {
        await queryInterface.addIndex(tableName, ["subscription_id"], {
          name: "user_subscriptions_subscription_id",
          transaction,
        });
      }
      if (!existingIndexes.has("user_subscriptions_user_expiry")) {
        await queryInterface.addIndex(tableName, ["user_id", "expiry_at"], {
          name: "user_subscriptions_user_expiry",
          transaction,
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_subscriptions");
  },
};
