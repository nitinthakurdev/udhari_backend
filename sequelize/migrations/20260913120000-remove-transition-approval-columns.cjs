"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE transitions
         SET status = 'approved'
         WHERE approved_by_customer = TRUE
           AND approved_by_business = TRUE`,
        { transaction },
      );

      await queryInterface.removeColumn("transitions", "approved_by_customer", { transaction });
      await queryInterface.removeColumn("transitions", "approved_by_business", { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "transitions",
        "approved_by_customer",
        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );
      await queryInterface.addColumn(
        "transitions",
        "approved_by_business",
        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE transitions
         SET approved_by_customer = TRUE,
             approved_by_business = TRUE
         WHERE status = 'approved'`,
        { transaction },
      );
    });
  },
};
