"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "management_units",
        "code",
        { type: DataTypes.STRING(20), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "management_units",
        "type",
        { type: DataTypes.STRING(30), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "management_units",
        "factor",
        { type: DataTypes.DECIMAL(18, 6), allowNull: true },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE management_units
         SET code = CASE LOWER(name)
               WHEN 'kilogram' THEN 'kg'
               WHEN 'kg' THEN 'kg'
               WHEN 'gram' THEN 'g'
               WHEN 'g' THEN 'g'
               WHEN 'liter' THEN 'ltr'
               WHEN 'litre' THEN 'ltr'
               WHEN 'milliliter' THEN 'ml'
               WHEN 'millilitre' THEN 'ml'
               WHEN 'ml' THEN 'ml'
               WHEN 'piece' THEN 'pcs'
               WHEN 'pcs' THEN 'pcs'
               ELSE LEFT(COALESCE(NULLIF(REGEXP_REPLACE(LOWER(name), '[^a-z0-9._-]+', '', 'g'), ''), 'unit'), 20)
             END,
             type = CASE LOWER(name)
               WHEN 'kilogram' THEN 'weight'
               WHEN 'kg' THEN 'weight'
               WHEN 'gram' THEN 'weight'
               WHEN 'g' THEN 'weight'
               WHEN 'liter' THEN 'volume'
               WHEN 'litre' THEN 'volume'
               WHEN 'milliliter' THEN 'volume'
               WHEN 'millilitre' THEN 'volume'
               WHEN 'ml' THEN 'volume'
               WHEN 'meter' THEN 'length'
               ELSE 'count'
             END,
             factor = CASE LOWER(name)
               WHEN 'gram' THEN 0.001
               WHEN 'g' THEN 0.001
               WHEN 'milliliter' THEN 0.001
               WHEN 'millilitre' THEN 0.001
               WHEN 'ml' THEN 0.001
               ELSE 1
             END`,
        { transaction },
      );

      await queryInterface.changeColumn(
        "management_units",
        "code",
        { type: DataTypes.STRING(20), allowNull: false },
        { transaction },
      );
      await queryInterface.changeColumn(
        "management_units",
        "type",
        { type: DataTypes.STRING(30), allowNull: false },
        { transaction },
      );
      await queryInterface.changeColumn(
        "management_units",
        "factor",
        { type: DataTypes.DECIMAL(18, 6), allowNull: false, defaultValue: 1 },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("management_units", "factor", { transaction });
      await queryInterface.removeColumn("management_units", "type", { transaction });
      await queryInterface.removeColumn("management_units", "code", { transaction });
    });
  },
};
