-- Rename the site, unless the admin already chose a name of their own in Settings.
UPDATE "settings" SET "value" = 'The Biology Universe' WHERE "key" = 'site_name' AND "value" = 'Pathshala';
