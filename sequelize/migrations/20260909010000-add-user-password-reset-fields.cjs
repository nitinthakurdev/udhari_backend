"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "password_reset_token", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "password_reset_token_expiry", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex("users", ["password_reset_token"], {
      name: "users_password_reset_token_unique",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("users", "users_password_reset_token_unique");
    await queryInterface.removeColumn("users", "password_reset_token_expiry");
    await queryInterface.removeColumn("users", "password_reset_token");
  },
};
