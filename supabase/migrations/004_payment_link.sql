-- Migration: Add payment_link to settings table

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS payment_link text;
