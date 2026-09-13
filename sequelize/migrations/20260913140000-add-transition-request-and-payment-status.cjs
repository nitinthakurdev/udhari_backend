"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn("transitions", "status", "request_status", {
        transaction,
      });

      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_transitions_request_status"`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_transitions_request_status"
         AS ENUM ('pending', 'approved', 'rejected', 'not_available', 'cancelled')`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "transitions"
         ALTER COLUMN "request_status" DROP DEFAULT,
         ALTER COLUMN "request_status" TYPE "enum_transitions_request_status"
           USING "request_status"::"enum_transitions_request_status",
         ALTER COLUMN "request_status" SET DEFAULT 'pending'`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_transitions_payment_status"`,
        { transaction },
      );
      await queryInterface.addColumn(
        "transitions",
        "payment_status",
        {
          type: DataTypes.ENUM("paid", "unpaid"),
          allowNull: false,
          defaultValue: "unpaid",
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("transitions", "payment_status", { transaction });
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_transitions_payment_status"`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "transitions"
         ALTER COLUMN "request_status" DROP DEFAULT,
         ALTER COLUMN "request_status" TYPE VARCHAR(30)
           USING "request_status"::text,
         ALTER COLUMN "request_status" SET DEFAULT 'pending'`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_transitions_request_status"`,
        { transaction },
      );
      await queryInterface.renameColumn("transitions", "request_status", "status", {
        transaction,
      });
    });
  },
};
