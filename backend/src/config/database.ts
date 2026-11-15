/**
 * DATABASE CONFIG
 * Creates the single Sequelize instance shared by all models.
 * Every model file imports this default export.
 */
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    dialect: "mysql",
    logging: false, // Set to console.log to see the generated SQL while debugging
    timezone: "+00:00", // Store all dates in UTC (local time is handled by the scheduler)
  },
);

export default sequelize;
