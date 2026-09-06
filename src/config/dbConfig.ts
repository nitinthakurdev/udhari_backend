import { Sequelize } from "sequelize";
import { config } from "./envConfig";

if (!config.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

export const sequelize = new Sequelize(config.DATABASE_URL, {
  dialect: "postgres",
  logging: config.NODE_ENV === "development" ? console.log : false,
  timezone: "Asia/kolkata",
});

export const dbConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error: unknown) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};
