## 📋 О проекте

Корпоративный портал для внутреннего использования предприятия. Предоставляет единую точку входа для новостей, сервисов, сетевых ресурсов и коммуникации сотрудников.

### Основные возможности

- 🔐 **Аутентификация через Active Directory** - единый вход с доменными учетными записями
- 📰 **Новости предприятия** - публикация новостей с поддержкой галерей изображений
- 📅 **Календарь событий** - планирование встреч, ВКС, задач с возможностью приглашения участников
- 🔗 **Сервисы** - централизованный доступ к корпоративным веб-сервисам
- 📁 **Сетевые ресурсы** - каталог сетевых папок с копированием путей
- 👥 **Управление пользователями** - назначение ролей (админ, IT-инженер, начальник отдела, модератор)
- 💬 **Чат** - встроенный Rocket.Chat для коммуникации
- 📝 **Заметки** - личные заметки пользователей
- 🔄 **Замены на отпуск** - информация о временных замещениях
- 📢 **Оповещения** - система уведомлений для всех пользователей
- 🛠️ **IT задачи** - учёт и контроль выполнения задач IT-отдела

## 🏗️ Технологии

### Бэкенд
- **Python 3.10+** / **FastAPI** - веб-фреймворк
- **SQLite** - базы данных (settings.db, news.db, chat.db)
- **JWT** - аутентификация и токены
- **LDAP/AD** - интеграция с Active Directory
- **SMTP** - почтовые уведомления

### Фронтенд
- **React 18** - пользовательский интерфейс
- **Vite** - сборка и разработка
- **Lucide React** - иконки
- **Rocket.Chat** - встроенный чат

### Инфраструктура
- **Uvicorn** - ASGI сервер
- **Git** - контроль версий
- **Systemd** - управление сервисами

## 📁 Структура проекта

```
corporate-portal/
├── backend/
│ ├── main.py # Точка входа, API эндпоинты
│ ├── ad_auth.py # Аутентификация через Active Directory
│ ├── server/
│ │ └── ad_users.py # Работа с пользователями AD
│ ├── uploads/ # Загруженные изображения (не в Git)
│ ├── settings.db # БД настроек (не в Git)
│ ├── news.db # БД новостей (не в Git)
│ └── chat.db # БД чата (не в Git)
├── frontend/
│ ├── src/
│ │ ├── pages/
│ │ │ ├── AdminPanel.jsx # Админ-панель
│ │ │ ├── MainPage.jsx # Главная страница
│ │ │ ├── ITTasks.jsx # IT задачи
│ │ │ └── ITEquipment.jsx # Комплектующие
│ │ ├── auth/
│ │ │ └── AuthContext.jsx # Контекст аутентификации
│ │ └── components/
│ │ └── UserSearchInput.jsx
│ └── dist/ # Сборка фронтенда
└── images/ # Скриншоты для README
```

## 🚫 Файлы, исключённые из репозитория

| Файл/папка | Причина |
|------------|---------|
| `backend/.env` | Секретные ключи и пароли |
| `backend/*.db` | Базы данных (чат, новости, настройки) |
| `backend/uploads/` | Пользовательские файлы |
| `backend/__pycache__/` | Python кэш |
| `frontend/node_modules/` | Зависимости фронтенда |
| `frontend/dist/` | Сборка фронтенда |
| `backups/` | Архивы резервного копирования |

## 📸 Скриншоты портала

### 🔐 Страница логина
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/%D0%9B%D0%BE%D0%B3%D0%B8%D0%BD.png

### 🏠 Главная страница
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/%D0%93%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.png

### 🛡️ Администрирование
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/%D0%90%D0%B4%D0%BC%D0%B8%D0%BD%D0%B8%D1%81%D1%82%D1%80%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5.png

### 🛠️ IT задачи
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/IT%2520%D0%B7%D0%B0%D0%B4%D0%B0%D1%87%D0%B8.png

### 🔧 Комплектующие
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/IT%2520%25D0%25B7%25D0%25B0%25D0%25B4%25D0%25B0%25D1%2587%25D0%25B8-%25D0%259A%25D0%25BE%25D0%25BC%25D0%25BF%25D0%25BB%25D0%25B5%25D0%25BA%25D1%2582%25D1%2583%25D1%258E%25D1%2589%25D0%25B8%25D0%25B5.png

### 🔍 Поиск пользователей в админке
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/%D0%9F%D0%BE%D0%B8%D1%81%D0%BA%2520%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D0%B5%D0%BB%D0%B5%D0%B9%2520%D0%B2%2520%D0%90%D0%B4%D0%BC%D0%B8%D0%BD%D0%BA%D0%B5.png

### 📅 Календарь событий
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/%D0%9A%D0%B0%D0%BB%D0%B5%D0%BD%D0%B4%D0%B0%D1%80%D1%8C.png

### 📋 События
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/%D0%A1%D0%BE%D0%B1%D1%8B%D1%82%D0%B8%D1%8F.png

### 🔄 Замены на отпуск
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/%D0%97%D0%B5%D0%BC%D0%BD%D1%8B%2520%D1%81%D0%BE%D1%82%D1%80%D1%83%D0%B4%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2.png

### 💬 Чат
https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/%D0%A7%D0%B0%D1%82.png




