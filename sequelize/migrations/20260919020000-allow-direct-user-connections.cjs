"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("customer_management", "business_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("customer_management", "business_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
