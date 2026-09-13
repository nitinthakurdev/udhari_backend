"use strict";

const { DataTypes, QueryTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn("transitions", "user_id", "customer_user_id", {
        transaction,
      });
      await queryInterface.renameColumn("transitions", "product_price", "product_unit_price", {
        transaction,
      });
      await queryInterface.renameColumn("transitions", "approved_by_user", "approved_by_customer", {
        transaction,
      });
      await queryInterface.addColumn(
        "transitions",
        "customer_business_id",
        { type: DataTypes.INTEGER, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "transitions",
        "business_user_id",
        { type: DataTypes.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE transitions
         SET business_user_id = businesses.created_by
         FROM businesses
         WHERE transitions.business_id = businesses.id`,
        { transaction },
      );

      const missingOwners = await queryInterface.sequelize.query(
        `SELECT COUNT(*)::int AS count
         FROM transitions
         WHERE business_user_id IS NULL`,
        { type: QueryTypes.SELECT, transaction },
      );
      if (missingOwners[0]?.count > 0) {
        throw new Error("Cannot migrate transitions whose business has no owner.");
      }

      await queryInterface.changeColumn(
        "transitions",
        "business_user_id",
        { type: DataTypes.INTEGER, allowNull: false },
        { transaction },
      );

      const indexes = await queryInterface.showIndex("transitions", { transaction });
      if (indexes.some((index) => index.name === "transitions_user_id")) {
        await queryInterface.removeIndex("transitions", "transitions_user_id", {
          transaction,
        });
      }
      await queryInterface.addIndex("transitions", ["customer_user_id"], {
        name: "transitions_customer_user_id",
        transaction,
      });
      await queryInterface.addIndex("transitions", ["customer_business_id"], {
        name: "transitions_customer_business_id",
        transaction,
      });
      await queryInterface.addIndex("transitions", ["business_user_id"], {
        name: "transitions_business_user_id",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("transitions", "transitions_business_user_id", {
        transaction,
      });
      await queryInterface.removeIndex("transitions", "transitions_customer_business_id", {
        transaction,
      });
      await queryInterface.removeIndex("transitions", "transitions_customer_user_id", {
        transaction,
      });
      await queryInterface.addIndex("transitions", ["customer_user_id"], {
        name: "transitions_user_id",
        transaction,
      });
      await queryInterface.removeColumn("transitions", "business_user_id", { transaction });
      await queryInterface.removeColumn("transitions", "customer_business_id", {
        transaction,
      });
      await queryInterface.renameColumn("transitions", "approved_by_customer", "approved_by_user", {
        transaction,
      });
      await queryInterface.renameColumn("transitions", "product_unit_price", "product_price", {
        transaction,
      });
      await queryInterface.renameColumn("transitions", "customer_user_id", "user_id", {
        transaction,
      });
    });
  },
};
