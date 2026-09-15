"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const subscriptionColumns = await queryInterface.describeTable("subscriptions");
      if (!subscriptionColumns["google_play_product_id"]) {
        await queryInterface.addColumn(
          "subscriptions",
          "google_play_product_id",
          { type: DataTypes.STRING(200), allowNull: true },
          { transaction },
        );
      }

      const subscriptionIndexes = await queryInterface.showIndex("subscriptions", { transaction });
      if (
        !subscriptionIndexes.some(
          (index) => index.name === "subscriptions_google_play_product_unique",
        )
      ) {
        await queryInterface.addIndex("subscriptions", ["google_play_product_id"], {
          name: "subscriptions_google_play_product_unique",
          unique: true,
          transaction,
        });
      }

      const userSubscriptionColumns = await queryInterface.describeTable("user_subscriptions");
      if (!userSubscriptionColumns["google_play_purchase_token"]) {
        await queryInterface.addColumn(
          "user_subscriptions",
          "google_play_purchase_token",
          { type: DataTypes.TEXT, allowNull: true },
          { transaction },
        );
      }
      if (!userSubscriptionColumns["google_play_order_id"]) {
        await queryInterface.addColumn(
          "user_subscriptions",
          "google_play_order_id",
          { type: DataTypes.STRING(200), allowNull: true },
          { transaction },
        );
      }

      const userSubscriptionIndexes = await queryInterface.showIndex("user_subscriptions", {
        transaction,
      });
      if (
        !userSubscriptionIndexes.some(
          (index) => index.name === "user_subscriptions_google_play_token_unique",
        )
      ) {
        await queryInterface.addIndex("user_subscriptions", ["google_play_purchase_token"], {
          name: "user_subscriptions_google_play_token_unique",
          unique: true,
          transaction,
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        "user_subscriptions",
        "user_subscriptions_google_play_token_unique",
        { transaction },
      );
      await queryInterface.removeColumn("user_subscriptions", "google_play_order_id", {
        transaction,
      });
      await queryInterface.removeColumn("user_subscriptions", "google_play_purchase_token", {
        transaction,
      });
      await queryInterface.removeIndex(
        "subscriptions",
        "subscriptions_google_play_product_unique",
        { transaction },
      );
      await queryInterface.removeColumn("subscriptions", "google_play_product_id", { transaction });
    });
  },
};
