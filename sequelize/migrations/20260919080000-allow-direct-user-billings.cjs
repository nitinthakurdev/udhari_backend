"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "billings" ALTER COLUMN "business_id" DROP NOT NULL;',
    );

    const indexes = await queryInterface.showIndex("billings");
    if (!indexes.some((index) => index.name === "billings_direct_user_pair_month_unique")) {
      await queryInterface.addIndex(
        "billings",
        ["customer_id", "business_owner_id", "start_date_of_month", "end_date_of_month"],
        {
          name: "billings_direct_user_pair_month_unique",
          unique: true,
          where: { business_id: null, customer_business_id: null },
        },
      );
    }

    await queryInterface.sequelize.query(`
      INSERT INTO "billings" (
        "uuid", "current_outstanding", "customer_id", "customer_business_id",
        "business_id", "business_owner_id", "start_date_of_month", "end_date_of_month",
        "due_date", "extend_due_date", "generated_at", "created_by", "updated_by",
        "created_at", "updated_at"
      )
      SELECT
        gen_random_uuid(), SUM(t."total_price"), t."customer_user_id", NULL, NULL,
        t."business_user_id",
        date_trunc('month', t."created_at" AT TIME ZONE 'Asia/Kolkata')::date,
        (date_trunc('month', t."created_at" AT TIME ZONE 'Asia/Kolkata')
          + interval '1 month - 1 day')::date,
        (date_trunc('month', t."created_at" AT TIME ZONE 'Asia/Kolkata')
          + interval '1 month - 1 day')::date,
        NULL, NULL, MIN(t."created_by"), NULL, MIN(t."created_at"), NOW()
      FROM "transitions" t
      WHERE t."business_id" IS NULL
        AND t."customer_business_id" IS NULL
        AND t."request_status" = 'approved'
        AND t."deleted_at" IS NULL
      GROUP BY
        t."customer_user_id", t."business_user_id",
        date_trunc('month', t."created_at" AT TIME ZONE 'Asia/Kolkata')
      ON CONFLICT DO NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("billings", "billings_direct_user_pair_month_unique");
    await queryInterface.bulkDelete("billings", {
      business_id: null,
      customer_business_id: null,
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE "billings" ALTER COLUMN "business_id" SET NOT NULL;',
    );
  },
};
