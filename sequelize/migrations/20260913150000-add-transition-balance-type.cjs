"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_transitions_balance_type"`,
        { transaction },
      );
      await queryInterface.addColumn(
        "transitions",
        "balance_type",
        {
          type: DataTypes.ENUM("payable", "receivable"),
          allowNull: false,
          defaultValue: "payable",
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("transitions", "balance_type", { transaction });
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_transitions_balance_type"`,
        { transaction },
      );
    });
  },
};
