-- Initialize rewards database
CREATE SCHEMA IF NOT EXISTS public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO rewards_user;
