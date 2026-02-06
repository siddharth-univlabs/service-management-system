-- Example queries for inventory and demo status

-- Total devices per model and deployment breakdown
select *
from public.inventory_by_model
order by model_name;

-- Inventory vs deployed totals
select *
from public.inventory_summary;

-- Deployed devices per hospital with demo vs sold split
select
  h.name as hospital,
  count(d.id) as total_deployed,
  count(d.id) filter (where d.usage_type = 'DEMO') as demo_deployed,
  count(d.id) filter (where d.usage_type = 'SOLD') as sold_deployed
from public.hospitals h
left join public.devices d
  on d.current_hospital_id = h.id
  and d.status = 'DEPLOYED'
group by h.name
order by total_deployed desc;

-- Demo devices currently in use
select d.serial_number,
       m.model_name,
       h.name as assigned_hospital,
       d.demo_last_used_at
from public.devices d
join public.device_models m on m.id = d.device_model_id
left join public.hospitals h on h.id = d.demo_assigned_hospital_id
where d.usage_type = 'DEMO'
  and d.demo_status = 'IN_USE';

-- Idle demo devices (available but deployed)
select d.serial_number,
       m.model_name,
       h.name as assigned_hospital
from public.devices d
join public.device_models m on m.id = d.device_model_id
left join public.hospitals h on h.id = d.demo_assigned_hospital_id
where d.usage_type = 'DEMO'
  and d.demo_status = 'AVAILABLE'
  and d.status = 'DEPLOYED';

-- Movement history for a device
select *
from public.device_movements
where device_id = (select id from public.devices limit 1)
order by moved_at desc;

-- Tickets per engineer
select p.full_name,
       count(t.id) as ticket_count
from public.service_tickets t
join public.profiles p on p.user_id = t.raised_by
group by p.full_name
order by ticket_count desc;

-- Seed device category media (cards on admin devices page)
insert into public.device_category_media (category_name, image_path, sort_order)
values
  ('Imaging', '/categories/imaging.jpg', 1),
  ('Surgical', '/categories/surgical.jpg', 2),
  ('Monitoring', '/categories/monitoring.jpg', 3);
