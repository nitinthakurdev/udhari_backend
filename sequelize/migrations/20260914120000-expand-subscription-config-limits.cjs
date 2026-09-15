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
         SET config = (
           COALESCE(config, '{}'::jsonb) - 'allowed_customers' - 'allowed_users'
         ) || jsonb_build_object(
           'allowed_transitions', COALESCE(config->'allowed_transitions', '0'::jsonb),
           'allowed_connected_customers', COALESCE(config->'allowed_connected_customers', config->'allowed_customers', '0'::jsonb),
           'allowed_connected_businesses', COALESCE(config->'allowed_connected_businesses', '0'::jsonb),
           'allowed_connected_users', COALESCE(config->'allowed_connected_users', config->'allowed_users', '0'::jsonb),
           'allowed_managed_businesses', COALESCE(config->'allowed_managed_businesses', '0'::jsonb)
         )`,
        { transaction },
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
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE subscriptions
         SET config = (
           COALESCE(config, '{}'::jsonb)
           - 'allowed_connected_customers'
           - 'allowed_connected_businesses'
           - 'allowed_connected_users'
           - 'allowed_managed_businesses'
         ) || jsonb_build_object(
           'allowed_customers', COALESCE(config->'allowed_connected_customers', '0'::jsonb),
           'allowed_users', COALESCE(config->'allowed_connected_users', '0'::jsonb)
         )`,
        { transaction },
      );
      await queryInterface.changeColumn(
        "subscriptions",
        "config",
        {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {
            allowed_transitions: 0,
            allowed_customers: 0,
            allowed_users: 0,
          },
        },
        { transaction },
      );
    });
  },
};
