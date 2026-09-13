"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.changeColumn("transitions", "product_qty", {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down(queryInterface) {
    await queryInterface.changeColumn("transitions", "product_qty", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },
};
