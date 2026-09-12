"use strict";

const { randomUUID } = require("node:crypto");
const { Op, QueryTypes } = require("sequelize");

const DEFAULT_UNITS = ["pcs", "box", "kg", "g", "litre", "ml", "pack", "meter"];

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
      const units = DEFAULT_UNITS.filter((name) => !existingNames.has(name)).map((name) => ({
        uuid: randomUUID(),
        name,
        created_by: admins[0].id,
        updated_by: null,
        deleted_by: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      }));

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
      name: { [Op.in]: DEFAULT_UNITS },
      created_by: { [Op.in]: admins.map((admin) => admin.id) },
    });
  },
};
