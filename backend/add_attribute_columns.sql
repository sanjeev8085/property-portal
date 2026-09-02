-- Migration script to add pg_for, room_type, and food_status columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pg_for VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS room_type VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS food_status VARCHAR(100);
