-- Create the bots table
create table public.bots (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users not null,
    name text not null,
    webhook_id text not null,
    config jsonb not null default '{}'::jsonb,
    active boolean default true
);

-- Set up row level security
alter table public.bots enable row level security;

-- Create policy to allow users to manage their own bots
create policy "Users can manage their own bots"
    on public.bots
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Create index for faster queries
create index bots_user_id_idx on public.bots(user_id); 