/**
 * PLOT MODEL
 * A named sub-area of a parcel (for example "الحوض الشمالي"). Valves and sensors can be
 * placed in a plot. A plot ALWAYS belongs to exactly one parcel, so it cannot be "unassigned".
 */
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../config/database";

export class Plot extends Model<
  InferAttributes<Plot>,
  InferCreationAttributes<Plot>
> {
  declare id: CreationOptional<number>;
  declare parcelId: number;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Plot.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    parcelId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "plots",
    // Two plots of the same parcel cannot share a name
    indexes: [{ unique: true, fields: ["parcelId", "name"] }],
  },
);
