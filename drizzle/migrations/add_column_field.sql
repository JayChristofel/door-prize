-- Migration: Add column field to participants and winners
-- Safe to run multiple times (uses IF NOT EXISTS)

ALTER TABLE participants ADD COLUMN IF NOT EXISTS column text;
ALTER TABLE winners ADD COLUMN IF NOT EXISTS column text;
