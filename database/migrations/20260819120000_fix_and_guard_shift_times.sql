-- Repairs rows where `times` was accidentally double JSON-encoded (stored as a
-- jsonb string instead of a jsonb array), caused by a bug in netlify/lib/shifts.ts
-- that pre-stringified the value before handing it to postgres.js.
UPDATE shifts
SET times = (times #>> '{}')::jsonb
WHERE jsonb_typeof(times) != 'array';

ALTER TABLE shifts
  ADD CONSTRAINT shifts_times_is_array CHECK (jsonb_typeof(times) = 'array');
