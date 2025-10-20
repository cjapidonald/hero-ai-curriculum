-- Teacher evaluations capture admin feedback scores and context for each instructor.

create table if not exists public.teacher_evaluations (
  id uuid primary key default extensions.uuid_generate_v4(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  admin_id uuid references public.admins (id) on delete set null,
  score integer not null check (score >= 0 and score <= 100),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_evaluations owner to postgres;

comment on table public.teacher_evaluations is 'Performance evaluations recorded by admins for teachers';

create index if not exists idx_teacher_evaluations_teacher on public.teacher_evaluations (teacher_id);
create index if not exists idx_teacher_evaluations_created_at on public.teacher_evaluations (created_at desc);

create trigger update_teacher_evaluations_updated_at
  before update on public.teacher_evaluations
  for each row
  execute function public.update_updated_at_column();

alter table public.teacher_evaluations enable row level security;

create policy "Allow all for teacher evaluations"
  on public.teacher_evaluations
  using (true)
  with check (true);

grant all on table public.teacher_evaluations to anon;
grant all on table public.teacher_evaluations to authenticated;
grant all on table public.teacher_evaluations to service_role;
