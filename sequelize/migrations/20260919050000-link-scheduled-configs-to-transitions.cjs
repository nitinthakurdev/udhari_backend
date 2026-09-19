"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("transitions", "business_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "businesses", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.changeColumn("transitions", "unit_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "management_units", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    const columns = await queryInterface.describeTable("transitions");
    if (!columns.recurring_config_id) {
      await queryInterface.addColumn("transitions", "recurring_config_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "recurring_transaction_configs", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
    if (!columns.schedule_occurrence_key) {
      await queryInterface.addColumn("transitions", "schedule_occurrence_key", {
        type: Sequelize.STRING(80),
        allowNull: true,
      });
    }
    const indexes = await queryInterface.showIndex("transitions");
    if (!indexes.some((index) => index.name === "transitions_recurring_config_occurrence_unique")) {
      await queryInterface.addIndex(
        "transitions",
        ["recurring_config_id", "schedule_occurrence_key"],
        {
          name: "transitions_recurring_config_occurrence_unique",
          unique: true,
        },
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      "transitions",
      "transitions_recurring_config_occurrence_unique",
    );
    await queryInterface.removeColumn("transitions", "schedule_occurrence_key");
    await queryInterface.removeColumn("transitions", "recurring_config_id");
    await queryInterface.changeColumn("transitions", "business_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "businesses", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.changeColumn("transitions", "unit_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "management_units", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
};
