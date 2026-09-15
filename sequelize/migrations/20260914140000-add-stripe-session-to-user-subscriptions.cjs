"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const columns = await queryInterface.describeTable("user_subscriptions");
      if (!columns["stripe_checkout_session_id"]) {
        await queryInterface.addColumn(
          "user_subscriptions",
          "stripe_checkout_session_id",
          { type: DataTypes.STRING, allowNull: true },
          { transaction },
        );
      }
      const indexes = await queryInterface.showIndex("user_subscriptions", { transaction });
      if (!indexes.some((index) => index.name === "user_subscriptions_stripe_session_unique")) {
        await queryInterface.addIndex("user_subscriptions", ["stripe_checkout_session_id"], {
          name: "user_subscriptions_stripe_session_unique",
          unique: true,
          transaction,
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("user_subscriptions", "stripe_checkout_session_id");
  },
};
