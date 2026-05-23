create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  code text not null unique,
  participant_identifier_type text not null default 'email',
  participant_identifier_label text not null default 'Email address',
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.vote_items (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text not null,
  up integer not null default 0,
  down integer not null default 0,
  tag text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  body text not null,
  tag text,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_levels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.organization_participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  identifier_type text not null,
  identifier_value text not null,
  display_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (organization_id, identifier_type, identifier_value)
);

create table if not exists public.participant_level_assignments (
  participant_id uuid not null references public.organization_participants(id) on delete cascade,
  level_id uuid not null references public.organization_levels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (participant_id, level_id)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text not null default '',
  tag text not null default 'General',
  status text not null default 'draft',
  eligible_level_ids uuid[] not null default '{}',
  live_result_level_ids uuid[] not null default '{}',
  final_result_level_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.vote_ballots (
  vote_id uuid not null references public.votes(id) on delete cascade,
  participant_id uuid not null references public.organization_participants(id) on delete cascade,
  choice text not null,
  created_at timestamptz not null default now(),
  primary key (vote_id, participant_id)
);

create table if not exists public.message_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  prompt text not null,
  status text not null default 'draft',
  submit_level_ids uuid[] not null default '{}',
  reveal_level_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.message_entries (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.message_channels(id) on delete cascade,
  participant_id uuid not null references public.organization_participants(id) on delete cascade,
  body text not null,
  revealed boolean not null default false,
  created_at timestamptz not null default now()
);

drop policy if exists "Organizations are readable" on public.organizations;
drop policy if exists "Owners can create organizations" on public.organizations;
drop policy if exists "Owners can update organizations" on public.organizations;
drop policy if exists "Owners can delete organizations" on public.organizations;

drop policy if exists "Members are readable" on public.organization_members;
drop policy if exists "Owners can manage members" on public.organization_members;

drop policy if exists "Votes are readable" on public.vote_items;
drop policy if exists "Owners can create votes" on public.vote_items;
drop policy if exists "Anyone can vote" on public.vote_items;

drop policy if exists "Messages are readable" on public.messages;
drop policy if exists "Anyone can submit messages" on public.messages;

drop policy if exists "Owners can read organization levels" on public.organization_levels;
drop policy if exists "Owners can create organization levels" on public.organization_levels;
drop policy if exists "Owners can update organization levels" on public.organization_levels;
drop policy if exists "Owners can delete organization levels" on public.organization_levels;

drop policy if exists "Owners can read organization participants" on public.organization_participants;
drop policy if exists "Owners can create organization participants" on public.organization_participants;
drop policy if exists "Owners can update organization participants" on public.organization_participants;
drop policy if exists "Owners can delete organization participants" on public.organization_participants;

drop policy if exists "Owners can read participant level assignments" on public.participant_level_assignments;
drop policy if exists "Owners can create participant level assignments" on public.participant_level_assignments;
drop policy if exists "Owners can update participant level assignments" on public.participant_level_assignments;
drop policy if exists "Owners can delete participant level assignments" on public.participant_level_assignments;

insert into public.organizations (id, name, code)
values
  ('11111111-1111-1111-1111-111111111111', 'Team Pulse', 'pulse')
on conflict (code) do nothing;

alter table public.organizations
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.organizations
  add column if not exists participant_identifier_type text not null default 'email';

alter table public.organizations
  add column if not exists participant_identifier_label text not null default 'Email address';

alter table public.vote_items
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.messages
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

update public.vote_items
  set organization_id = '11111111-1111-1111-1111-111111111111'
  where organization_id is null;

update public.messages
  set organization_id = '11111111-1111-1111-1111-111111111111'
  where organization_id is null;

alter table public.vote_items
  alter column organization_id set not null;

alter table public.messages
  alter column organization_id set not null;

insert into public.vote_items (id, organization_id, title, description, up, down, tag)
values
  (
    'remote-fridays',
    '11111111-1111-1111-1111-111111111111',
    'Keep remote Fridays year-round',
    'A lighter schedule with creative sprints and async check-ins.',
    82,
    23,
    'Policy'
  ),
  (
    'anon-feedback',
    '11111111-1111-1111-1111-111111111111',
    'Anonymous feedback at the end of every sprint',
    'Short, safe notes so we hear the quiet voices too.',
    64,
    18,
    'Culture'
  ),
  (
    'learning-pods',
    '11111111-1111-1111-1111-111111111111',
    'Budget for team learning pods',
    'Micro-communities that explore one topic per month.',
    54,
    41,
    'Growth'
  )
on conflict (id) do nothing;

insert into public.messages (organization_id, body, tag)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Anonymous notes are easier to share when they feel safe and respected.',
    'Culture'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Shorter standups would help us protect deep work time.',
    'Process'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'I appreciate how calm our launches have been lately.',
    'Gratitude'
  );

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.vote_items enable row level security;
alter table public.messages enable row level security;
alter table public.organization_levels enable row level security;
alter table public.organization_participants enable row level security;
alter table public.participant_level_assignments enable row level security;

create policy "Organizations are readable" on public.organizations
  for select
  using (true);

create policy "Owners can create organizations" on public.organizations
  for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update organizations" on public.organizations
  for update
  using (auth.uid() = owner_id);

create policy "Owners can delete organizations" on public.organizations
  for delete
  using (auth.uid() = owner_id);

create policy "Members are readable" on public.organization_members
  for select
  using (auth.uid() = user_id);

create policy "Owners can manage members" on public.organization_members
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.organizations
      where organizations.id = organization_members.organization_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Votes are readable" on public.vote_items
  for select
  using (true);

create policy "Owners can create votes" on public.vote_items
  for insert
  with check (auth.uid() = (select owner_id from public.organizations where id = organization_id));

create policy "Anyone can vote" on public.vote_items
  for update
  using (true);

create policy "Messages are readable" on public.messages
  for select
  using (true);

create policy "Anyone can submit messages" on public.messages
  for insert
  with check (true);

create policy "Owners can read organization levels" on public.organization_levels
  for select
  using (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_levels.organization_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can create organization levels" on public.organization_levels
  for insert
  with check (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_levels.organization_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can update organization levels" on public.organization_levels
  for update
  using (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_levels.organization_id
        and organizations.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_levels.organization_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can delete organization levels" on public.organization_levels
  for delete
  using (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_levels.organization_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can read organization participants" on public.organization_participants
  for select
  using (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_participants.organization_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can create organization participants" on public.organization_participants
  for insert
  with check (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_participants.organization_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can update organization participants" on public.organization_participants
  for update
  using (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_participants.organization_id
        and organizations.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_participants.organization_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can delete organization participants" on public.organization_participants
  for delete
  using (
    exists (
      select 1
      from public.organizations
      where organizations.id = organization_participants.organization_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can read participant level assignments" on public.participant_level_assignments
  for select
  using (
    exists (
      select 1
      from public.organization_participants
      join public.organizations
        on organizations.id = organization_participants.organization_id
      where organization_participants.id = participant_level_assignments.participant_id
        and organizations.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.organization_levels
      join public.organizations
        on organizations.id = organization_levels.organization_id
      where organization_levels.id = participant_level_assignments.level_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can create participant level assignments" on public.participant_level_assignments
  for insert
  with check (
    exists (
      select 1
      from public.organization_participants
      join public.organizations
        on organizations.id = organization_participants.organization_id
      where organization_participants.id = participant_level_assignments.participant_id
        and organizations.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.organization_levels
      join public.organizations
        on organizations.id = organization_levels.organization_id
      where organization_levels.id = participant_level_assignments.level_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can update participant level assignments" on public.participant_level_assignments
  for update
  using (
    exists (
      select 1
      from public.organization_participants
      join public.organizations
        on organizations.id = organization_participants.organization_id
      where organization_participants.id = participant_level_assignments.participant_id
        and organizations.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.organization_levels
      join public.organizations
        on organizations.id = organization_levels.organization_id
      where organization_levels.id = participant_level_assignments.level_id
        and organizations.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.organization_participants
      join public.organizations
        on organizations.id = organization_participants.organization_id
      where organization_participants.id = participant_level_assignments.participant_id
        and organizations.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.organization_levels
      join public.organizations
        on organizations.id = organization_levels.organization_id
      where organization_levels.id = participant_level_assignments.level_id
        and organizations.owner_id = auth.uid()
    )
  );

create policy "Owners can delete participant level assignments" on public.participant_level_assignments
  for delete
  using (
    exists (
      select 1
      from public.organization_participants
      join public.organizations
        on organizations.id = organization_participants.organization_id
      where organization_participants.id = participant_level_assignments.participant_id
        and organizations.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.organization_levels
      join public.organizations
        on organizations.id = organization_levels.organization_id
      where organization_levels.id = participant_level_assignments.level_id
        and organizations.owner_id = auth.uid()
    )
  );
