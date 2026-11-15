/**
 * SENSOR READING MODEL
 * One measurement at one moment. Append-only: the API exposes NO update or delete
 * for this table, which guarantees the farmer cannot alter history.
 */
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../config/database";

export class SensorReading extends Model<
  InferAttributes<SensorReading>,
  InferCreationAttributes<SensorReading>
> {
  declare id: CreationOptional<string>; // BIGINT is returned as a string by the MySQL driver
  declare sensorId: number;
  declare value: number;
  declare recordedAt: Date; // Set by the server when the message arrives
}

SensorReading.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    sensorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    value: { type: DataTypes.DOUBLE, allowNull: false },
    recordedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: "sensor_readings",
    timestamps: false, // recordedAt already plays that role
    // Speeds up the main query: "readings of sensor X between two dates"
    indexes: [{ fields: ["sensorId", "recordedAt"] }],
  },
);
