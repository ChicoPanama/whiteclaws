-- Add protocol public key for encrypted submissions
alter table protocols add column if not exists public_key text;
