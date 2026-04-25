# NUVI Task Control — MVP Plan

A premium SaaS-style internal platform for NUVI AI Academy to manage tasks, deadlines, productivity, and team performance.

## 🎨 Design

- **Style**: Apple-inspired minimal — soft rounded cards, subtle shadows, comfortable spacing, clear hierarchy.
- **Colors**: White, light/dark gray, black, soft blue accents, subtle gradients on key surfaces.
- **Theme**: Light + Dark mode with manual toggle. Default = Light.
- **Languages**: Auto-detect browser language, fallback to Uzbek. Manual switcher between **Uzbek** 🇺🇿 and **Russian** 🇷🇺. All UI text, statuses, and notifications fully translated.
- **Responsive**: Desktop, tablet, mobile.

## 🔐 Authentication & Access

- **Google OAuth** sign-in (one click).
- **Open signup with admin approval**: any Google user can sign in, lands in a "Pending approval" screen until an admin assigns them a role.
- **Pre-seeded Super Admin**: `isroiljohnabdullayev@gmail.com` automatically gets Super Admin role on first login.
- **5 roles**: Super Admin, Admin, Manager, Employee, Viewer — each with distinct permissions enforced both client- and server-side.
- Admins can suspend users, change roles, and view last login time.

## 📊 Dashboard

Quick-glance overview with cards + charts:
- Active / completed today / overdue / upcoming tasks
- Team productivity score
- Best employees of the week
- Tasks by status & priority (charts)
- Per-employee workload
- Recent notifications
- Quick action buttons → Quick Deadline / Full Task

## ✅ Task Management

**Two creation modes** (prominent buttons everywhere):
- **⚡ Quick Deadline** — title, assignee, date, time, priority. Done in seconds.
- **📋 Full Task** — title, full description, assignee, deadline, priority, reminder settings.

**Each task has**: title, description, assignee, deadline (date+time), priority, status, created by, timestamps, activity history.

**Statuses**: New • In Progress • Waiting • Completed • Overdue (auto) • Cancelled
**Priorities**: Low • Medium • High • Critical (color-coded)

**Views**:
- **My Tasks** — personal queue for employees
- **All Tasks** — admin/manager view with full filters
- **Task Detail** — full info + activity log
- **Filters**: assignee, status, priority, deadline range, overdue
- **Search**: by title, description, employee name

## 📅 Calendar

- Daily / Weekly / Monthly views
- Color-coded by priority
- Click any date to see deadlines
- Click a task to open details

## 📈 Productivity & Rankings

**Auto-tracked per employee**:
- Assigned / completed / overdue counts
- On-time completion rate
- Average completion time
- Productivity score (configurable formula)

**Default scoring** (admin-adjustable later):
- Completed: +10 • High priority: +20 • Critical: +30
- On-time bonus: +10 • Overdue: −10 • Critical overdue: −25

**Rankings page**: Daily / Weekly / Monthly / All-time leaderboards with rank, score, completion %, and badges (Best of Week, Deadline Master, Fast Performer, Consistent Performer).

## 👤 Employee Profiles

Personal page showing: name, email, role, avatar, assigned/completed/overdue tasks, score, ranking, badges, recent activity.

## 🔔 In-App Notifications

Real-time bell icon with unread count + dedicated notifications page. Triggers:
- New task assigned
- Deadline approaching (24h, 3h, 30min before)
- Task overdue
- Status / priority changed
- Task reassigned
- Task completed

Daily morning summary + end-of-day report shown in notification feed.

## 🛡️ Admin Panel

- Pending user approvals queue
- Manage all users (role, suspend, remove)
- Override any task
- View productivity reports for all employees
- Adjust reminder timing settings

## 📱 Pages Included

Login • Pending Approval • Dashboard • My Tasks • All Tasks • Task Detail • Calendar • Employees • Employee Profile • Rankings • Notifications • Admin Panel • Settings (language + theme)

## 🗄️ Database

Tables: `profiles`, `user_roles`, `tasks`, `task_activity`, `notifications`, `productivity_snapshots`, `badges`, `user_badges`, `app_settings`. All secured with Row-Level Security so each role only sees what it should.

A scheduled background job runs every 5 min to flag overdue tasks, create deadline reminders, and recompute productivity scores.

## 🚫 Reserved for Future Rounds (not in MVP)

Per your "Core MVP" choice, these come in follow-up builds:
- Projects & Departments
- Comments, checklists, file attachments on tasks
- Email notifications + Telegram bot
- PDF / Excel / CSV report exports
- Advanced analytics reports

---

Once approved, I'll build this as a clean, production-ready foundation you can expand module by module.