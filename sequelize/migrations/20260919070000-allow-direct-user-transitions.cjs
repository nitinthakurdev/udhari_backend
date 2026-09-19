"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "transitions" ALTER COLUMN "business_id" DROP NOT NULL;',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "transitions" ALTER COLUMN "business_id" SET NOT NULL;',
    );
  },
};
