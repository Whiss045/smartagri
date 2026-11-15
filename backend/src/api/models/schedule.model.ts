/**
 * SCHEDULE MODEL
 * A recurring timer: "open valve X at HH:mm on these weekdays for N minutes".
 * Used for both irrigation and heating. The `system` column keeps them separate.
 * The scheduler service reads these rows and fires the commands.
 */
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../config/database";
import { SYSTEMS, SystemType } from "./valve.model";

export class Schedule extends Model<
  InferAttributes<Schedule>,
  InferCreationAttributes<Schedule>
> {
  declare id: CreationOptional<number>;
  declare parcelId: number;
  declare valveId: number; // The equipment this schedule controls
  declare system: SystemType; // Always equals the valve's system
  declare name: string;
  declare startTime: string; // 'HH:mm' in the farm's local time
  declare durationMinutes: number;
  declare daysOfWeek: number[]; // 0 = Sunday ... 6 = Saturday
  declare enabled: CreationOptional<boolean>;
  declare lastRunDate: CreationOptional<string | null>; // 'YYYY-MM-DD'; prevents running twice in a day
  declare activeUntil: CreationOptional<Date | null>; // Set while running; tells the scheduler when to stop
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Schedule.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    parcelId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    valveId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    system: { type: DataTypes.ENUM(...SYSTEMS), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    startTime: { type: DataTypes.STRING(5), allowNull: false },
    durationMinutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    daysOfWeek: { type: DataTypes.JSON, allowNull: false }, // Stored as a JSON array
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastRunDate: { type: DataTypes.STRING(10), allowNull: true },
    activeUntil: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "schedules" },
);
