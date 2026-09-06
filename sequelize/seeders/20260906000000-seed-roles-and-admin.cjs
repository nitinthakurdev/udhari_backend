"use strict";

const { randomUUID } = require("node:crypto");
const { Op, QueryTypes } = require("sequelize");

const ROLE_SEEDS = [
  { name: "Admin", slug: "admin" },
  { name: "User", slug: "user" },
  { name: "Organization", slug: "organization" },
];

const ADMIN_SEED = {
  first_name: "System",
  last_name: "Admin",
  email: "admin@udhari.com",
  username: "admin",
  phone: "9999999999",
  dial_code: "+91",
  password: "$2a$10$TY.kcQlDF0UG9k7g45fPueOAHVovkT7VlWG99fIIQeeIarPwqtZta",
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const existingRoles = await queryInterface.sequelize.query(
        "SELECT name, slug FROM roles WHERE slug IN (:slugs) OR name IN (:names)",
        {
          replacements: {
            names: ROLE_SEEDS.map((role) => role.name),
            slugs: ROLE_SEEDS.map((role) => role.slug),
          },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      const existingNames = new Set(existingRoles.map((role) => role.name));
      const existingslugs = new Set(existingRoles.map((role) => role.slug));
      const now = new Date();
      const rolesToCreate = ROLE_SEEDS.filter(
        (role) => !existingNames.has(role.name) && !existingslugs.has(role.slug),
      ).map((role) => ({
        uuid: randomUUID(),
        ...role,
        created_by: null,
        updated_by: null,
        deleted_by: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      }));

      if (rolesToCreate.length > 0) {
        await queryInterface.bulkInsert("roles", rolesToCreate, { transaction });
      }

      const adminRole = await queryInterface.sequelize.query(
        "SELECT id FROM roles WHERE slug = :slug LIMIT 1",
        {
          replacements: { slug: "admin" },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      if (!adminRole[0]) {
        throw new Error("The admin role could not be created or found.");
      }

      const existingAdmin = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1",
        {
          replacements: { email: ADMIN_SEED.email, username: ADMIN_SEED.username },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      if (!existingAdmin[0]) {
        await queryInterface.bulkInsert(
          "users",
          [
            {
              uuid: randomUUID(),
              first_name: ADMIN_SEED.first_name,
              last_name: ADMIN_SEED.last_name,
              email: ADMIN_SEED.email,
              username: ADMIN_SEED.username,
              phone: ADMIN_SEED.phone,
              dial_code: ADMIN_SEED.dial_code,
              is_email_verified: true,
              is_phone_verified: true,
              password: ADMIN_SEED.password,
              score: 0,
              role_id: adminRole[0].id,
              created_by: null,
              created_at: now,
              updated_at: now,
              deleted_at: null,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        "users",
        {
          [Op.or]: [{ email: ADMIN_SEED.email }, { username: ADMIN_SEED.username }],
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "roles",
        { slug: { [Op.in]: ROLE_SEEDS.map((role) => role.slug) } },
        { transaction },
      );
    });
  },
};
