
-- =============================================
-- NUVI Task Control - Initial Schema
-- =============================================

-- Roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'employee', 'viewer', 'pending');

-- Task status enum
CREATE TYPE public.task_status AS ENUM ('new', 'in_progress', 'waiting', 'completed', 'overdue', 'cancelled');

-- Task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'task_assigned', 'deadline_24h', 'deadline_3h', 'deadline_30min',
  'task_overdue', 'status_changed', 'priority_changed', 'task_reassigned',
  'task_completed', 'role_assigned', 'manual'
);

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES (separate table - critical security)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TASKS
-- =============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'new',
  completed_at TIMESTAMPTZ,
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_3h_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_30min_sent BOOLEAN NOT NULL DEFAULT false,
  overdue_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline_at);

-- =============================================
-- TASK ACTIVITY LOG
-- =============================================
CREATE TABLE public.task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_activity_task ON public.task_activity(task_id);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- =============================================
-- USER BADGES
-- =============================================
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  UNIQUE (user_id, badge_key)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- =============================================
-- APP SETTINGS
-- =============================================
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles r ON r.user_id = p.id
    WHERE p.id = _user_id
      AND p.is_suspended = false
      AND r.role IN ('super_admin','admin','manager','employee','viewer')
  );
$$;

-- =============================================
-- HANDLE NEW USER (auto-create profile + role)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  -- Pre-seeded super admin
  IF NEW.email = 'isroiljohnabdullayev@gmail.com' THEN
    _role := 'super_admin';
  ELSE
    _role := 'pending';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- UPDATE TIMESTAMP TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: any active user can view all profiles; users update own; admins update all
CREATE POLICY "profiles_select_active" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_active_user(auth.uid()) OR id = auth.uid());

CREATE POLICY "profiles_update_self" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_update_admin" ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

-- User roles: users see own; admins see all; only admins manage
CREATE POLICY "roles_select_self" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "roles_select_admin" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

CREATE POLICY "roles_insert_admin" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

CREATE POLICY "roles_update_admin" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

CREATE POLICY "roles_delete_admin" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

-- Tasks: assignees and creators see own; managers/admins see all
CREATE POLICY "tasks_select_own" ON public.tasks
FOR SELECT TO authenticated
USING (assignee_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "tasks_select_managers" ON public.tasks
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','manager','viewer']::public.app_role[]));

CREATE POLICY "tasks_insert_managers" ON public.tasks
FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['super_admin','admin','manager']::public.app_role[])
  AND created_by = auth.uid()
);

CREATE POLICY "tasks_update_managers" ON public.tasks
FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','manager']::public.app_role[]));

CREATE POLICY "tasks_update_assignee_status" ON public.tasks
FOR UPDATE TO authenticated
USING (assignee_id = auth.uid());

CREATE POLICY "tasks_delete_admin" ON public.tasks
FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

-- Task activity: visible to anyone who can see the task
CREATE POLICY "activity_select" ON public.task_activity
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND (t.assignee_id = auth.uid() OR t.created_by = auth.uid()
           OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','manager','viewer']::public.app_role[]))
  )
);

CREATE POLICY "activity_insert" ON public.task_activity
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Notifications: users see only their own
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_managers" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['super_admin','admin','manager']::public.app_role[])
  OR user_id = auth.uid()
);

-- Badges: all active users can view
CREATE POLICY "badges_select" ON public.user_badges
FOR SELECT TO authenticated
USING (public.is_active_user(auth.uid()));

CREATE POLICY "badges_insert_admin" ON public.user_badges
FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

-- App settings: read by active users; write by admins
CREATE POLICY "settings_select" ON public.app_settings
FOR SELECT TO authenticated
USING (public.is_active_user(auth.uid()));

CREATE POLICY "settings_upsert_admin" ON public.app_settings
FOR ALL TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

-- =============================================
-- AUTO-NOTIFY ON TASK ASSIGN
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND NEW.assignee_id <> NEW.created_by THEN
    INSERT INTO public.notifications (user_id, type, title, message, task_id)
    VALUES (
      NEW.assignee_id,
      'task_assigned',
      'New task assigned',
      NEW.title,
      NEW.id
    );
  END IF;

  INSERT INTO public.task_activity (task_id, user_id, action, details)
  VALUES (NEW.id, NEW.created_by, 'task_created',
    jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'deadline', NEW.deadline_at));

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_task_assigned();

-- Notify on changes
CREATE OR REPLACE FUNCTION public.notify_task_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Status change
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.task_activity (task_id, user_id, action, details)
    VALUES (NEW.id, auth.uid(), 'status_changed',
      jsonb_build_object('from', OLD.status, 'to', NEW.status));

    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
      NEW.completed_at = now();
      IF NEW.created_by IS NOT NULL AND NEW.created_by <> auth.uid() THEN
        INSERT INTO public.notifications (user_id, type, title, message, task_id)
        VALUES (NEW.created_by, 'task_completed', 'Task completed', NEW.title, NEW.id);
      END IF;
    END IF;
  END IF;

  -- Priority change
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    INSERT INTO public.task_activity (task_id, user_id, action, details)
    VALUES (NEW.id, auth.uid(), 'priority_changed',
      jsonb_build_object('from', OLD.priority, 'to', NEW.priority));
    IF NEW.assignee_id IS NOT NULL AND NEW.assignee_id <> auth.uid() THEN
      INSERT INTO public.notifications (user_id, type, title, message, task_id)
      VALUES (NEW.assignee_id, 'priority_changed', 'Priority changed', NEW.title, NEW.id);
    END IF;
  END IF;

  -- Reassignment
  IF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
    INSERT INTO public.task_activity (task_id, user_id, action, details)
    VALUES (NEW.id, auth.uid(), 'reassigned',
      jsonb_build_object('from', OLD.assignee_id, 'to', NEW.assignee_id));
    IF NEW.assignee_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, task_id)
      VALUES (NEW.assignee_id, 'task_reassigned', 'Task assigned to you', NEW.title, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_updated
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_task_updated();
