-- =====================================================
-- MEDICORE RECOMMENDATION FEATURE
-- =====================================================
-- Run this on your EXISTING Supabase database.
-- Do NOT run the full schema.sql if it contains DROP TABLE
-- statements for your existing production data.
-- =====================================================


-- =====================================================
-- 1. SUPPLIER OFFERINGS
-- =====================================================

create table if not exists supplier_offerings (
  id text primary key,

  supplier_id text
    references suppliers(id)
    on delete cascade,

  supplier_name text not null,

  medicine_id text
    references medicines(id)
    on delete cascade,

  medicine_name text not null,

  unit_purchase_price numeric
    not null
    default 0,

  min_order_quantity int
    not null
    default 1,

  lead_time_days int
    not null
    default 3,

  availability text
    not null
    default 'in_stock'
    check (
      availability in (
        'in_stock',
        'limited',
        'out_of_stock'
      )
    ),

  last_updated timestamptz
    default now(),

  unique(
    supplier_id,
    medicine_id
  )
);


-- =====================================================
-- 2. PHARMACIES
-- =====================================================

create table if not exists pharmacies (
  id text primary key,

  name text not null,

  address text not null,

  phone text,

  latitude numeric not null,

  longitude numeric not null,

  rating numeric default 0,

  open_24_hours boolean
    default false,

  delivery_available boolean
    default false,

  delivery_fee numeric
    default 0,

  status text
    default 'active'
    check (
      status in (
        'active',
        'inactive'
      )
    ),

  created_at timestamptz
    default now()
);


-- =====================================================
-- 3. PHARMACY INVENTORY
-- =====================================================

create table if not exists pharmacy_inventory (
  id text primary key,

  pharmacy_id text
    references pharmacies(id)
    on delete cascade,

  medicine_key text not null,

  medicine_name text not null,

  generic_name text,

  strength text,

  dosage_form text,

  price numeric
    not null
    default 0,

  stock int
    not null
    default 0,

  prescription_required boolean
    default false,

  last_updated timestamptz
    default now(),

  unique(
    pharmacy_id,
    medicine_key
  )
);


-- =====================================================
-- 4. INDEXES
-- =====================================================

create index if not exists
idx_supplier_offerings_medicine
on supplier_offerings(medicine_id);

create index if not exists
idx_pharmacy_inventory_key
on pharmacy_inventory(medicine_key);


-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

alter table supplier_offerings
enable row level security;

alter table pharmacies
enable row level security;

alter table pharmacy_inventory
enable row level security;


-- =====================================================
-- 6. POLICIES
-- =====================================================

drop policy if exists
"public read/write"
on supplier_offerings;

drop policy if exists
"public read/write"
on pharmacies;

drop policy if exists
"public read/write"
on pharmacy_inventory;


create policy
"public read/write"
on supplier_offerings
for all
using (true)
with check (true);


create policy
"public read/write"
on pharmacies
for all
using (true)
with check (true);


create policy
"public read/write"
on pharmacy_inventory
for all
using (true)
with check (true);