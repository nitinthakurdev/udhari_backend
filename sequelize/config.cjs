require("dotenv").config();

const sharedConfig = {
  use_env_variable: "DATABASE_URL",
  dialect: "postgres",
  migrationStorage: "sequelize",
  migrationStorageTableName: "sequelize_meta",
  seederStorage: "sequelize",
  seederStorageTableName: "sequelize_data",
};

module.exports = {
  development: sharedConfig,
  test: sharedConfig,
  production: sharedConfig,
};
