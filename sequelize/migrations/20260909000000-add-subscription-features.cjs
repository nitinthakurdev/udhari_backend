"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("subscriptions", "features", {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("subscriptions", "features");
  },
};
