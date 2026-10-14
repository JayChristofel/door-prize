import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const winners = pgTable("winners", {
  id: uuid("id").defaultRandom().primaryKey(),
  participantId: uuid("participant_id").references(() => participants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  round: integer("round").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
