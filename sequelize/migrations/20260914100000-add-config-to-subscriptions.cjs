"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn("subscriptions", "config", {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        allowed_transitions: 0,
        allowed_connected_customers: 0,
        allowed_connected_businesses: 0,
        allowed_connected_users: 0,
        allowed_managed_businesses: 0,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("subscriptions", "config");
  },
};
