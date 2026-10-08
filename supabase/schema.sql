-- ============================================================
-- MediCore - Supabase Database Schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- Clean slate (safe to re-run while developing)
drop table if exists sale_items cascade;
drop table if exists sales cascade;
drop table if exists purchase_order_items cascade;
drop table if exists purchase_orders cascade;
drop table if exists batches cascade;
drop table if exists medicines cascade;
drop table if exists categories cascade;
drop table if exists suppliers cascade;
drop table if exists customers cascade;
drop table if exists notifications cascade;
drop table if exists generic_suggestions cascade;
drop table if exists settings cascade;

-- ============================================================
-- CATEGORIES
-- ============================================================
create table categories (
  id text primary key,
  name text not null,
  description text,
  icon_name text,
  color text,
  medicine_count int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- SUPPLIERS
-- ============================================================
create table suppliers (
  id text primary key,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  gst_number text,
  open_purchase_orders int default 0,
  on_time_delivery_rate numeric default 0,
  status text default 'active' check (status in ('active','inactive','preferred')),
  rating numeric default 0,
  payment_terms text,
  created_at timestamptz default now()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table customers (
  id text primary key,
  name text not null,
  phone text,
  email text,
  address text,
  orders_count int default 0,
  total_spent numeric default 0,
  last_purchase_date timestamptz,
  tier text default 'Regular' check (tier in ('VIP','Regular')),
  allergies text[] default '{}',
  chronic_conditions text[] default '{}',
  frequent_medicines text[] default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- MEDICINES
-- ============================================================
create table medicines (
  id text primary key,
  name text not null,
  generic_name text,
  category text,
  manufacturer text,
  dosage_form text,
  strength text,
  prescription_required boolean default false,
  unit_price numeric default 0,
  selling_price numeric default 0,
  stock int default 0,
  reorder_threshold int default 0,
  max_stock int default 0,
  supplier_id text references suppliers(id) on delete set null,
  supplier_name text,
  description text,
  side_effects text,
  contraindications text,
  location_rack text,
  status text default 'in_stock' check (status in ('in_stock','low_stock','critical','out_of_stock')),
  units_sold_total int default 0,
  revenue_total numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- BATCHES (one medicine has many batches)
-- ============================================================
create table batches (
  id text primary key,
  batch_number text,
  medicine_id text references medicines(id) on delete cascade,
  medicine_name text,
  manufacturing_date date,
  expiry_date date,
  quantity int default 0,
  initial_quantity int default 0,
  purchase_price numeric default 0,
  selling_price numeric default 0,
  supplier_id text references suppliers(id) on delete set null,
  supplier_name text,
  received_date date,
  status text default 'healthy' check (status in ('healthy','expiring_60','expiring_30','expiring_7','expired')),
  clearance_discount numeric,
  created_at timestamptz default now()
);
create index idx_batches_medicine_id on batches(medicine_id);

-- ============================================================
-- SALES (header) + SALE_ITEMS (lines, kept relational for reporting)
-- ============================================================
create table sales (
  id text primary key,
  invoice_number text unique,
  customer_id text references customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  date timestamptz default now(),
  subtotal numeric default 0,
  discount numeric default 0,
  tax numeric default 0,
  total numeric default 0,
  payment_method text check (payment_method in ('UPI','Cash','Card')),
  status text default 'paid' check (status in ('paid','pending','refunded')),
  pharmacist_name text,
  notes text,
  created_at timestamptz default now()
);

create table sale_items (
  id bigint generated always as identity primary key,
  sale_id text references sales(id) on delete cascade,
  medicine_id text,
  medicine_name text,
  generic_name text,
  batch_id text,
  batch_number text,
  expiry_date date,
  quantity int not null,
  unit_price numeric not null,
  total numeric not null
);
create index idx_sale_items_sale_id on sale_items(sale_id);

-- ============================================================
-- PURCHASE ORDERS (header) + PURCHASE_ORDER_ITEMS (lines)
-- ============================================================
create table purchase_orders (
  id text primary key,
  po_number text unique,
  supplier_id text references suppliers(id) on delete set null,
  supplier_name text,
  ordered_date timestamptz default now(),
  expected_delivery_date date,
  received_date date,
  subtotal numeric default 0,
  tax numeric default 0,
  total numeric default 0,
  status text default 'draft' check (status in ('draft','pending','confirmed','partially_received','received','cancelled')),
  notes text,
  created_at timestamptz default now()
);

create table purchase_order_items (
  id bigint generated always as identity primary key,
  purchase_order_id text references purchase_orders(id) on delete cascade,
  medicine_id text,
  medicine_name text,
  quantity int not null,
  received_quantity int default 0,
  purchase_price numeric not null,
  total numeric not null,
  batch_number text,
  expiry_date date
);
create index idx_po_items_po_id on purchase_order_items(purchase_order_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id text primary key,
  title text not null,
  message text,
  type text,
  priority text default 'info' check (priority in ('critical','warning','info','success')),
  timestamp timestamptz default now(),
  read boolean default false,
  link_route text,
  related_entity_id text
);

-- ============================================================
-- GENERIC SUGGESTIONS
-- ============================================================
create table generic_suggestions (
  id text primary key,
  brand_medicine text,
  active_ingredient text,
  strength text,
  dosage_form text,
  possible_generic text,
  brand_price numeric,
  generic_price numeric,
  savings_percent numeric,
  availability text check (availability in ('In Stock','Low Stock','Out of Stock')),
  inventory_stock int,
  reason text,
  manufacturer text
);

-- ============================================================
-- SETTINGS (single row of app-wide config, stored as JSONB)
-- ============================================================
create table settings (
  id int primary key default 1,
  data jsonb not null,
  constraint single_row check (id = 1)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- For a college project/demo with no login system, we open the
-- tables up to the public "anon" key so the app can read/write
-- directly from the browser. If you add real user auth later,
-- replace these with per-user policies.
-- ============================================================
alter table categories enable row level security;
alter table suppliers enable row level security;
alter table customers enable row level security;
alter table medicines enable row level security;
alter table batches enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table notifications enable row level security;
alter table generic_suggestions enable row level security;
alter table settings enable row level security;

create policy "public read/write" on categories for all using (true) with check (true);
create policy "public read/write" on suppliers for all using (true) with check (true);
create policy "public read/write" on customers for all using (true) with check (true);
create policy "public read/write" on medicines for all using (true) with check (true);
create policy "public read/write" on batches for all using (true) with check (true);
create policy "public read/write" on sales for all using (true) with check (true);
create policy "public read/write" on sale_items for all using (true) with check (true);
create policy "public read/write" on purchase_orders for all using (true) with check (true);
create policy "public read/write" on purchase_order_items for all using (true) with check (true);
create policy "public read/write" on notifications for all using (true) with check (true);
create policy "public read/write" on generic_suggestions for all using (true) with check (true);
create policy "public read/write" on settings for all using (true) with check (true);

-- ============================================================
-- SEED the settings row so the app has something to load
-- ============================================================
insert into settings (id, data) values (1, '{
  "profile": {"name": "Pharmacist", "role": "Pharmacist", "email": "", "phone": "", "avatarUrl": ""},
  "business": {"pharmacyName": "MediCore Pharmacy", "licenseNumber": "", "gstNumber": "", "address": "", "phone": "", "currency": "INR", "currencySymbol": "\u20b9", "lowStockThresholdDefault": 20, "nearExpiryDaysDefault": 60},
  "notifications": {"lowStockAlerts": true, "expiryAlerts": true, "supplierReminders": true, "dailySalesSummary": true, "aiRecommendations": true},
  "aiPreferences": {"enableAiInsights": true, "enableDemandForecast": true, "enableGenericSuggestions": true, "enablePrescriptionValidation": true, "confidenceThreshold": 80}
}'::jsonb)
on conflict (id) do nothing;
