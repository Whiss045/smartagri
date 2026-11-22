/**
 * MODEL INDEX (assembly point)
 * Relationship overview:
 *   Parcel 1---* Plot, Device, Valve, Sensor, Schedule
 *   Plot   1---* Valve, Sensor        (optional placement inside a parcel)
 *   Device 1---* Valve, Sensor
 *   Valve  1---* Schedule
 *   Sensor 1---* SensorReading
 */
import sequelize from "../../config/database";
import { User } from "./user.model";
import { Parcel } from "./parcel.model";
import { Plot } from "./plot.model";
import { Device } from "./device.model";
import { Valve } from "./valve.model";
import { Sensor } from "./sensor.model";
import { SensorReading } from "./sensorReading.model";
import { Schedule } from "./schedule.model";

// Parcel -> Plot. A plot cannot exist without its parcel, so it goes with it.
Parcel.hasMany(Plot, {
  foreignKey: "parcelId",
  as: "plots",
  onDelete: "CASCADE",
});
Plot.belongsTo(Parcel, { foreignKey: "parcelId", as: "parcel" });

// Parcel -> Device. Deleting a parcel sends its devices back to "unassigned".
Parcel.hasMany(Device, {
  foreignKey: "parcelId",
  as: "devices",
  onDelete: "SET NULL",
});
Device.belongsTo(Parcel, { foreignKey: "parcelId", as: "parcel" });

// Parcel / Device / Plot -> Valve. Valves are never deleted by a cascade: they become unassigned.
Parcel.hasMany(Valve, {
  foreignKey: "parcelId",
  as: "valves",
  onDelete: "SET NULL",
});
Valve.belongsTo(Parcel, { foreignKey: "parcelId", as: "parcel" });
Device.hasMany(Valve, {
  foreignKey: "deviceId",
  as: "valves",
  onDelete: "SET NULL",
});
Valve.belongsTo(Device, { foreignKey: "deviceId", as: "device" });
Plot.hasMany(Valve, {
  foreignKey: "plotId",
  as: "valves",
  onDelete: "SET NULL",
});
Valve.belongsTo(Plot, { foreignKey: "plotId", as: "plot" });

// Parcel / Device / Plot -> Sensor. Detached, never deleted, so history survives.
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
Plot.hasMany(Sensor, {
  foreignKey: "plotId",
  as: "sensors",
  onDelete: "SET NULL",
});
Sensor.belongsTo(Plot, { foreignKey: "plotId", as: "plot" });

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
  Plot,
  Device,
  Valve,
  Sensor,
  SensorReading,
  Schedule,
};
