-- Allow multiple signals per evidence.
-- The original MVP enforced one signal per evidence via a unique index.
-- Geofence matching (and future correlation rules) legitimately require many-per-evidence.

DROP INDEX IF EXISTS idx_signal_one_per_evidence;


