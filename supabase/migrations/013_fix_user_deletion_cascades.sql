-- Fix foreign key constraints referencing public.profiles(id)
-- Using a DO block with EXCEPTION handling guarantees that any missing tables or missing columns
-- in your specific live database are cleanly skipped without throwing errors.

DO $$
BEGIN

  -- 1. clients
  BEGIN
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_created_by_fkey;
    ALTER TABLE public.clients ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping clients(created_by): %', SQLERRM;
  END;

  -- 2. client_portal_invites
  BEGIN
    ALTER TABLE public.client_portal_invites DROP CONSTRAINT IF EXISTS client_portal_invites_invited_by_fkey;
    ALTER TABLE public.client_portal_invites ADD CONSTRAINT client_portal_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping client_portal_invites(invited_by): %', SQLERRM;
  END;

  -- 3. team_invites
  BEGIN
    ALTER TABLE public.team_invites DROP CONSTRAINT IF EXISTS team_invites_invited_by_fkey;
    ALTER TABLE public.team_invites ADD CONSTRAINT team_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping team_invites(invited_by): %', SQLERRM;
  END;

  -- 4. leads
  BEGIN
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;
    ALTER TABLE public.leads ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping leads(assigned_to): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_created_by_fkey;
    ALTER TABLE public.leads ADD CONSTRAINT leads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping leads(created_by): %', SQLERRM;
  END;

  -- 5. invoices & expenses
  BEGIN
    ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping invoices(created_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_logged_by_fkey;
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping expenses(logged_by): %', SQLERRM;
  END;

  -- 6. vendors
  BEGIN
    ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_created_by_fkey;
    ALTER TABLE public.vendors ADD CONSTRAINT vendors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping vendors(created_by): %', SQLERRM;
  END;

  -- 7. projects
  BEGIN
    ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
    ALTER TABLE public.projects ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping projects(created_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_assigned_to_fkey;
    ALTER TABLE public.projects ADD CONSTRAINT projects_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping projects(assigned_to): %', SQLERRM;
  END;

  -- 8. project_members
  BEGIN
    ALTER TABLE public.project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
    ALTER TABLE public.project_members ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping project_members(user_id): %', SQLERRM;
  END;

  -- 9. tasks
  BEGIN
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping tasks(assigned_to): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping tasks(created_by): %', SQLERRM;
  END;

  -- 10. time_entries
  BEGIN
    ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_logged_by_fkey;
    ALTER TABLE public.time_entries ALTER COLUMN logged_by DROP NOT NULL;
    ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping time_entries(logged_by): %', SQLERRM;
  END;

  -- 11. kb_categories & kb_articles
  BEGIN
    ALTER TABLE public.kb_categories DROP CONSTRAINT IF EXISTS kb_categories_created_by_fkey;
    ALTER TABLE public.kb_categories ADD CONSTRAINT kb_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping kb_categories(created_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.kb_categories DROP CONSTRAINT IF EXISTS kb_categories_updated_by_fkey;
    ALTER TABLE public.kb_categories ADD CONSTRAINT kb_categories_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping kb_categories(updated_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.kb_articles DROP CONSTRAINT IF EXISTS kb_articles_created_by_fkey;
    ALTER TABLE public.kb_articles ADD CONSTRAINT kb_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping kb_articles(created_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.kb_articles DROP CONSTRAINT IF EXISTS kb_articles_updated_by_fkey;
    ALTER TABLE public.kb_articles ADD CONSTRAINT kb_articles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping kb_articles(updated_by): %', SQLERRM;
  END;

  -- 12. docs v1 & v2
  BEGIN
    ALTER TABLE public.docs DROP CONSTRAINT IF EXISTS docs_created_by_fkey;
    ALTER TABLE public.docs ADD CONSTRAINT docs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping docs(created_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.docs DROP CONSTRAINT IF EXISTS docs_updated_by_fkey;
    ALTER TABLE public.docs ADD CONSTRAINT docs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping docs(updated_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.doc_products DROP CONSTRAINT IF EXISTS doc_products_created_by_fkey;
    ALTER TABLE public.doc_products ADD CONSTRAINT doc_products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping doc_products(created_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.doc_sections DROP CONSTRAINT IF EXISTS doc_sections_created_by_fkey;
    ALTER TABLE public.doc_sections ADD CONSTRAINT doc_sections_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping doc_sections(created_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.doc_sections DROP CONSTRAINT IF EXISTS doc_sections_updated_by_fkey;
    ALTER TABLE public.doc_sections ADD CONSTRAINT doc_sections_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping doc_sections(updated_by): %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.doc_comments DROP CONSTRAINT IF EXISTS doc_comments_author_id_fkey;
    ALTER TABLE public.doc_comments ADD CONSTRAINT doc_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping doc_comments(author_id): %', SQLERRM;
  END;

  -- 13. files
  BEGIN
    ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_uploaded_by_fkey;
    ALTER TABLE public.files ADD CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping files(uploaded_by): %', SQLERRM;
  END;

END $$;
