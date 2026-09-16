UPDATE "offices"
SET "weeklySchedule" = jsonb_build_object(
  'monday', jsonb_build_object('openTime', "openTime", 'closeTime', "closeTime"),
  'tuesday', jsonb_build_object('openTime', "openTime", 'closeTime', "closeTime"),
  'wednesday', jsonb_build_object('openTime', "openTime", 'closeTime', "closeTime"),
  'thursday', jsonb_build_object('openTime', "openTime", 'closeTime', "closeTime"),
  'friday', jsonb_build_object('openTime', "openTime", 'closeTime', "closeTime"),
  'saturday', jsonb_build_object('openTime', "openTime", 'closeTime', "closeTime"),
  'sunday', NULL
)
WHERE "weeklySchedule" IS NULL;