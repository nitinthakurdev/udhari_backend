"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE "user_subscriptions" AS us
       SET "payment_provider" = 'FREE',
           "auto_renew" = s."auto_renewal_enabled"
       FROM "subscriptions" AS s
       WHERE us."subscription_id" = s."id"
         AND s."price" = 0
         AND us."stripe_checkout_session_id" IS NULL
         AND us."google_play_purchase_token" IS NULL`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE "user_subscriptions"
       SET "payment_provider" = 'MANUAL',
           "auto_renew" = false
       WHERE "payment_provider" = 'FREE'`,
    );
  },
};
