-- Drop the existing policy that restricts profile viewing to authenticated users
drop policy if exists "Users can view all profiles" on public.profiles;

-- Create a new policy that allows public read access to profiles
create policy "Public read profiles" on public.profiles for select using (true);
