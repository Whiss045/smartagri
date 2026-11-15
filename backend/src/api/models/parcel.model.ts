/**
 * PARCEL MODEL
 * A piece of land owned by the farmer: either an open palm field or a greenhouse.
 * The type matters: only greenhouses may have heating equipment.
 */
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../config/database";

// Allowed parcel types. Exported so services can validate input against the same list.
export const PARCEL_TYPES = ["palm_field", "greenhouse"] as const;
export type ParcelType = (typeof PARCEL_TYPES)[number];

export class Parcel extends Model<
  InferAttributes<Parcel>,
  InferCreationAttributes<Parcel>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare type: ParcelType;
  declare location: CreationOptional<string | null>;
  declare notes: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Parcel.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM(...PARCEL_TYPES), allowNull: false },
    location: { type: DataTypes.STRING(150), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE, // Filled automatically by Sequelize
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "parcels" },
);
