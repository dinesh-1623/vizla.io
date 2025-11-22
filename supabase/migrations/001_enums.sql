-- Enums
-- Create all custom types used throughout the schema

CREATE TYPE vehicle_status AS ENUM (
  'Located',      -- Initial discovery
  'Blocked',      -- Cannot access (fence, legal, etc.)
  'Stashed',      -- Temporary stash spot
  'Dispatched',   -- Driver en route
  'Towed'         -- Completed recovery
);

CREATE TYPE spotter_submission_status AS ENUM (
  'pending',      -- Awaiting review
  'verified',     -- Confirmed as valid
  'duplicate',    -- Already exists
  'rejected'      -- Invalid submission
);

CREATE TYPE shift_type AS ENUM ('Day', 'Night');

CREATE TYPE storage_lot_type AS ENUM ('lot', 'stash');

CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'on_break', 'offline');

CREATE TYPE assignment_status AS ENUM ('assigned', 'in-progress', 'completed', 'cancelled');

CREATE TYPE user_role AS ENUM (
  'admin',      -- Full access
  'dispatcher', -- Assign vehicles, view all
  'manager',    -- View dashboards, reports
  'driver',     -- View own assignments
  'spotter'     -- Submit sightings
);

CREATE TYPE vehicle_type AS ENUM ('Tow Truck', 'Spotter', 'Rollback');


