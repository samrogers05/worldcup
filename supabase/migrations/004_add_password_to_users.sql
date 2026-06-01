-- Add password column to users table
alter table users add column if not exists password text;
