"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "recurring_transaction_configs";
    const columns = await queryInterface.describeTable(tableName);
    if (!columns.week_days) {
      await queryInterface.addColumn(tableName, "week_days", {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      });
    }
    if (!columns.time_ranges) {
      await queryInterface.addColumn(tableName, "time_ranges", {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      });
    }
    if (columns.scheduled_at) await queryInterface.removeColumn(tableName, "scheduled_at");
  },

  async down(queryInterface, Sequelize) {
    const tableName = "recurring_transaction_configs";
    const columns = await queryInterface.describeTable(tableName);
    if (!columns.scheduled_at) {
      await queryInterface.addColumn(tableName, "scheduled_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
    if (columns.time_ranges) await queryInterface.removeColumn(tableName, "time_ranges");
    if (columns.week_days) await queryInterface.removeColumn(tableName, "week_days");
  },
};
