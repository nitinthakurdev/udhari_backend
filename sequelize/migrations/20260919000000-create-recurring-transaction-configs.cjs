"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "recurring_transaction_configs";
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some((table) =>
      typeof table === "string" ? table === tableName : table.tableName === tableName,
    );

    if (!tableExists) {
      await queryInterface.createTable(tableName, {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: {
          type: Sequelize.UUID,
          allowNull: false,
          defaultValue: Sequelize.literal("gen_random_uuid()"),
        },
        business_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "businesses", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        customer_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        type: { type: Sequelize.ENUM("product", "service"), allowNull: false },
        name: { type: Sequelize.STRING(150), allowNull: false },
        unit_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "management_units", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        quantity: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
        unit_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        total_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        scheduled_at: { type: Sequelize.DATE, allowNull: false },
        created_by: { type: Sequelize.INTEGER, allowNull: true },
        updated_by: { type: Sequelize.INTEGER, allowNull: true },
        deleted_by: { type: Sequelize.INTEGER, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      });
    }

    const existingIndexes = await queryInterface.showIndex(tableName);
    const indexNames = new Set(existingIndexes.map((index) => index.name));
    const indexes = [
      { name: "recurring_transaction_configs_uuid_unique", fields: ["uuid"], unique: true },
      { name: "recurring_transaction_configs_business_id", fields: ["business_id"] },
      { name: "recurring_transaction_configs_customer_id", fields: ["customer_id"] },
    ];

    for (const index of indexes) {
      if (!indexNames.has(index.name)) {
        await queryInterface.addIndex(tableName, index.fields, {
          name: index.name,
          ...(index.unique ? { unique: true } : {}),
        });
      }
    }
  },

  async down(queryInterface) {
    const tableName = "recurring_transaction_configs";
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some((table) =>
      typeof table === "string" ? table === tableName : table.tableName === tableName,
    );
    if (tableExists) await queryInterface.dropTable(tableName);
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_recurring_transaction_configs_type";',
    );
  },
};
