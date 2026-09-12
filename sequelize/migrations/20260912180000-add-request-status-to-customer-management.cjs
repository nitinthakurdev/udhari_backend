"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("customer_management", "request_status", {
      type: Sequelize.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "approved",
    });

    await queryInterface.changeColumn("customer_management", "request_status", {
      type: Sequelize.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("customer_management", "request_status");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_customer_management_request_status";',
    );
  },
};
