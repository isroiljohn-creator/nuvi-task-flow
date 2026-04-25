// NUVI Task Control — i18n (Uzbek + Russian)
export type Lang = "uz" | "ru";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export const dict = {
  // Brand
  brandName: { uz: "NUVI Task Control", ru: "NUVI Task Control" },
  academy: { uz: "NUVI AI Academy", ru: "NUVI AI Academy" },

  // Auth
  signInWithGoogle: { uz: "Google orqali kirish", ru: "Войти через Google" },
  signOut: { uz: "Chiqish", ru: "Выйти" },
  loginTitle: { uz: "Xush kelibsiz", ru: "Добро пожаловать" },
  loginSubtitle: {
    uz: "NUVI jamoasi uchun ichki vazifalarni boshqarish platformasi",
    ru: "Внутренняя платформа управления задачами для команды NUVI",
  },
  pendingTitle: { uz: "Tasdiqlash kutilmoqda", ru: "Ожидает подтверждения" },
  pendingMessage: {
    uz: "Sizning hisobingiz administrator tomonidan tasdiqlanishi kerak. Iltimos, tez orada qayta urinib ko'ring.",
    ru: "Ваша учётная запись должна быть одобрена администратором. Пожалуйста, попробуйте позже.",
  },
  suspendedTitle: { uz: "Hisob to'xtatildi", ru: "Учётная запись приостановлена" },
  suspendedMessage: {
    uz: "Sizning hisobingiz to'xtatildi. Administrator bilan bog'laning.",
    ru: "Ваша учётная запись приостановлена. Свяжитесь с администратором.",
  },

  // Navigation
  dashboard: { uz: "Boshqaruv paneli", ru: "Панель" },
  myTasks: { uz: "Mening vazifalarim", ru: "Мои задачи" },
  allTasks: { uz: "Barcha vazifalar", ru: "Все задачи" },
  calendar: { uz: "Taqvim", ru: "Календарь" },
  employees: { uz: "Xodimlar", ru: "Сотрудники" },
  rankings: { uz: "Reyting", ru: "Рейтинг" },
  notifications: { uz: "Bildirishnomalar", ru: "Уведомления" },
  admin: { uz: "Admin panel", ru: "Админ панель" },
  settings: { uz: "Sozlamalar", ru: "Настройки" },
  profile: { uz: "Profil", ru: "Профиль" },

  // Actions
  quickDeadline: { uz: "Tezkor muddat", ru: "Быстрый дедлайн" },
  fullTask: { uz: "To'liq vazifa", ru: "Полная задача" },
  addTask: { uz: "Vazifa qo'shish", ru: "Добавить задачу" },
  create: { uz: "Yaratish", ru: "Создать" },
  save: { uz: "Saqlash", ru: "Сохранить" },
  cancel: { uz: "Bekor qilish", ru: "Отмена" },
  delete: { uz: "O'chirish", ru: "Удалить" },
  edit: { uz: "Tahrirlash", ru: "Редактировать" },
  approve: { uz: "Tasdiqlash", ru: "Одобрить" },
  suspend: { uz: "To'xtatish", ru: "Приостановить" },
  activate: { uz: "Aktivlashtirish", ru: "Активировать" },
  search: { uz: "Qidirish...", ru: "Поиск..." },
  filter: { uz: "Filtr", ru: "Фильтр" },
  all: { uz: "Hammasi", ru: "Все" },
  loading: { uz: "Yuklanmoqda...", ru: "Загрузка..." },
  noData: { uz: "Ma'lumot yo'q", ru: "Нет данных" },
  view: { uz: "Ko'rish", ru: "Просмотр" },
  back: { uz: "Orqaga", ru: "Назад" },

  // Task fields
  title: { uz: "Sarlavha", ru: "Название" },
  description: { uz: "Tavsif", ru: "Описание" },
  assignee: { uz: "Mas'ul shaxs", ru: "Исполнитель" },
  deadline: { uz: "Muddat", ru: "Дедлайн" },
  deadlineDate: { uz: "Muddat sanasi", ru: "Дата дедлайна" },
  deadlineTime: { uz: "Muddat vaqti", ru: "Время дедлайна" },
  priority: { uz: "Muhimlik", ru: "Приоритет" },
  status: { uz: "Holat", ru: "Статус" },
  createdBy: { uz: "Yaratuvchi", ru: "Создатель" },
  createdAt: { uz: "Yaratilgan", ru: "Создано" },
  updatedAt: { uz: "Yangilangan", ru: "Обновлено" },

  // Statuses
  status_new: { uz: "Yangi", ru: "Новая" },
  status_in_progress: { uz: "Jarayonda", ru: "В работе" },
  status_waiting: { uz: "Kutilmoqda", ru: "Ожидание" },
  status_completed: { uz: "Bajarildi", ru: "Выполнено" },
  status_overdue: { uz: "Muddati o'tgan", ru: "Просрочено" },
  status_cancelled: { uz: "Bekor qilingan", ru: "Отменено" },

  // Priorities
  priority_low: { uz: "Past", ru: "Низкий" },
  priority_medium: { uz: "O'rta", ru: "Средний" },
  priority_high: { uz: "Yuqori", ru: "Высокий" },
  priority_critical: { uz: "Kritik", ru: "Критический" },

  // Roles
  role_super_admin: { uz: "Bosh administrator", ru: "Супер-админ" },
  role_admin: { uz: "Administrator", ru: "Админ" },
  role_manager: { uz: "Menejer", ru: "Менеджер" },
  role_employee: { uz: "Xodim", ru: "Сотрудник" },
  role_viewer: { uz: "Kuzatuvchi", ru: "Наблюдатель" },
  role_pending: { uz: "Kutilmoqda", ru: "Ожидание" },

  // Dashboard
  activeTasks: { uz: "Faol vazifalar", ru: "Активные задачи" },
  completedToday: { uz: "Bugun bajarildi", ru: "Выполнено сегодня" },
  overdueTasks: { uz: "Muddati o'tgan", ru: "Просрочено" },
  upcomingDeadlines: { uz: "Yaqinlashayotgan muddatlar", ru: "Предстоящие дедлайны" },
  teamProductivity: { uz: "Jamoa samaradorligi", ru: "Продуктивность команды" },
  bestEmployees: { uz: "Hafta yetakchilari", ru: "Лучшие на неделе" },
  tasksByStatus: { uz: "Holat bo'yicha vazifalar", ru: "Задачи по статусу" },
  tasksByPriority: { uz: "Muhimlik bo'yicha", ru: "По приоритету" },
  recentActivity: { uz: "So'nggi faollik", ru: "Последняя активность" },
  workload: { uz: "Yuklama", ru: "Нагрузка" },

  // Productivity
  productivityScore: { uz: "Samaradorlik bali", ru: "Балл продуктивности" },
  completionRate: { uz: "Bajarish foizi", ru: "Процент выполнения" },
  onTimeRate: { uz: "O'z vaqtida", ru: "Вовремя" },
  totalAssigned: { uz: "Jami berilgan", ru: "Всего назначено" },
  totalCompleted: { uz: "Jami bajarilgan", ru: "Всего выполнено" },
  rank: { uz: "O'rin", ru: "Место" },

  // Notifications
  markAllRead: { uz: "Hammasini o'qilgan deb belgilash", ru: "Отметить все прочитанными" },
  noNotifications: { uz: "Bildirishnomalar yo'q", ru: "Нет уведомлений" },
  notif_task_assigned: { uz: "Sizga yangi vazifa berildi", ru: "Вам назначена новая задача" },
  notif_task_completed: { uz: "Vazifa bajarildi", ru: "Задача выполнена" },
  notif_task_overdue: { uz: "Vazifa muddati o'tdi", ru: "Срок задачи истёк" },
  notif_status_changed: { uz: "Holat o'zgartirildi", ru: "Статус изменён" },
  notif_priority_changed: { uz: "Muhimlik o'zgartirildi", ru: "Приоритет изменён" },
  notif_task_reassigned: { uz: "Vazifa qayta tayinlandi", ru: "Задача переназначена" },

  // Admin
  pendingApprovals: { uz: "Kutilayotgan tasdiqlar", ru: "Ожидают одобрения" },
  manageUsers: { uz: "Foydalanuvchilarni boshqarish", ru: "Управление пользователями" },
  assignRole: { uz: "Rol berish", ru: "Назначить роль" },
  lastLogin: { uz: "So'nggi kirish", ru: "Последний вход" },

  // Settings
  language: { uz: "Til", ru: "Язык" },
  theme: { uz: "Mavzu", ru: "Тема" },
  light: { uz: "Yorug'", ru: "Светлая" },
  dark: { uz: "Qorong'i", ru: "Тёмная" },
  system: { uz: "Tizim", ru: "Системная" },

  // Misc
  noAccess: { uz: "Ruxsat yo'q", ru: "Нет доступа" },
  noAccessMsg: {
    uz: "Sizda ushbu sahifani ko'rish uchun ruxsat yo'q.",
    ru: "У вас нет доступа к этой странице.",
  },
  taskCreated: { uz: "Vazifa yaratildi", ru: "Задача создана" },
  taskUpdated: { uz: "Vazifa yangilandi", ru: "Задача обновлена" },
  taskDeleted: { uz: "Vazifa o'chirildi", ru: "Задача удалена" },
  confirmDelete: {
    uz: "Haqiqatan ham o'chirmoqchimisiz?",
    ru: "Вы уверены, что хотите удалить?",
  },
  required: { uz: "Majburiy maydon", ru: "Обязательное поле" },
  email: { uz: "Email", ru: "Email" },
  name: { uz: "Ism", ru: "Имя" },
  role: { uz: "Rol", ru: "Роль" },
  unread: { uz: "O'qilmagan", ru: "Непрочитанные" },
  today: { uz: "Bugun", ru: "Сегодня" },
  thisWeek: { uz: "Bu hafta", ru: "На этой неделе" },
  thisMonth: { uz: "Bu oy", ru: "В этом месяце" },
  daily: { uz: "Kunlik", ru: "День" },
  weekly: { uz: "Haftalik", ru: "Неделя" },
  monthly: { uz: "Oylik", ru: "Месяц" },
  allTime: { uz: "Butun davr", ru: "За всё время" },
  activityLog: { uz: "Faollik tarixi", ru: "История активности" },
  myStats: { uz: "Mening statistikam", ru: "Моя статистика" },
  badges: { uz: "Belgilar", ru: "Награды" },
  taskDetails: { uz: "Vazifa tafsilotlari", ru: "Детали задачи" },
  markComplete: { uz: "Bajarildi deb belgilash", ru: "Отметить выполненным" },
  reopenTask: { uz: "Qayta ochish", ru: "Переоткрыть" },
  noTasks: { uz: "Vazifalar yo'q", ru: "Нет задач" },
  selectAssignee: { uz: "Mas'ul shaxsni tanlang", ru: "Выберите исполнителя" },
  unassigned: { uz: "Tayinlanmagan", ru: "Не назначен" },
  active: { uz: "Faol", ru: "Активен" },
  suspended: { uz: "To'xtatilgan", ru: "Приостановлен" },
  never: { uz: "Hech qachon", ru: "Никогда" },
  totalUsers: { uz: "Jami foydalanuvchilar", ru: "Всего пользователей" },
  totalTasks: { uz: "Jami vazifalar", ru: "Всего задач" },
} satisfies Record<string, Record<Lang, string>>;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  return dict[key]?.[lang] ?? String(key);
}
