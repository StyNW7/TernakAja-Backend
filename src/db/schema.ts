import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  boolean,
  date,
  unique,
  primaryKey,
  pgEnum,
  foreignKey,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const farmsTable = pgTable("farms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  name: text("name"),
  location: text("location"),
  address: text("address"),
  type: text("type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const livestockTable = pgTable("livestock", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .notNull()
    .references(() => farmsTable.id),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  name: text("name"),
  species: text("species"),
  breed: text("breed"),
  gender: text("gender"),
  birthDate: date("birth_date"),
  photoUrl: text("photo_url"),
  status: text("status"),
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
  respiratoryRate: real("respiratory_rate"),
  timestamp: timestamp("timestamp"),
});

export const anomaliesTable = pgTable("anomalies", {
  livestockId: integer("livestock_id")
    .primaryKey()
    .references(() => livestockTable.id, { onDelete: "cascade" }),
  type: text("type"),
  severity: text("severity"),
  notes: text("notes"),
  detectedAt: timestamp("detected_at"),
  resolved: boolean("resolved"),
});

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  livestockId: integer("livestock_id")
    .notNull()
    .references(() => livestockTable.id, { onDelete: "cascade" }),
  deviceId: integer("device_id").notNull().unique(), // Azure IoT Hub DeviceId
  deviceType: text("device_type").notNull(), // e.g., 'collar-v1'
  firmware: text("firmware").notNull(), // e.g., 'latest'
  wifiSsid: text("wifi_ssid"), // Optional Wi-Fi SSID
  wifiPassword: text("wifi_password"), // Optional Wi-Fi Password
  connectionString: text("connection_string"), // Optional, secure IoT Hub connection string
  lastOnline: timestamp("last_online"), // Tracks device activity
});

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

export const forumCategoriesTable = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

export const forumsTable = pgTable("forums", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  title: text("title"),
  content: text("content"),
  categoryId: integer("category_id").references(() => forumCategoriesTable.id),
  createdAt: timestamp("created_at"),
});

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  forumId: integer("forum_id").references(() => forumsTable.id),
  content: text("content"),
  createdAt: timestamp("created_at"),
});

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  author: text("author"),
  title: text("title"),
  content: text("content"),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at"),
});

export const marketplaceStatusEnum = pgEnum("marketplace_status", [
  "draft",
  "pending_approval",
  "active",
  "sold",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "cancelled",
]);

export const marketplaceCategoriesTable = pgTable("marketplace_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const marketplaceTable = pgTable("marketplace", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  livestockId: integer("livestock_id")
    .notNull()
    .references(() => livestockTable.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(
    () => marketplaceCategoriesTable.id
  ),
  title: text("title"),
  description: text("description"),
  price: real("price"),
  status: marketplaceStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  approvedAt: timestamp("approved_at"),
});

export const marketplacePhotosTable = pgTable("marketplace_photos", {
  id: serial("id").primaryKey(),
  marketplaceId: integer("marketplace_id")
    .notNull()
    .references(() => marketplaceTable.id),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const marketplaceTransactionsTable = pgTable(
  "marketplace_transactions",
  {
    id: serial("id").primaryKey(),
    marketplaceId: integer("marketplace_id")
      .notNull()
      .references(() => marketplaceTable.id),
    buyerId: integer("buyer_id")
      .notNull()
      .references(() => usersTable.id),
    salePrice: real("sale_price").notNull(),
    status: transactionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  }
);
