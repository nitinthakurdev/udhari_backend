"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE "subscriptions"
       SET "auto_renewal_enabled" = true
       WHERE "price" = 0 AND "deleted_at" IS NULL`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE "subscriptions"
       SET "auto_renewal_enabled" = false
       WHERE "price" = 0 AND "deleted_at" IS NULL`,
    );
  },
};
