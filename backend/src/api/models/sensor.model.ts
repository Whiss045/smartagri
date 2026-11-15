/**
 * SENSOR MODEL
 * Sensor METADATA only (what it is, where it is wired). The measurements themselves
 * live in SensorReading, so metadata can be edited without ever touching history.
 */
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../config/database";

export const SENSOR_TYPES = [
  "soil_moisture",
  "soil_temperature",
  "air_temperature",
  "air_humidity",
  "water_flow",
  "water_pressure",
  "water_temperature",
] as const;
export type SensorType = (typeof SENSOR_TYPES)[number];

export class Sensor extends Model<
  InferAttributes<Sensor>,
  InferCreationAttributes<Sensor>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare type: SensorType;
  declare unit: string; // e.g. '%', '°C', 'L/min'
  declare deviceId: CreationOptional<number | null>; // null when its device was unassigned
  declare parcelId: CreationOptional<number | null>;
  declare channel: number; // Input channel on the ESP32
  declare zone: CreationOptional<string | null>;
  declare active: CreationOptional<boolean>; // false = ignored by ingestion (history is kept)
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Sensor.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM(...SENSOR_TYPES), allowNull: false },
    unit: { type: DataTypes.STRING(16), allowNull: false },
    deviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    parcelId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    channel: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    zone: { type: DataTypes.STRING(100), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "sensors",
    // A channel on one device can only be mapped to one sensor
    indexes: [{ unique: true, fields: ["deviceId", "channel"] }],
  },
);
