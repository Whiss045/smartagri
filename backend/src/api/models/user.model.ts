/**
 * USER MODEL
 * Represents the single farmer account. It is READ-ONLY from the app's point of view:
 * no endpoint creates, edits or deletes users. The row is inserted manually in the database
 * (with an Argon2 hash in passwordHash).
 */
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../config/database";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  // `declare` gives TypeScript the field types without creating runtime class fields
  declare id: CreationOptional<number>;
  declare username: string;
  declare passwordHash: string; // Argon2 hash, never the plain password
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: "users", timestamps: false },
);
