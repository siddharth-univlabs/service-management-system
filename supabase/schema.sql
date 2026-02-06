-- Medical Device Asset & Service Management System schema
-- Supabase/PostgreSQL

create extension if not exists "pgcrypto";

create type public.role_type as enum ('ADMIN', 'REGIONAL_MANAGER', 'FIELD_ENGINEER');
create type public.ownership_type as enum ('COMPANY', 'CUSTOMER');
create type public.usage_type as enum ('DEMO', 'SOLD');
create type public.device_status as enum (
  'IN_INVENTORY',
  'DEPLOYED',
  'UNDER_SERVICE',
  'SCRAPPED'
);
create type public.demo_status as enum ('AVAILABLE', 'IN_USE', 'RETURNED');
create type public.location_type as enum ('WAREHOUSE', 'HOSPITAL');
create type public.ticket_issue_type as enum (
  'NO_POWER',
  'VIDEO_LOSS',
  'IMAGE_ISSUE',
  'MECHANICAL',
  'SOFTWARE'
);
create type public.ticket_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
create type public.ticket_status as enum (
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_PARTS',
  'RESOLVED',
  'CLOSED'
);
create type public.ticket_event_type as enum ('STATUS_CHANGE', 'COMMENT', 'ASSIGNMENT');

create table public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  manager_id uuid references public.profiles (user_id) on delete set null,
  is_regional_manager boolean not null default false,
  is_active boolean not null default true,
  role public.role_type not null default 'FIELD_ENGINEER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name),
  unique (code)
);

create table public.regional_managers (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  region_id uuid not null references public.regions (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.field_engineers (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  regional_manager_id uuid not null references public.regional_managers (user_id) on delete cascade,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.engineer_devices (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid not null references public.field_engineers (user_id) on delete cascade,
  device_id uuid not null,
  assigned_by uuid references public.profiles (user_id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (engineer_id, device_id)
);

create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions (id) on delete restrict,
  name text not null,
  address text,
  city text,
  state text,
  zone text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions (id) on delete restrict,
  name text not null,
  address text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.device_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.device_category_media (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.device_categories on delete cascade,
  category_name text not null,
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id),
  unique (category_name)
);

create table public.device_models (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.device_categories on delete restrict,
  manufacturer text,
  model_name text not null,
  model_code text,
  description text,
  specs jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, model_name),
  unique (model_code)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  serial_number text not null unique,
  barcode text unique,
  device_model_id uuid not null references public.device_models on delete restrict,
  ownership_type public.ownership_type not null default 'COMPANY',
  usage_type public.usage_type not null,
  status public.device_status not null default 'IN_INVENTORY',
  current_location_type public.location_type not null default 'WAREHOUSE',
  current_hospital_id uuid references public.hospitals on delete set null,
  current_warehouse_id uuid references public.warehouses on delete set null,
  demo_status public.demo_status,
  demo_last_used_at timestamptz,
  demo_assigned_hospital_id uuid references public.hospitals on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint devices_location_check check (
    (current_location_type = 'HOSPITAL' and current_hospital_id is not null and current_warehouse_id is null)
    or (current_location_type = 'WAREHOUSE' and current_warehouse_id is not null and current_hospital_id is null)
  ),
  constraint devices_demo_check check (
    (usage_type = 'DEMO' and demo_status is not null)
    or (usage_type = 'SOLD' and demo_status is null)
  ),
  constraint devices_demo_assignment_check check (
    demo_assigned_hospital_id is null or usage_type = 'DEMO'
  )
);

alter table public.engineer_devices
  add constraint engineer_devices_device_id_fkey
  foreign key (device_id)
  references public.devices (id)
  on delete cascade;

create table public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint demo_sessions_date_check check (end_date >= start_date)
);

create table public.demo_session_devices (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid not null references public.demo_sessions on delete cascade,
  device_id uuid not null references public.devices on delete restrict,
  created_at timestamptz not null default now(),
  unique (demo_id, device_id)
);

create table public.engineer_hospitals (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid not null references public.profiles (user_id) on delete cascade,
  hospital_id uuid not null references public.hospitals on delete cascade,
  assigned_by uuid references public.profiles (user_id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (engineer_id, hospital_id)
);

create table public.device_movements (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices on delete cascade,
  from_location_type public.location_type,
  from_hospital_id uuid references public.hospitals on delete set null,
  from_warehouse_id uuid references public.warehouses on delete set null,
  to_location_type public.location_type not null,
  to_hospital_id uuid references public.hospitals on delete set null,
  to_warehouse_id uuid references public.warehouses on delete set null,
  moved_by uuid references public.profiles (user_id) on delete set null,
  moved_at timestamptz not null default now(),
  reason text,
  notes text,
  constraint device_movements_from_check check (
    from_location_type is null
    or (from_location_type = 'HOSPITAL' and from_hospital_id is not null and from_warehouse_id is null)
    or (from_location_type = 'WAREHOUSE' and from_warehouse_id is not null and from_hospital_id is null)
  ),
  constraint device_movements_to_check check (
    (to_location_type = 'HOSPITAL' and to_hospital_id is not null and to_warehouse_id is null)
    or (to_location_type = 'WAREHOUSE' and to_warehouse_id is not null and to_hospital_id is null)
  )
);

create or replace function public.move_device(
  p_device_id uuid,
  p_to_location_type public.location_type,
  p_to_hospital_id uuid,
  p_to_warehouse_id uuid,
  p_reason text default null,
  p_notes text default null
)
returns void as $$
declare
  v_device record;
begin
  select * into v_device from public.devices where id = p_device_id;

  if not found then
    raise exception 'Device % not found', p_device_id;
  end if;

  insert into public.device_movements (
    device_id,
    from_location_type,
    from_hospital_id,
    from_warehouse_id,
    to_location_type,
    to_hospital_id,
    to_warehouse_id,
    moved_by,
    reason,
    notes
  )
  values (
    p_device_id,
    v_device.current_location_type,
    v_device.current_hospital_id,
    v_device.current_warehouse_id,
    p_to_location_type,
    p_to_hospital_id,
    p_to_warehouse_id,
    auth.uid(),
    p_reason,
    p_notes
  );

  update public.devices
  set current_location_type = p_to_location_type,
      current_hospital_id = p_to_hospital_id,
      current_warehouse_id = p_to_warehouse_id,
      demo_assigned_hospital_id = case
        when v_device.usage_type = 'DEMO' and p_to_location_type = 'HOSPITAL' then p_to_hospital_id
        else null
      end
  where id = p_device_id;
end;
$$ language plpgsql;

create table public.service_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default (
    'TKT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  ),
  device_id uuid not null references public.devices on delete restrict,
  hospital_id uuid not null references public.hospitals on delete restrict,
  raised_by uuid not null references public.profiles (user_id) on delete restrict,
  assigned_to uuid references public.profiles (user_id) on delete set null,
  issue_type public.ticket_issue_type not null,
  priority public.ticket_priority not null default 'MEDIUM',
  description text,
  status public.ticket_status not null default 'OPEN',
  reported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.service_tickets on delete cascade,
  event_type public.ticket_event_type not null default 'STATUS_CHANGE',
  status_from public.ticket_status,
  status_to public.ticket_status,
  notes text,
  created_by uuid references public.profiles (user_id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_hospitals_city_zone on public.hospitals (city, zone);
create index idx_hospitals_region on public.hospitals (region_id);
create index idx_warehouses_region on public.warehouses (region_id);
create index idx_regional_managers_region on public.regional_managers (region_id);
create index idx_devices_model on public.devices (device_model_id);
create index idx_devices_status on public.devices (status, usage_type);
create index idx_devices_demo on public.devices (demo_status, demo_assigned_hospital_id);
create index idx_devices_hospital on public.devices (current_hospital_id);
create index idx_device_category_media_sort on public.device_category_media (sort_order, category_name);
create index idx_profiles_manager on public.profiles (manager_id);
create index idx_profiles_regional_manager on public.profiles (is_regional_manager)
  where is_regional_manager = true;
create index idx_profiles_active on public.profiles (is_active)
  where is_active = true;
create index idx_demo_session_devices_device on public.demo_session_devices (device_id);
create index idx_engineer_hospitals_engineer on public.engineer_hospitals (engineer_id);
create index idx_engineer_hospitals_hospital on public.engineer_hospitals (hospital_id);
create index idx_ticket_status on public.service_tickets (status, priority);
create index idx_ticket_hospital on public.service_tickets (hospital_id);
create index idx_ticket_raised_by on public.service_tickets (raised_by);

create or replace view public.inventory_summary
with (security_invoker = true) as
select
  count(*) as total_devices,
  count(*) filter (where status = 'IN_INVENTORY') as in_inventory,
  count(*) filter (where status = 'DEPLOYED') as deployed,
  count(*) filter (where status = 'UNDER_SERVICE') as under_service,
  count(*) filter (where status = 'SCRAPPED') as scrapped,
  count(*) filter (where status = 'DEPLOYED' and usage_type = 'DEMO') as demo_deployed,
  count(*) filter (where status = 'DEPLOYED' and usage_type = 'SOLD') as sold_deployed
from public.devices;

create or replace view public.demo_summary
with (security_invoker = true) as
select
  count(*) filter (where demo_status = 'IN_USE') as in_use,
  count(*) filter (where demo_status = 'AVAILABLE' and status = 'DEPLOYED') as idle_deployed,
  count(*) filter (where demo_status = 'RETURNED') as returned,
  max(demo_last_used_at) as last_used_at
from public.devices
where usage_type = 'DEMO';

create or replace view public.inventory_by_model
with (security_invoker = true) as
select
  m.id as model_id,
  m.model_name,
  c.name as category,
  count(d.id) as total,
  count(d.id) filter (where d.status = 'IN_INVENTORY') as in_inventory,
  count(d.id) filter (where d.status = 'DEPLOYED') as deployed,
  count(d.id) filter (where d.status = 'DEPLOYED' and d.usage_type = 'DEMO') as demo_deployed,
  count(d.id) filter (where d.status = 'DEPLOYED' and d.usage_type = 'SOLD') as sold_deployed
from public.device_models m
join public.device_categories c on c.id = m.category_id
left join public.devices d on d.device_model_id = m.id
group by m.id, m.model_name, c.name;

create or replace view public.hospital_overview
with (security_invoker = true) as
select
  h.id,
  h.name,
  h.address,
  h.city,
  h.state,
  h.zone,
  h.latitude,
  h.longitude,
  coalesce(device_counts.devices_deployed, 0) as devices_deployed,
  coalesce(engineer_counts.engineers_assigned, 0) as engineers_assigned
from public.hospitals h
left join (
  select current_hospital_id as hospital_id, count(*) as devices_deployed
  from public.devices
  where status = 'DEPLOYED'
  group by current_hospital_id
) device_counts on device_counts.hospital_id = h.id
left join (
  select hospital_id, count(*) as engineers_assigned
  from public.engineer_hospitals
  group by hospital_id
) engineer_counts on engineer_counts.hospital_id = h.id;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'ADMIN'
  );
$$ language sql stable;

create or replace function public.is_regional_manager()
returns boolean as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'REGIONAL_MANAGER'
  );
$$ language sql stable;

create or replace function public.is_field_engineer()
returns boolean as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'FIELD_ENGINEER'
  );
$$ language sql stable;

create or replace function public.is_manager_of(p_engineer_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.field_engineers fe
    where fe.user_id = p_engineer_id
      and fe.regional_manager_id = auth.uid()
  );
$$ language sql stable;

create or replace function public.is_engineer()
returns boolean as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'FIELD_ENGINEER'
  );
$$ language sql stable;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger set_regions_updated_at
before update on public.regions
for each row execute procedure public.set_updated_at();

create trigger set_regional_managers_updated_at
before update on public.regional_managers
for each row execute procedure public.set_updated_at();

create trigger set_field_engineers_updated_at
before update on public.field_engineers
for each row execute procedure public.set_updated_at();

create trigger set_hospitals_updated_at
before update on public.hospitals
for each row execute procedure public.set_updated_at();

create trigger set_warehouses_updated_at
before update on public.warehouses
for each row execute procedure public.set_updated_at();

create trigger set_device_categories_updated_at
before update on public.device_categories
for each row execute procedure public.set_updated_at();

create trigger set_device_models_updated_at
before update on public.device_models
for each row execute procedure public.set_updated_at();

create trigger set_devices_updated_at
before update on public.devices
for each row execute procedure public.set_updated_at();

create trigger set_service_tickets_updated_at
before update on public.service_tickets
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.regions enable row level security;
alter table public.regional_managers enable row level security;
alter table public.field_engineers enable row level security;
alter table public.engineer_devices enable row level security;
alter table public.hospitals enable row level security;
alter table public.warehouses enable row level security;
alter table public.device_categories enable row level security;
alter table public.device_category_media enable row level security;
alter table public.device_models enable row level security;
alter table public.devices enable row level security;
alter table public.demo_session_devices enable row level security;
alter table public.engineer_hospitals enable row level security;
alter table public.device_movements enable row level security;
alter table public.service_tickets enable row level security;
alter table public.ticket_events enable row level security;

create policy "Profiles select self or admin"
  on public.profiles
  for select
  using (auth.uid() = user_id or public.is_admin() or public.is_manager_of(user_id));

create policy "Profiles insert admin"
  on public.profiles
  for insert
  with check (public.is_admin());

create policy "Profiles update admin"
  on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Profiles update manager"
  on public.profiles
  for update
  using (public.is_regional_manager() and public.is_manager_of(user_id))
  with check (public.is_regional_manager() and public.is_manager_of(user_id));

create policy "Profiles delete admin"
  on public.profiles
  for delete
  using (public.is_admin());

create policy "Regions select authenticated"
  on public.regions
  for select
  using (auth.uid() is not null);

create policy "Regions manage admin"
  on public.regions
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Regional managers select"
  on public.regional_managers
  for select
  using (public.is_admin() or user_id = auth.uid());

create policy "Regional managers manage admin"
  on public.regional_managers
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Field engineers select"
  on public.field_engineers
  for select
  using (public.is_admin() or regional_manager_id = auth.uid() or user_id = auth.uid());

create policy "Field engineers insert"
  on public.field_engineers
  for insert
  with check (public.is_admin() or (public.is_regional_manager() and regional_manager_id = auth.uid()));

create policy "Field engineers update"
  on public.field_engineers
  for update
  using (public.is_admin() or (public.is_regional_manager() and regional_manager_id = auth.uid()))
  with check (public.is_admin() or (public.is_regional_manager() and regional_manager_id = auth.uid()));

create policy "Field engineers delete"
  on public.field_engineers
  for delete
  using (public.is_admin() or (public.is_regional_manager() and regional_manager_id = auth.uid()));

create policy "Engineer devices select"
  on public.engineer_devices
  for select
  using (
    public.is_admin()
    or engineer_id = auth.uid()
    or exists (
      select 1
      from public.field_engineers fe
      where fe.user_id = engineer_devices.engineer_id
        and fe.regional_manager_id = auth.uid()
    )
  );

create policy "Engineer devices manage"
  on public.engineer_devices
  for all
  using (
    public.is_admin()
    or exists (
      select 1
      from public.field_engineers fe
      where fe.user_id = engineer_devices.engineer_id
        and fe.regional_manager_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.field_engineers fe
      where fe.user_id = engineer_devices.engineer_id
        and fe.regional_manager_id = auth.uid()
    )
  );

create policy "Hospitals select admin or assigned engineers"
  on public.hospitals
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.engineer_hospitals eh
      where eh.hospital_id = hospitals.id
        and eh.engineer_id = auth.uid()
    )
  );

create policy "Hospitals manage admin"
  on public.hospitals
  for insert
  with check (public.is_admin());

create policy "Hospitals update admin"
  on public.hospitals
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Hospitals delete admin"
  on public.hospitals
  for delete
  using (public.is_admin());

create policy "Warehouses admin only"
  on public.warehouses
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Device categories select authenticated"
  on public.device_categories
  for select
  using (auth.uid() is not null);

create policy "Device category media select authenticated"
  on public.device_category_media
  for select
  using (auth.uid() is not null);

create policy "Device categories manage admin"
  on public.device_categories
  for insert
  with check (public.is_admin());

create policy "Device category media manage admin"
  on public.device_category_media
  for insert
  with check (public.is_admin());

create policy "Device categories update admin"
  on public.device_categories
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Device category media update admin"
  on public.device_category_media
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Device categories delete admin"
  on public.device_categories
  for delete
  using (public.is_admin());

create policy "Device category media delete admin"
  on public.device_category_media
  for delete
  using (public.is_admin());

create policy "Device models select authenticated"
  on public.device_models
  for select
  using (auth.uid() is not null);

create policy "Device models manage admin"
  on public.device_models
  for insert
  with check (public.is_admin());

create policy "Device models update admin"
  on public.device_models
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Device models delete admin"
  on public.device_models
  for delete
  using (public.is_admin());

create policy "Devices select admin or assigned engineers"
  on public.devices
  for select
  using (
    public.is_admin()
    or (
      current_location_type = 'HOSPITAL'
      and exists (
        select 1
        from public.engineer_hospitals eh
        where eh.engineer_id = auth.uid()
          and eh.hospital_id = devices.current_hospital_id
      )
    )
  );

create policy "Devices manage admin"
  on public.devices
  for insert
  with check (public.is_admin());

create policy "Devices update admin"
  on public.devices
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Devices delete admin"
  on public.devices
  for delete
  using (public.is_admin());

create policy "Demo session devices admin only"
  on public.demo_session_devices
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Engineer hospital assignments select"
  on public.engineer_hospitals
  for select
  using (public.is_admin() or engineer_id = auth.uid());

create policy "Engineer hospital assignments admin insert"
  on public.engineer_hospitals
  for insert
  with check (public.is_admin());

create policy "Engineer hospital assignments admin update"
  on public.engineer_hospitals
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Engineer hospital assignments admin delete"
  on public.engineer_hospitals
  for delete
  using (public.is_admin());

create policy "Device movements admin only"
  on public.device_movements
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Service tickets select admin or owner"
  on public.service_tickets
  for select
  using (public.is_admin() or raised_by = auth.uid());

create policy "Service tickets insert by owner"
  on public.service_tickets
  for insert
  with check (
    public.is_admin()
    or (
      raised_by = auth.uid()
      and exists (
        select 1
        from public.engineer_hospitals eh
        where eh.engineer_id = auth.uid()
          and eh.hospital_id = service_tickets.hospital_id
      )
    )
  );

create policy "Service tickets update admin or owner"
  on public.service_tickets
  for update
  using (public.is_admin() or raised_by = auth.uid())
  with check (public.is_admin() or raised_by = auth.uid());

create policy "Service tickets delete admin"
  on public.service_tickets
  for delete
  using (public.is_admin());

create policy "Ticket events select admin or owner"
  on public.ticket_events
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.service_tickets t
      where t.id = ticket_events.ticket_id
        and t.raised_by = auth.uid()
    )
  );

create policy "Ticket events insert admin or owner"
  on public.ticket_events
  for insert
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.service_tickets t
      where t.id = ticket_events.ticket_id
        and t.raised_by = auth.uid()
    )
  );

create policy "Ticket events update admin"
  on public.ticket_events
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Ticket events delete admin"
  on public.ticket_events
  for delete
  using (public.is_admin());
