ALTER TABLE "winners" DROP CONSTRAINT "winners_participant_id_participants_id_fk";
--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "winners" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "winners" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "winners" ALTER COLUMN "participant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "winners" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "winners" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "column" text;--> statement-breakpoint
ALTER TABLE "winners" ADD COLUMN "column" text;--> statement-breakpoint
ALTER TABLE "winners" ADD CONSTRAINT "winners_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;