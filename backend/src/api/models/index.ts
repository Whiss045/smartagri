/**
 * MODEL INDEX (assembly point)
 * Imports every model and defines the relationships between them in ONE place.
 * The rest of the app imports models from here: import { Parcel } from '../models'.
 *
 * Relationship overview:
 *   Parcel 1---* Device, Valve, Sensor, Schedule
 *   Device 1---* Valve, Sensor
 *   Valve  1---* Schedule
 *   Sensor 1---* SensorReading
 */
import sequelize from "../../config/database";
import { User } from "./user.model";
import { Parcel } from "./parcel.model";
import { Device } from "./device.model";
import { Valve } from "./valve.model";
import { Sensor } from "./sensor.model";
import { SensorReading } from "./sensorReading.model";
import { Schedule } from "./schedule.model";

// Parcel -> Device. Deleting a parcel does NOT delete its devices: they go back to "unassigned".
Parcel.hasMany(Device, {
  foreignKey: "parcelId",
  as: "devices",
  onDelete: "SET NULL",
});
Device.belongsTo(Parcel, { foreignKey: "parcelId", as: "parcel" });

// Parcel / Device -> Valve. Valves are removed together with their parcel or device.
Parcel.hasMany(Valve, {
  foreignKey: "parcelId",
  as: "valves",
  onDelete: "CASCADE",
});
Valve.belongsTo(Parcel, { foreignKey: "parcelId", as: "parcel" });
Device.hasMany(Valve, {
  foreignKey: "deviceId",
  as: "valves",
  onDelete: "CASCADE",
});
Valve.belongsTo(Device, { foreignKey: "deviceId", as: "device" });

// Parcel / Device -> Sensor. Sensors are DETACHED, never deleted, so their history survives.
Parcel.hasMany(Sensor, {
  foreignKey: "parcelId",
  as: "sensors",
  onDelete: "SET NULL",
});
Sensor.belongsTo(Parcel, { foreignKey: "parcelId", as: "parcel" });
Device.hasMany(Sensor, {
  foreignKey: "deviceId",
  as: "sensors",
  onDelete: "SET NULL",
});
Sensor.belongsTo(Device, { foreignKey: "deviceId", as: "device" });

// Sensor -> SensorReading. RESTRICT blocks any cascade from wiping history.
Sensor.hasMany(SensorReading, {
  foreignKey: "sensorId",
  as: "readings",
  onDelete: "RESTRICT",
});
SensorReading.belongsTo(Sensor, { foreignKey: "sensorId", as: "sensor" });

// Parcel / Valve -> Schedule. A schedule disappears with its parcel or valve.
Parcel.hasMany(Schedule, {
  foreignKey: "parcelId",
  as: "schedules",
  onDelete: "CASCADE",
});
Schedule.belongsTo(Parcel, { foreignKey: "parcelId", as: "parcel" });
Valve.hasMany(Schedule, {
  foreignKey: "valveId",
  as: "schedules",
  onDelete: "CASCADE",
});
Schedule.belongsTo(Valve, { foreignKey: "valveId", as: "valve" });

export {
  sequelize,
  User,
  Parcel,
  Device,
  Valve,
  Sensor,
  SensorReading,
  Schedule,
};
