/**
 * DATABASE CONFIG
 * Creates the single Sequelize instance shared by all models.
 * Every model file imports this default export.
 */
import { Sequelize, type Dialect } from "sequelize";

const dialect = (process.env.DB_DIALECT ?? "mysql") as Dialect;

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    dialect,
    logging: false,
    timezone: "+00:00",
  },
);

export default sequelize;
