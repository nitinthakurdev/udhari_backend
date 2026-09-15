"use strict";

const { DataTypes } = require("sequelize");

const defaultConfig = {
  allowed_transitions: 0,
  allowed_connected_customers: 0,
  allowed_connected_businesses: 0,
  allowed_connected_users: 0,
  allowed_managed_businesses: 0,
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE subscriptions
         SET config = CAST(:defaultConfig AS jsonb) || COALESCE(config, '{}'::jsonb)`,
        {
          replacements: { defaultConfig: JSON.stringify(defaultConfig) },
          transaction,
        },
      );
      await queryInterface.changeColumn(
        "subscriptions",
        "config",
        {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: defaultConfig,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.changeColumn("subscriptions", "config", {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    });
  },
};
