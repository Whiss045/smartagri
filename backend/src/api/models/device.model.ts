/**
 * DEVICE MODEL
 * One ESP32 microcontroller. Devices are created automatically when they first
 * announce themselves over MQTT. They start unassigned (parcelId = null) until
 * the farmer assigns them to a parcel.
 */
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../config/database";

export class Device extends Model<
  InferAttributes<Device>,
  InferCreationAttributes<Device>
> {
  declare id: CreationOptional<number>;
  declare deviceUid: string; // Identity used in MQTT topics and broker credentials
  declare name: CreationOptional<string | null>; // Friendly name set by the farmer
  declare parcelId: CreationOptional<number | null>; // null = unassigned
  declare firmwareVersion: CreationOptional<string | null>;
  declare lastSeenAt: CreationOptional<Date | null>; // Updated on every message; used for "online" status
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Device.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    deviceUid: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: true },
    parcelId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    firmwareVersion: { type: DataTypes.STRING(32), allowNull: true },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "devices" },
);
