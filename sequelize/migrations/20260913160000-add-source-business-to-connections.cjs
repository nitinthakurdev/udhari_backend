"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "customer_management",
        "source_business_id",
        { type: DataTypes.INTEGER, allowNull: true },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `UPDATE customer_management AS cm
         SET source_business_id = users.business_id
         FROM users
         JOIN roles ON roles.id = users.role_id
         WHERE cm.created_by = users.id
           AND roles.slug = 'business'
           AND cm.role = 'customer'
           AND users.business_id IS NOT NULL
           AND users.business_id <> cm.business_id`,
        { transaction },
      );
      await queryInterface.addIndex("customer_management", ["source_business_id"], {
        name: "customer_management_source_business_id",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        "customer_management",
        "customer_management_source_business_id",
        { transaction },
      );
      await queryInterface.removeColumn("customer_management", "source_business_id", {
        transaction,
      });
    });
  },
};
