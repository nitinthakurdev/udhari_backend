"use strict";

const { randomUUID } = require("node:crypto");
const { Op, QueryTypes } = require("sequelize");

const DEFAULT_UNITS = [
  { name: "Piece", code: "pcs", type: "count", factor: 1 },
  { name: "Box", code: "box", type: "count", factor: 1 },
  { name: "Kilogram", code: "kg", type: "weight", factor: 1 },
  { name: "Gram", code: "g", type: "weight", factor: 0.001 },
  { name: "Liter", code: "ltr", type: "volume", factor: 1 },
  { name: "Milliliter", code: "ml", type: "volume", factor: 0.001 },
  { name: "Pack", code: "pack", type: "count", factor: 1 },
  { name: "Meter", code: "m", type: "length", factor: 1 },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const admins = await queryInterface.sequelize.query(
        `SELECT users.id
         FROM users
         INNER JOIN roles ON roles.id = users.role_id
         WHERE roles.slug = 'admin' AND users.deleted_at IS NULL
         ORDER BY users.id ASC
         LIMIT 1`,
        { type: QueryTypes.SELECT, transaction },
      );

      if (!admins[0]) throw new Error("Create the default admin before seeding units.");

      const existingUnits = await queryInterface.sequelize.query(
        `SELECT LOWER(name) AS name
         FROM management_units
         WHERE created_by = :adminId AND deleted_at IS NULL`,
        {
          replacements: { adminId: admins[0].id },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      const existingNames = new Set(existingUnits.map((unit) => unit.name));
      const now = new Date();
      const units = DEFAULT_UNITS.filter((unit) => !existingNames.has(unit.name.toLowerCase())).map(
        (unit) => ({
          uuid: randomUUID(),
          ...unit,
          created_by: admins[0].id,
          updated_by: null,
          deleted_by: null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        }),
      );

      if (units.length > 0) {
        await queryInterface.bulkInsert("management_units", units, { transaction });
      }
    });
  },

  async down(queryInterface) {
    const admins = await queryInterface.sequelize.query(
      `SELECT users.id
       FROM users
       INNER JOIN roles ON roles.id = users.role_id
       WHERE roles.slug = 'admin'`,
      { type: QueryTypes.SELECT },
    );
    await queryInterface.bulkDelete("management_units", {
      name: { [Op.in]: DEFAULT_UNITS.map((unit) => unit.name) },
      created_by: { [Op.in]: admins.map((admin) => admin.id) },
    });
  },
};
