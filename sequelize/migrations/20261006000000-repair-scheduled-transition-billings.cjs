"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Older personal user-to-business schedules stored the target business on
      // customer_business_id. Normalize them to the same layout used by manual
      // user-to-business transitions before creating their missing bills.
      await queryInterface.sequelize.query(
        `
          UPDATE "transitions" AS transition
          SET
            "business_id" = config."customer_business_id",
            "customer_user_id" = config."created_by",
            "customer_business_id" = NULL,
            "business_user_id" = business."created_by",
            "updated_at" = NOW()
          FROM "recurring_transaction_configs" AS config
          INNER JOIN "businesses" AS business
            ON business."id" = config."customer_business_id"
          WHERE transition."recurring_config_id" = config."id"
            AND transition."business_id" IS NULL
            AND transition."customer_business_id" = config."customer_business_id"
            AND config."business_id" IS NULL
            AND config."customer_business_id" IS NOT NULL
            AND config."created_by" IS NOT NULL
            AND transition."deleted_at" IS NULL
        `,
        { transaction },
      );

      // Backfill one statement per payer, creditor and India-local calendar
      // month. ON CONFLICT preserves statements already created by live flows.
      await queryInterface.sequelize.query(
        `
          INSERT INTO "billings" (
            "uuid", "current_outstanding", "customer_id", "customer_business_id",
            "business_id", "business_owner_id", "start_date_of_month",
            "end_date_of_month", "due_date", "extend_due_date", "generated_at",
            "created_by", "updated_by", "created_at", "updated_at"
          )
          SELECT
            gen_random_uuid(), SUM(transition."total_price"),
            transition."customer_user_id", NULL, transition."business_id",
            transition."business_user_id",
            date_trunc('month', transition."created_at" AT TIME ZONE 'Asia/Kolkata')::date,
            (date_trunc('month', transition."created_at" AT TIME ZONE 'Asia/Kolkata')
              + interval '1 month - 1 day')::date,
            (date_trunc('month', transition."created_at" AT TIME ZONE 'Asia/Kolkata')
              + interval '1 month - 1 day')::date,
            NULL, NULL, MIN(transition."created_by"), NULL,
            MIN(transition."created_at"), NOW()
          FROM "transitions" AS transition
          WHERE transition."customer_business_id" IS NULL
            AND transition."request_status" = 'approved'
            AND transition."deleted_at" IS NULL
          GROUP BY
            transition."customer_user_id", transition."business_id",
            transition."business_user_id",
            date_trunc('month', transition."created_at" AT TIME ZONE 'Asia/Kolkata')
          ON CONFLICT DO NOTHING
        `,
        { transaction },
      );
    });
  },

  async down() {
    // Data normalization and bill backfills are intentionally retained because
    // reverting them could orphan payments or recreate the broken party layout.
  },
};
