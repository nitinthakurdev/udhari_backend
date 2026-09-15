"use strict";

const { DataTypes, Op } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "billings",
        "customer_business_id",
        { type: DataTypes.INTEGER, allowNull: true },
        { transaction },
      );

      // Existing business-to-business bills can be identified from their monthly transitions.
      // Only unambiguous rows are backfilled; new writes always persist the business explicitly.
      await queryInterface.sequelize.query(
        `
          UPDATE "billings" AS billing
          SET "customer_business_id" = candidate."debtor_business_id"
          FROM (
            SELECT
              existing."id" AS "billing_id",
              MIN(
                CASE
                  WHEN transition."balance_type" = 'payable'
                    THEN transition."customer_business_id"
                  ELSE transition."business_id"
                END
              ) AS "debtor_business_id"
            FROM "billings" AS existing
            INNER JOIN "transitions" AS transition
              ON transition."customer_business_id" IS NOT NULL
              AND transition."deleted_at" IS NULL
              AND transition."created_at" >= existing."start_date_of_month"::timestamp
              AND transition."created_at" < (existing."end_date_of_month"::date + INTERVAL '1 day')
              AND (
                (
                  transition."balance_type" = 'payable'
                  AND transition."business_id" = existing."business_id"
                  AND transition."customer_user_id" = existing."customer_id"
                )
                OR
                (
                  transition."balance_type" = 'receivable'
                  AND transition."customer_business_id" = existing."business_id"
                  AND transition."business_user_id" = existing."customer_id"
                )
              )
            GROUP BY existing."id"
            HAVING COUNT(
              DISTINCT CASE
                WHEN transition."balance_type" = 'payable'
                  THEN transition."customer_business_id"
                ELSE transition."business_id"
              END
            ) = 1
          ) AS candidate
          WHERE billing."id" = candidate."billing_id"
        `,
        { transaction },
      );

      await queryInterface.removeIndex("billings", "billings_customer_business_month_unique", {
        transaction,
      });
      await queryInterface.addIndex("billings", ["customer_business_id"], {
        name: "billings_customer_business_id",
        transaction,
      });
      await queryInterface.addIndex(
        "billings",
        ["customer_id", "business_id", "start_date_of_month", "end_date_of_month"],
        {
          name: "billings_user_business_month_unique",
          unique: true,
          where: { customer_business_id: null },
          transaction,
        },
      );
      await queryInterface.addIndex(
        "billings",
        ["customer_business_id", "business_id", "start_date_of_month", "end_date_of_month"],
        {
          name: "billings_business_pair_month_unique",
          unique: true,
          where: { customer_business_id: { [Op.ne]: null } },
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("billings", "billings_business_pair_month_unique", {
        transaction,
      });
      await queryInterface.removeIndex("billings", "billings_user_business_month_unique", {
        transaction,
      });
      await queryInterface.removeIndex("billings", "billings_customer_business_id", {
        transaction,
      });
      await queryInterface.removeColumn("billings", "customer_business_id", { transaction });
      await queryInterface.addIndex(
        "billings",
        ["customer_id", "business_id", "start_date_of_month", "end_date_of_month"],
        { name: "billings_customer_business_month_unique", unique: true, transaction },
      );
    });
  },
};
