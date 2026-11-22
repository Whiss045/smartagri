/**
 * SENSOR MODEL
 * Sensor METADATA only; measurements live in SensorReading.
 * Registered on its own, then assigned to a device channel. Unassigning keeps the row and
 * all its history. Invariant: deviceId, parcelId and channel are all set or all null.
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
  declare unit: string;
  declare deviceId: CreationOptional<number | null>;
  declare parcelId: CreationOptional<number | null>;
  declare plotId: CreationOptional<number | null>;
  declare channel: CreationOptional<number | null>;
  declare active: CreationOptional<boolean>; // false = ingestion ignores it (history is kept)
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
    plotId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    channel: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "sensors",
    indexes: [{ unique: true, fields: ["deviceId", "channel"] }],
  },
);
