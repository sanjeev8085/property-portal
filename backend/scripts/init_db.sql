-- Database initialization script for Property Portal
-- Creates extensions needed for PostgreSQL

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Unaccent for better search
CREATE EXTENSION IF NOT EXISTS "unaccent";
