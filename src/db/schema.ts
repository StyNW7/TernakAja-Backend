import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  boolean,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const livestockTable = pgTable("livestock", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  name: text("name"),
  species: text("species"),
  breed: text("breed"),
  gender: text("gender"),
  birthDate: date("birth_date"),
  photoUrl: text("photo_url"),
  status: text("status"), // "healthy", "unhealthy"
  height: real("height"), // cm
  weight: real("weight"), // kg
  bodyConditionScore: integer("body_condition_score"),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sensorDataTable = pgTable("sensor_data", {
  id: serial("id").primaryKey(),
  livestockId: integer("livestock_id")
    .notNull()
    .references(() => livestockTable.id, { onDelete: "cascade" }),
  temperature: real("temperature"),
  heartRate: integer("heart_rate"),
  sp02: real("sp02"),
  timestamp: timestamp("timestamp"),
});

export const devicesTable = pgTable(
  "devices",
  {
    livestockId: integer("livestock_id")
      .notNull()
      .references(() => livestockTable.id, { onDelete: "cascade" }),
    deviceId: integer("device_id").notNull(),
    lastUpdate: timestamp("last_update"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.livestockId, table.deviceId] }),
  })
);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  livestockId: integer("livestock_id")
    .notNull()
    .references(() => livestockTable.id, { onDelete: "cascade" }),
  message: text("message"),
  type: text("type"),
  read: boolean("read"),
  sentAt: timestamp("sent_at"),
});
