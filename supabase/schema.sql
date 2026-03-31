-- ============================================================
-- LocalRank Pro — Full Database Schema (Phase 1)
-- Run in Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type user_role as enum ('owner', 'team', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type package_type as enum ('Starter', 'Growth', 'Premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('Paid', 'Pending', 'Overdue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('Not Started', 'In Progress', 'Done', 'Overdue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type audit_status as enum ('Done', 'In Progress', 'Pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_level as enum ('High', 'Medium', 'Low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_frequency as enum ('Daily', 'Weekly', 'Monthly', 'One-time');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFILES (linked to Supabase Auth users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text,
  email text,
  role user_role not null default 'team',
  phone text,
  avatar_url text,
  is_active boolean not null default true
);

-- ============================================================
-- CLIENTS
-- ============================================================
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  business_name text not null,
  business_type text,
  city text default 'Pune',
  area text,
  color_tag text default '#3b82f6',
  owner_name text,
  phone text,
  email text,
  whatsapp text,
  gbp_link text,
  website_url text,
  facebook_page text,
  instagram_handle text,
  package_type package_type default 'Starter',
  monthly_fee numeric(10,2),
  start_date date,
  renewal_date date,
  payment_status payment_status default 'Pending',
  assigned_to uuid references public.profiles(id) on delete set null,
  performance_score numeric(5,2) default 0,
  next_followup_date date,
  login_credentials jsonb default '[]',
  notes text,
  is_active boolean not null default true,
  client_user_id uuid references auth.users(id) on delete set null
);

-- ============================================================
-- GBP AUDIT CHECKLIST
-- ============================================================
create table if not exists public.gbp_audit_items (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  section text not null,
  task_name text not null,
  sort_order integer default 0
);

create table if not exists public.gbp_audit_responses (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  audit_item_id uuid not null references public.gbp_audit_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status audit_status not null default 'Pending',
  priority priority_level not null default 'Medium',
  notes text,
  unique(client_id, audit_item_id)
);

-- ============================================================
-- KEYWORD TRACKER
-- ============================================================
create table if not exists public.keywords (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  keyword text not null,
  keyword_type text,
  monthly_search_volume integer,
  competition text check (competition in ('Low', 'Medium', 'High')),
  priority priority_level default 'Medium',
  used_in_gbp boolean default false,
  used_on_website boolean default false,
  current_ranking integer,
  target_ranking integer,
  last_updated date default current_date,
  notes text
);

-- ============================================================
-- MONTHLY TASK CALENDAR
-- ============================================================
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  task_name text not null,
  client_id uuid references public.clients(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  status task_status default 'Not Started',
  frequency task_frequency default 'Monthly',
  notes text,
  month_year text
);

-- ============================================================
-- REVIEW TRACKER
-- ============================================================
create table if not exists public.review_tracker (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  month_year text not null,
  reviews_start integer default 0,
  new_reviews integer default 0,
  total_reviews integer generated always as (reviews_start + new_reviews) stored,
  average_rating numeric(3,2),
  target_rating numeric(3,2) default 4.5,
  all_responded boolean default false,
  review_request_sent_date date,
  negative_reviews_count integer default 0,
  action_on_negatives text,
  notes text,
  unique(client_id, month_year)
);

-- ============================================================
-- COMPETITOR TRACKER
-- ============================================================
create table if not exists public.competitors (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  competitor_name text not null,
  gbp_link text,
  review_count integer,
  average_rating numeric(3,2),
  ranking_position integer,
  our_client_ranking integer,
  strengths text,
  weaknesses text,
  last_checked_date date default current_date,
  notes text
);

-- ============================================================
-- MONTHLY REPORT
-- ============================================================
create table if not exists public.monthly_reports (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  month_year text not null,
  profile_views integer,
  search_views integer,
  map_views integer,
  total_calls integer,
  direction_requests integer,
  website_clicks integer,
  total_reviews integer,
  new_reviews integer,
  average_rating numeric(3,2),
  top_keyword text,
  top_keyword_ranking integer,
  prev_profile_views integer,
  prev_total_calls integer,
  prev_website_clicks integer,
  overall_performance_score numeric(5,2),
  report_sent boolean default false,
  report_sent_date date,
  notes text,
  unique(client_id, month_year)
);

-- ============================================================
-- BRANDING & CONTENT
-- ============================================================
create table if not exists public.branding_profiles (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  logo_url text,
  primary_color text,
  secondary_color text,
  brand_tone text check (brand_tone in ('Formal', 'Friendly', 'Bold', 'Playful', 'Professional')),
  content_pillars jsonb default '[]',
  content_dos text,
  content_donts text,
  hashtag_bank text,
  caption_templates text,
  approved_post_types jsonb default '[]',
  posting_frequency integer default 2,
  notes text
);

-- ============================================================
-- ADVANCED GBP SETTINGS
-- ============================================================
create table if not exists public.gbp_settings (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  utm_tracking boolean default false,
  google_ads_connected boolean default false,
  booking_link_added boolean default false,
  booking_url text,
  products_section_filled boolean default false,
  messaging_enabled boolean default false,
  messaging_autoreply boolean default false,
  website_linked_verified boolean default false,
  analytics_connected boolean default false,
  search_console_connected boolean default false,
  service_area_defined boolean default false,
  service_area_details text,
  attributes_filled boolean default false,
  photos_minimum_10 boolean default false,
  category_optimized boolean default false,
  gbp_category text,
  qa_populated boolean default false,
  short_name_set boolean default false,
  gbp_short_url text,
  last_settings_review date
);

-- ============================================================
-- SOPs & REFERENCE
-- ============================================================
create table if not exists public.sops (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  category text,
  content text,
  sort_order integer default 0
);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace trigger profiles_updated_at before update on public.profiles for each row execute function update_updated_at();
create or replace trigger clients_updated_at before update on public.clients for each row execute function update_updated_at();
create or replace trigger gbp_audit_items_updated_at before update on public.gbp_audit_items for each row execute function update_updated_at();
create or replace trigger gbp_audit_responses_updated_at before update on public.gbp_audit_responses for each row execute function update_updated_at();
create or replace trigger keywords_updated_at before update on public.keywords for each row execute function update_updated_at();
create or replace trigger tasks_updated_at before update on public.tasks for each row execute function update_updated_at();
create or replace trigger review_tracker_updated_at before update on public.review_tracker for each row execute function update_updated_at();
create or replace trigger competitors_updated_at before update on public.competitors for each row execute function update_updated_at();
create or replace trigger monthly_reports_updated_at before update on public.monthly_reports for each row execute function update_updated_at();
create or replace trigger branding_profiles_updated_at before update on public.branding_profiles for each row execute function update_updated_at();
create or replace trigger gbp_settings_updated_at before update on public.gbp_settings for each row execute function update_updated_at();
create or replace trigger sops_updated_at before update on public.sops for each row execute function update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'team')
  );
  return new;
end $$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.gbp_audit_items enable row level security;
alter table public.gbp_audit_responses enable row level security;
alter table public.keywords enable row level security;
alter table public.tasks enable row level security;
alter table public.review_tracker enable row level security;
alter table public.competitors enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.branding_profiles enable row level security;
alter table public.gbp_settings enable row level security;
alter table public.sops enable row level security;

create or replace function public.get_user_role()
returns user_role language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_client_ids()
returns setof uuid language sql security definer stable as $$
  select id from public.clients where assigned_to = auth.uid();
$$;

-- Profiles
create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "owner view all profiles" on public.profiles for select using (get_user_role() = 'owner');
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "owner manage profiles" on public.profiles for all using (get_user_role() = 'owner');

-- Clients
create policy "owner manage clients" on public.clients for all using (get_user_role() = 'owner');
create policy "team see assigned" on public.clients for select using (get_user_role() = 'team' and assigned_to = auth.uid());
create policy "client see own" on public.clients for select using (get_user_role() = 'client' and client_user_id = auth.uid());

-- Audit items (global)
create policy "all read audit items" on public.gbp_audit_items for select using (auth.uid() is not null);
create policy "owner manage audit items" on public.gbp_audit_items for all using (get_user_role() = 'owner');

-- Audit responses
create policy "owner audit resp" on public.gbp_audit_responses for all using (get_user_role() = 'owner');
create policy "team audit resp" on public.gbp_audit_responses for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

-- Keywords
create policy "owner keywords" on public.keywords for all using (get_user_role() = 'owner');
create policy "team keywords" on public.keywords for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));
create policy "client keywords" on public.keywords for select using (get_user_role() = 'client' and client_id in (select id from clients where client_user_id = auth.uid()));

-- Tasks
create policy "owner tasks" on public.tasks for all using (get_user_role() = 'owner');
create policy "team tasks" on public.tasks for all using (get_user_role() = 'team' and (assigned_to = auth.uid() or client_id in (select get_my_client_ids())));

-- Review tracker
create policy "owner reviews" on public.review_tracker for all using (get_user_role() = 'owner');
create policy "team reviews" on public.review_tracker for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));
create policy "client reviews" on public.review_tracker for select using (get_user_role() = 'client' and client_id in (select id from clients where client_user_id = auth.uid()));

-- Competitors
create policy "owner competitors" on public.competitors for all using (get_user_role() = 'owner');
create policy "team competitors" on public.competitors for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

-- Monthly reports
create policy "owner reports" on public.monthly_reports for all using (get_user_role() = 'owner');
create policy "team reports" on public.monthly_reports for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));
create policy "client reports" on public.monthly_reports for select using (get_user_role() = 'client' and client_id in (select id from clients where client_user_id = auth.uid()));

-- Branding
create policy "owner branding" on public.branding_profiles for all using (get_user_role() = 'owner');
create policy "team branding" on public.branding_profiles for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

-- GBP Settings
create policy "owner gbp settings" on public.gbp_settings for all using (get_user_role() = 'owner');
create policy "team gbp settings" on public.gbp_settings for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

-- SOPs
create policy "all read sops" on public.sops for select using (auth.uid() is not null);
create policy "owner manage sops" on public.sops for all using (get_user_role() = 'owner');

-- ============================================================
-- GMB Connect Invites (magic link tokens)
-- ============================================================
create table if not exists public.gmb_connect_invites (
  id         uuid primary key default uuid_generate_v4(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at    timestamptz
);

alter table public.gmb_connect_invites enable row level security;

-- Anon can read valid (unused, unexpired) invites — needed by the public connect page
create policy "anon read valid invites"
  on public.gmb_connect_invites for select to anon
  using (used_at is null and expires_at > now());

-- Authenticated agency users can manage invites
create policy "authenticated manage invites"
  on public.gmb_connect_invites for all to authenticated
  using (true) with check (true);

-- Anon can read basic client info for the connect page
create policy "anon read client for connect"
  on public.clients for select to anon
  using (is_active = true);

-- ============================================================
-- SEED: GBP Audit Template Items
-- ============================================================
insert into public.gbp_audit_items (section, task_name, sort_order) values
  ('Profile Basics', 'Business name correctly listed', 1),
  ('Profile Basics', 'Primary category selected & optimized', 2),
  ('Profile Basics', 'Secondary categories added', 3),
  ('Profile Basics', 'Business description written (750 chars)', 4),
  ('Contact Info', 'Phone number correct & consistent (NAP)', 5),
  ('Contact Info', 'Address correct & consistent (NAP)', 6),
  ('Contact Info', 'Website URL added & working', 7),
  ('Hours', 'Regular hours set correctly', 8),
  ('Hours', 'Special/holiday hours added', 9),
  ('Services', 'All services listed', 10),
  ('Services', 'Service descriptions added', 11),
  ('Services', 'Service prices added (if applicable)', 12),
  ('Photos', 'Logo uploaded', 13),
  ('Photos', 'Cover photo uploaded', 14),
  ('Photos', 'Interior photos (min 3)', 15),
  ('Photos', 'Exterior photos (min 3)', 16),
  ('Photos', 'Team photos uploaded', 17),
  ('Photos', 'Product/service photos (min 5)', 18),
  ('Photos', 'Total photos 10+ uploaded', 19),
  ('Reviews', 'Review link created & shared with client', 20),
  ('Reviews', 'All reviews responded to', 21),
  ('Reviews', '5+ new reviews this month', 22),
  ('Posts', '2–3 posts published per week', 23),
  ('Posts', 'Offer post created this month', 24),
  ('Posts', 'Event post created this month', 25),
  ('Q&A', 'Common questions answered (5+)', 26),
  ('Q&A', 'Spam Q&A removed', 27),
  ('Messaging', 'Messaging enabled', 28),
  ('Messaging', 'Auto-reply message set up', 29)
on conflict do nothing;

-- ============================================================
-- MIGRATION: Add review URL fields to clients
-- ============================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS google_review_url text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'English';

-- Allow anon to read keywords for review generation
CREATE POLICY "anon read keywords for review"
  ON public.keywords FOR SELECT TO anon
  USING (true);

-- ============================================================
-- CONTENT STUDIO
-- ============================================================

do $$ begin
  create type content_idea_status as enum ('idea', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_calendar_status as enum ('draft', 'generated', 'approved', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_platform as enum ('Instagram', 'Facebook', 'GBP', 'WhatsApp');
exception when duplicate_object then null; end $$;

-- Content Ideas (Idea Bank)
create table if not exists public.content_ideas (
  id             uuid primary key default uuid_generate_v4(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  title          text not null,
  description    text,
  post_type      text not null default 'Tips',
  content_pillar text,
  keywords_used  jsonb not null default '[]',
  platform       jsonb not null default '["Instagram"]',
  status         content_idea_status not null default 'idea',
  ai_generated   boolean not null default false,
  notes          text
);

create index if not exists content_ideas_client_id_idx on public.content_ideas(client_id);
create index if not exists content_ideas_status_idx on public.content_ideas(status);

create or replace trigger content_ideas_updated_at
  before update on public.content_ideas
  for each row execute function update_updated_at();

-- Content Calendar
create table if not exists public.content_calendar (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  content_idea_id  uuid references public.content_ideas(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  scheduled_date   date not null,
  month_year       text not null,
  platform         content_platform not null default 'Instagram',
  status           content_calendar_status not null default 'draft',
  caption          text,
  hashtags         text,
  image_url        text,
  image_prompt     text,
  notes            text
);

create index if not exists content_calendar_client_id_idx on public.content_calendar(client_id);
create index if not exists content_calendar_month_year_idx on public.content_calendar(month_year);
create index if not exists content_calendar_scheduled_date_idx on public.content_calendar(scheduled_date);

create or replace trigger content_calendar_updated_at
  before update on public.content_calendar
  for each row execute function update_updated_at();

-- RLS
alter table public.content_ideas enable row level security;
alter table public.content_calendar enable row level security;

create policy "owner content_ideas" on public.content_ideas
  for all using (get_user_role() = 'owner');
create policy "team content_ideas" on public.content_ideas
  for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

create policy "owner content_calendar" on public.content_calendar
  for all using (get_user_role() = 'owner');
create policy "team content_calendar" on public.content_calendar
  for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

-- ============================================================
-- MIGRATION: Add gem_instructions to branding_profiles
-- ============================================================
alter table public.branding_profiles add column if not exists gem_instructions text;

-- ============================================================
-- GMB TOKENS (OAuth credentials per client)
-- ============================================================
create table if not exists public.gmb_tokens (
  id                uuid primary key default uuid_generate_v4(),
  client_id         uuid not null unique references public.clients(id) on delete cascade,
  google_email      text,
  account_name      text,
  location_name     text,
  location_title    text,
  access_token      text not null,
  refresh_token     text not null,
  token_expires_at  timestamptz not null,
  reviews_synced_at timestamptz,
  posts_synced_at   timestamptz,
  insights_synced_at timestamptz,
  info_synced_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create or replace trigger gmb_tokens_updated_at
  before update on public.gmb_tokens
  for each row execute function update_updated_at();

-- ============================================================
-- GMB REVIEWS (synced Google reviews)
-- ============================================================
do $$ begin
  create type gmb_star_rating as enum ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE');
exception when duplicate_object then null; end $$;

create table if not exists public.gmb_reviews (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  gmb_review_id   text not null,
  reviewer_name   text,
  reviewer_photo  text,
  star_rating     gmb_star_rating not null,
  comment         text,
  review_time     text,
  reply_comment   text,
  reply_time      text,
  created_at      timestamptz not null default now(),
  unique(client_id, gmb_review_id)
);

create index if not exists gmb_reviews_client_id_idx on public.gmb_reviews(client_id);

-- ============================================================
-- GMB POSTS (GBP local posts)
-- ============================================================
do $$ begin
  create type gmb_topic_type as enum ('STANDARD', 'EVENT', 'OFFER');
exception when duplicate_object then null; end $$;

create table if not exists public.gmb_posts (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  gmb_post_id   text,
  topic_type    gmb_topic_type not null default 'STANDARD',
  summary       text,
  event_title   text,
  event_start   text,
  event_end     text,
  cta_type      text,
  cta_url       text,
  media_urls    text[] default '{}',
  state         text,
  create_time   text,
  created_at    timestamptz not null default now(),
  unique(client_id, gmb_post_id)
);

create index if not exists gmb_posts_client_id_idx on public.gmb_posts(client_id);

-- ============================================================
-- GMB INSIGHTS (daily performance metrics)
-- ============================================================
create table if not exists public.gmb_insights (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  metric_date   text not null,
  metric_type   text not null,
  value         integer not null default 0,
  created_at    timestamptz not null default now(),
  unique(client_id, metric_date, metric_type)
);

create index if not exists gmb_insights_client_id_idx on public.gmb_insights(client_id);

-- ============================================================
-- GMB BUSINESS INFO (location details)
-- ============================================================
create table if not exists public.gmb_business_info (
  id                            uuid primary key default uuid_generate_v4(),
  client_id                     uuid not null unique references public.clients(id) on delete cascade,
  title                         text,
  description                   text,
  primary_phone                 text,
  website_uri                   text,
  primary_category_name         text,
  primary_category_display_name text,
  open_for_business             text,
  address                       jsonb,
  regular_hours                 jsonb default '[]',
  synced_at                     timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create or replace trigger gmb_business_info_updated_at
  before update on public.gmb_business_info
  for each row execute function update_updated_at();

-- ============================================================
-- GMB RLS POLICIES
-- ============================================================
alter table public.gmb_tokens enable row level security;
alter table public.gmb_reviews enable row level security;
alter table public.gmb_posts enable row level security;
alter table public.gmb_insights enable row level security;
alter table public.gmb_business_info enable row level security;

create policy "owner gmb_tokens" on public.gmb_tokens
  for all using (get_user_role() = 'owner');
create policy "team gmb_tokens" on public.gmb_tokens
  for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

create policy "owner gmb_reviews" on public.gmb_reviews
  for all using (get_user_role() = 'owner');
create policy "team gmb_reviews" on public.gmb_reviews
  for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

create policy "owner gmb_posts" on public.gmb_posts
  for all using (get_user_role() = 'owner');
create policy "team gmb_posts" on public.gmb_posts
  for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

create policy "owner gmb_insights" on public.gmb_insights
  for all using (get_user_role() = 'owner');
create policy "team gmb_insights" on public.gmb_insights
  for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

create policy "owner gmb_business_info" on public.gmb_business_info
  for all using (get_user_role() = 'owner');
create policy "team gmb_business_info" on public.gmb_business_info
  for all using (get_user_role() = 'team' and client_id in (select get_my_client_ids()));

-- Service role can manage all GMB tables (for server-side sync operations)
create policy "service gmb_tokens" on public.gmb_tokens
  for all to service_role using (true) with check (true);
create policy "service gmb_reviews" on public.gmb_reviews
  for all to service_role using (true) with check (true);
create policy "service gmb_posts" on public.gmb_posts
  for all to service_role using (true) with check (true);
create policy "service gmb_insights" on public.gmb_insights
  for all to service_role using (true) with check (true);
create policy "service gmb_business_info" on public.gmb_business_info
  for all to service_role using (true) with check (true);

-- ============================================================
-- REVIEW ANALYTICS (QR link tracking — replaces file-based storage)
-- ============================================================
create table if not exists public.review_analytics (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null unique references public.clients(id) on delete cascade,
  visits        integer not null default 0,
  completions   integer not null default 0,
  ratings       jsonb not null default '{"1":0,"2":0,"3":0,"4":0,"5":0}',
  last_visit    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.review_analytics enable row level security;

create policy "authenticated read review_analytics" on public.review_analytics
  for select to authenticated using (true);

create policy "service manage review_analytics" on public.review_analytics
  for all to service_role using (true) with check (true);
