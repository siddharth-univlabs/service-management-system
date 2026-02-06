-- Seed data for categories, models, hospitals, and initial devices

insert into public.device_categories (id, name, description)
values
  (gen_random_uuid(), 'Camera', 'Surgical imaging cameras'),
  (gen_random_uuid(), 'Insufflator', 'CO2 insufflation systems'),
  (gen_random_uuid(), 'Monitor', 'Surgical display monitors'),
  (gen_random_uuid(), 'Pump', 'Fluid management pumps'),
  (gen_random_uuid(), 'Light Source', 'LED light sources')
on conflict do nothing;

with category_ids as (
  select id, name from public.device_categories
)
insert into public.device_models (id, category_id, manufacturer, model_name, model_code, description)
values
  (gen_random_uuid(), (select id from category_ids where name = 'Camera'), 'MedOptix', '4-MOS Camera with Coupler', 'CAM-4MOS', '4-sensor 4K camera head'),
  (gen_random_uuid(), (select id from category_ids where name = 'Camera'), 'MedOptix', '2-MOS HD Camera', 'CAM-2MOS', 'Compact HD camera head'),
  (gen_random_uuid(), (select id from category_ids where name = 'Insufflator'), 'CareDynamics', 'VentoFlow Insufflator', 'INS-VENTO', 'Low-noise insufflator'),
  (gen_random_uuid(), (select id from category_ids where name = 'Monitor'), 'LG', 'LG 32HL710 Monitor', 'MON-LG32', '32" surgical display'),
  (gen_random_uuid(), (select id from category_ids where name = 'Pump'), 'VitalPath', 'Iris Infusion Pump', 'PMP-IRIS', 'Precision infusion pump')
on conflict do nothing;

insert into public.hospitals (id, region_id, name, address, city, zone, latitude, longitude)
values
  (gen_random_uuid(), (select id from public.regions where code = 'SOUTH' limit 1), 'Vertis Surgical Center', '1187 West Bay Road', 'Bengaluru', 'South', 12.9716, 77.5946),
  (gen_random_uuid(), (select id from public.regions where code = 'SOUTH' limit 1), 'Sunrise Specialty Hospital', '42 Old Mahabalipuram Road', 'Chennai', 'East', 13.0827, 80.2707),
  (gen_random_uuid(), (select id from public.regions where code = 'SOUTH' limit 1), 'Lakeview Medical Institute', '920 Crescent Avenue', 'Hyderabad', 'Central', 17.3850, 78.4867),
  (gen_random_uuid(), (select id from public.regions where code = 'SOUTH' limit 1), 'Briar Oncology Hospital', '16 Orchard Street', 'Pune', 'West', 18.5204, 73.8567)
on conflict do nothing;

insert into public.warehouses (id, region_id, name, address, city)
values
  (gen_random_uuid(), (select id from public.regions where code = 'SOUTH' limit 1), 'Central Warehouse', '12 Logistics Park', 'Bengaluru')
on conflict do nothing;

-- Example device inserts (adjust IDs based on the actual model and hospital IDs)
-- insert into public.devices (serial_number, device_model_id, ownership_type, usage_type, status, current_location_type, current_hospital_id, demo_status, demo_last_used_at, demo_assigned_hospital_id)
-- values
--   ('MD-4MOS-001', '<model_id>', 'COMPANY', 'DEMO', 'DEPLOYED', 'HOSPITAL', '<hospital_id>', 'IN_USE', now() - interval '2 days', '<hospital_id>');
