ALTER TABLE "anomalies" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "articles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "comments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "farms" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "forum_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "forums" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "marketplace_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "marketplace_photos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "marketplace" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "marketplace_transactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "anomalies" CASCADE;--> statement-breakpoint
DROP TABLE "articles" CASCADE;--> statement-breakpoint
DROP TABLE "comments" CASCADE;--> statement-breakpoint
DROP TABLE "farms" CASCADE;--> statement-breakpoint
DROP TABLE "forum_categories" CASCADE;--> statement-breakpoint
DROP TABLE "forums" CASCADE;--> statement-breakpoint
DROP TABLE "marketplace_categories" CASCADE;--> statement-breakpoint
DROP TABLE "marketplace_photos" CASCADE;--> statement-breakpoint
DROP TABLE "marketplace" CASCADE;--> statement-breakpoint
DROP TABLE "marketplace_transactions" CASCADE;--> statement-breakpoint
ALTER TABLE "devices" RENAME COLUMN "last_online" TO "last_update";--> statement-breakpoint
ALTER TABLE "livestock" DROP CONSTRAINT "livestock_farm_id_farms_id_fk";
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'sensor_data'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "sensor_data" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_livestock_id_device_id_pk" PRIMARY KEY("livestock_id","device_id");--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "device_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sensor_data" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "sensor_data" ADD COLUMN "sp02" real;--> statement-breakpoint
ALTER TABLE "devices" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "livestock" DROP COLUMN "farm_id";--> statement-breakpoint
ALTER TABLE "sensor_data" DROP COLUMN "motion_level";--> statement-breakpoint
DROP TYPE "public"."marketplace_status";--> statement-breakpoint
DROP TYPE "public"."transaction_status";