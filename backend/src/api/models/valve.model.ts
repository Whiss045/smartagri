/**
 * VALVE MODEL
 * Controllable equipment (valve or pump). A valve is REGISTERED on its own (unassigned),
 * then ASSIGNED to a device channel. Invariant kept by the services:
 *   deviceId, parcelId and channel are either all set (assigned) or all null (unassigned).
 * plotId is optional and only meaningful while assigned.
 */
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../config/database";

export const VALVE_KINDS = ["valve", "pump"] as const;
export const SYSTEMS = ["irrigation", "heating"] as const;
export const VALVE_STATES = ["on", "off", "fault", "unknown"] as const;

export type ValveKind = (typeof VALVE_KINDS)[number];
export type SystemType = (typeof SYSTEMS)[number];
export type ValveState = (typeof VALVE_STATES)[number];

export class Valve extends Model<
  InferAttributes<Valve>,
  InferCreationAttributes<Valve>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare deviceId: CreationOptional<number | null>; // null = unassigned
  declare parcelId: CreationOptional<number | null>; // copied from the device on assignment
  declare plotId: CreationOptional<number | null>;
  declare channel: CreationOptional<number | null>; // relay channel on the ESP32
  declare kind: ValveKind;
  declare system: SystemType;
  declare state: CreationOptional<ValveState>; // last state REPORTED by the device
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
    deviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    parcelId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    plotId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    channel: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
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
    // One channel of one device drives at most one valve (NULLs are allowed many times)
    indexes: [{ unique: true, fields: ["deviceId", "channel"] }],
  },
);
