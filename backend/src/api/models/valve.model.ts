/**
 * VALVE MODEL
 * Any controllable equipment (valve or pump) wired to a relay channel on an ESP32.
 * `system` keeps irrigation and heating separate.
 * Components are registered independently from devices, then mapped to a device channel.
 */
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../config/database";

// Shared enums (also reused by the schedule model and the services)
export const VALVE_KINDS = ["valve", "pump"] as const;
export const SYSTEMS = ["irrigation", "heating"] as const;
export const VALVE_STATES = ["on", "off", "fault", "unknown"] as const; // Drives the dashboard indicators

export type ValveKind = (typeof VALVE_KINDS)[number];
export type SystemType = (typeof SYSTEMS)[number];
export type ValveState = (typeof VALVE_STATES)[number];

export class Valve extends Model<
  InferAttributes<Valve>,
  InferCreationAttributes<Valve>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare deviceId: number; // Which ESP32 controls it
  declare parcelId: number; // Which parcel it belongs to (copied from the device at creation)
  declare channel: number; // Relay channel number on the ESP32
  declare kind: ValveKind;
  declare system: SystemType; // irrigation or heating
  declare zone: CreationOptional<string | null>; // Optional zone label inside the parcel
  declare state: CreationOptional<ValveState>; // Last state REPORTED by the device
  declare stateUpdatedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Valve.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    deviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    parcelId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    channel: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    kind: {
      type: DataTypes.ENUM(...VALVE_KINDS),
      allowNull: false,
      defaultValue: "valve",
    },
    system: {
      type: DataTypes.ENUM(...SYSTEMS),
      allowNull: false,
      defaultValue: "irrigation",
    },
    zone: { type: DataTypes.STRING(100), allowNull: true },
    state: {
      type: DataTypes.ENUM(...VALVE_STATES),
      allowNull: false,
      defaultValue: "unknown",
    },
    stateUpdatedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "valves",
    // A channel on one device can only be mapped to one valve
    indexes: [{ unique: true, fields: ["deviceId", "channel"] }],
  },
);
