"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "billings",
        "generated_at",
        {
          type: DataTypes.DATE,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
          UPDATE "billings"
          SET "generated_at" = COALESCE("updated_at", "created_at")
          WHERE "extend_due_date" IS NOT NULL
             OR "due_date" <> "end_date_of_month"
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("billings", "generated_at");
  },
};
