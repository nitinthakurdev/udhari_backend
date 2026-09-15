"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const columns = await queryInterface.describeTable("user_subscriptions");
      const indexes = await queryInterface.showIndex("user_subscriptions", { transaction });

      if (!columns["razorpay_order_id"]) {
        await queryInterface.addColumn(
          "user_subscriptions",
          "razorpay_order_id",
          { type: DataTypes.STRING(255), allowNull: true },
          { transaction },
        );
      }
      if (!columns["razorpay_payment_id"]) {
        await queryInterface.addColumn(
          "user_subscriptions",
          "razorpay_payment_id",
          { type: DataTypes.STRING(255), allowNull: true },
          { transaction },
        );
      }
      if (!columns["legacy_payment_reference"] && columns["stripe_checkout_session_id"]) {
        if (indexes.some((index) => index.name === "user_subscriptions_stripe_session_unique")) {
          await queryInterface.removeIndex(
            "user_subscriptions",
            "user_subscriptions_stripe_session_unique",
            { transaction },
          );
        }
        await queryInterface.renameColumn(
          "user_subscriptions",
          "stripe_checkout_session_id",
          "legacy_payment_reference",
          { transaction },
        );
      }

      const updatedIndexes = await queryInterface.showIndex("user_subscriptions", { transaction });
      if (
        !updatedIndexes.some((index) => index.name === "user_subscriptions_razorpay_order_unique")
      ) {
        await queryInterface.addIndex("user_subscriptions", ["razorpay_order_id"], {
          name: "user_subscriptions_razorpay_order_unique",
          unique: true,
          transaction,
        });
      }
      if (
        !updatedIndexes.some((index) => index.name === "user_subscriptions_razorpay_payment_unique")
      ) {
        await queryInterface.addIndex("user_subscriptions", ["razorpay_payment_id"], {
          name: "user_subscriptions_razorpay_payment_unique",
          unique: true,
          transaction,
        });
      }
      await queryInterface.sequelize.query(
        `UPDATE "user_subscriptions" SET "payment_provider" = 'MANUAL' WHERE "payment_provider" = 'STRIPE'`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const columns = await queryInterface.describeTable("user_subscriptions");
      if (columns["legacy_payment_reference"] && !columns["stripe_checkout_session_id"]) {
        await queryInterface.renameColumn(
          "user_subscriptions",
          "legacy_payment_reference",
          "stripe_checkout_session_id",
          { transaction },
        );
        await queryInterface.addIndex("user_subscriptions", ["stripe_checkout_session_id"], {
          name: "user_subscriptions_stripe_session_unique",
          unique: true,
          transaction,
        });
      }
      await queryInterface.removeColumn("user_subscriptions", "razorpay_payment_id", {
        transaction,
      });
      await queryInterface.removeColumn("user_subscriptions", "razorpay_order_id", { transaction });
    });
  },
};
