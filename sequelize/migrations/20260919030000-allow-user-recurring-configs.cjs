"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("recurring_transaction_configs", "business_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("recurring_transaction_configs", "business_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
