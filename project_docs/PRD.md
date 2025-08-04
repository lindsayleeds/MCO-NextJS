# Overview

I have a mock portfolio I am managing. The database is stored in Supabase. I want to write a NextJS front-end.

## Technology Stack

- Next.js
- React
- Tailwind CSS
- TypeScript
- Supabase for database and authentication
- TanStack Table (React Table v8) for data grids
- AG Charts for charts
- Python FastAPI Server - port 5050 - for certain api calls - we will try to a lot of things native

## Definitions
A "snapshot" is when I want compute a return for certain amount of time, it saves all the opening and closing prices for items in the portfolio.

## Screens
I need a screen to manage snapshots - add / edit / remove

## Users and login

- I want two classes of users admin and user
- Create lindsayleeds@gmail.com as admin
- I want login with magic link, no password
- I want a backdoor login link when we are running in development mode with npm run dev - that does not work in production. I need this for automated testing so I don't have to navigate login screens to test

## Database Schema

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.dividends (
  position_id uuid NOT NULL,
  payment_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  ticker text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dividends_pkey PRIMARY KEY (id),
  CONSTRAINT dividends_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id)
);
CREATE TABLE public.positions (
  ticker text NOT NULL,
  company_name text,
  start_date date NOT NULL,
  start_price numeric,
  blog_post_url text,
  end_date date,
  end_price numeric,
  start_price_override numeric,
  end_price_override numeric,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'Open'::position_status,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT positions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone,
  username text UNIQUE CHECK (char_length(username) >= 3),
  full_name text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.dividends (
  position_id uuid NOT NULL,
  payment_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  ticker text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dividends_pkey PRIMARY KEY (id),
  CONSTRAINT dividends_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id)
);
CREATE TABLE public.positions (
  ticker text NOT NULL,
  company_name text,
  start_date date NOT NULL,
  start_price numeric,
  blog_post_url text,
  end_date date,
  end_price numeric,
  start_price_override numeric,
  end_price_override numeric,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'Open'::position_status,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT positions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone,
  username text UNIQUE CHECK (char_length(username) >= 3),
  full_name text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.settings (
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.snapshot_positions (
  snapshot_id uuid,
  ticker text NOT NULL,
  company_name text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_price double precision,
  end_price double precision,
  return_pct_at_snapshot double precision,
  status text CHECK (status = ANY (ARRAY['Open'::text, 'Closed'::text])),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  dividends_paid numeric DEFAULT 0.00,
  CONSTRAINT snapshot_positions_pkey PRIMARY KEY (id),
  CONSTRAINT snapshot_positions_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES public.snapshots(id)
);
CREATE TABLE public.snapshots (
  overall_portfolio_return_pct numeric,
  notes text,
  start_date date,
  end_date date,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'pending'::snapshot_status,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT snapshots_pkey PRIMARY KEY (id)
);
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.settings (
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.snapshot_positions (
  snapshot_id uuid,
  ticker text NOT NULL,
  company_name text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_price double precision,
  end_price double precision,
  return_pct_at_snapshot double precision,
  status text CHECK (status = ANY (ARRAY['Open'::text, 'Closed'::text])),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  dividends_paid numeric DEFAULT 0.00,
  CONSTRAINT snapshot_positions_pkey PRIMARY KEY (id),
  CONSTRAINT snapshot_positions_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES public.snapshots(id)
);
CREATE TABLE public.snapshots (
  overall_portfolio_return_pct numeric,
  notes text,
  start_date date,
  end_date date,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'pending'::snapshot_status,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT snapshots_pkey PRIMARY KEY (id)
);