"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const subscriptionColumns = await queryInterface.describeTable("subscriptions");
      if (!subscriptionColumns["auto_renewal_enabled"]) {
        await queryInterface.addColumn(
          "subscriptions",
          "auto_renewal_enabled",
          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          { transaction },
        );
      }

      const assignmentColumns = await queryInterface.describeTable("user_subscriptions");
      if (!assignmentColumns["payment_provider"]) {
        await queryInterface.addColumn(
          "user_subscriptions",
          "payment_provider",
          { type: DataTypes.STRING(20), allowNull: false, defaultValue: "MANUAL" },
          { transaction },
        );
        await queryInterface.sequelize.query(
          `UPDATE "user_subscriptions"
           SET "payment_provider" = CASE
             WHEN "google_play_purchase_token" IS NOT NULL THEN 'GOOGLE_PLAY'
             WHEN "stripe_checkout_session_id" IS NOT NULL THEN 'STRIPE'
             ELSE 'MANUAL'
           END`,
          { transaction },
        );
      }
      if (!assignmentColumns["auto_renew"]) {
        await queryInterface.addColumn(
          "user_subscriptions",
          "auto_renew",
          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("user_subscriptions", "auto_renew", { transaction });
      await queryInterface.removeColumn("user_subscriptions", "payment_provider", { transaction });
      await queryInterface.removeColumn("subscriptions", "auto_renewal_enabled", { transaction });
    });
  },
};
