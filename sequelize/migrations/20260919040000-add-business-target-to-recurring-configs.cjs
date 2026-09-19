"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("recurring_transaction_configs", "customer_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    const columns = await queryInterface.describeTable("recurring_transaction_configs");
    if (!columns.customer_business_id) {
      await queryInterface.addColumn("recurring_transaction_configs", "customer_business_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "businesses", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      await queryInterface.addIndex("recurring_transaction_configs", ["customer_business_id"], {
        name: "recurring_transaction_configs_customer_business_id",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("recurring_transaction_configs");
    if (columns.customer_business_id) {
      await queryInterface.removeColumn("recurring_transaction_configs", "customer_business_id");
    }
    await queryInterface.changeColumn("recurring_transaction_configs", "customer_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
