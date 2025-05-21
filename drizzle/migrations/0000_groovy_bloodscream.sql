CREATE TYPE "public"."marketplace_status" AS ENUM('draft', 'pending_approval', 'active', 'sold');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "anomalies" (
	"livestock_id" integer PRIMARY KEY NOT NULL,
	"type" text,
	"severity" text,
	"notes" text,
	"detected_at" timestamp,
	"resolved" boolean
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"author" text,
	"title" text,
	"content" text,
	"cover_url" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"forum_id" integer,
	"content" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"livestock_id" integer NOT NULL,
	"last_online" timestamp
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text,
	"location" text,
	"address" text,
	"type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text
);
--> statement-breakpoint
CREATE TABLE "forums" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text,
	"content" text,
	"category_id" integer,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "livestock" (
	"id" serial PRIMARY KEY NOT NULL,
	"farm_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"name" text,
	"species" text,
	"breed" text,
	"gender" text,
	"birth_date" date,
	"photo_url" text,
	"status" text,
	"height" real,
	"weight" real,
	"body_condition_score" integer,
	"notes" text,
	"recorded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"marketplace_id" integer NOT NULL,
	"photo_url" text NOT NULL,
	"caption" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"livestock_id" integer NOT NULL,
	"category_id" integer,
	"title" text,
	"description" text,
	"price" real,
	"status" "marketplace_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketplace_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"marketplace_id" integer NOT NULL,
	"buyer_id" integer NOT NULL,
	"sale_price" real NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"livestock_id" integer NOT NULL,
	"message" text,
	"type" text,
	"read" boolean,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sensor_data" (
	"livestock_id" integer PRIMARY KEY NOT NULL,
	"temperature" real,
	"heart_rate" integer,
	"motion_level" real,
	"timestamp" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_livestock_id_livestock_id_fk" FOREIGN KEY ("livestock_id") REFERENCES "public"."livestock"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_forum_id_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_livestock_id_livestock_id_fk" FOREIGN KEY ("livestock_id") REFERENCES "public"."livestock"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forums" ADD CONSTRAINT "forums_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forums" ADD CONSTRAINT "forums_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock" ADD CONSTRAINT "livestock_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock" ADD CONSTRAINT "livestock_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_photos" ADD CONSTRAINT "marketplace_photos_marketplace_id_marketplace_id_fk" FOREIGN KEY ("marketplace_id") REFERENCES "public"."marketplace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace" ADD CONSTRAINT "marketplace_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace" ADD CONSTRAINT "marketplace_livestock_id_livestock_id_fk" FOREIGN KEY ("livestock_id") REFERENCES "public"."livestock"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace" ADD CONSTRAINT "marketplace_category_id_marketplace_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."marketplace_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_transactions" ADD CONSTRAINT "marketplace_transactions_marketplace_id_marketplace_id_fk" FOREIGN KEY ("marketplace_id") REFERENCES "public"."marketplace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_transactions" ADD CONSTRAINT "marketplace_transactions_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_livestock_id_livestock_id_fk" FOREIGN KEY ("livestock_id") REFERENCES "public"."livestock"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_data" ADD CONSTRAINT "sensor_data_livestock_id_livestock_id_fk" FOREIGN KEY ("livestock_id") REFERENCES "public"."livestock"("id") ON DELETE cascade ON UPDATE no action;