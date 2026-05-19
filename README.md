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
![Логин](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/Логин.png)

### 🏠 Главная страница
![Главная](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/Главная.png)

### 🛡️ Администрирование
![Администрирование](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/Администрирование.png)

### 🔍 Поиск пользователей в админке
![Поиск пользователей в Админке](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/Поиск%20пользователей%20в%20Админке.png)

### 🛠️ IT задачи
![IT задачи](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/IT%20%D0%B7%D0%B0%D0%B4%D0%B0%D1%87%D0%B8.png)

### 🔧 Комплектующие
![Комплектующие](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/IT%20%D0%B7%D0%B0%D0%B4%D0%B0%D1%87%D0%B8-%D0%9A%D0%BE%D0%BC%D0%BF%D0%BB%D0%B5%D0%BA%D1%82%D1%83%D1%8E%D1%89%D0%B8%D0%B5.png)

### 📅 Календарь событий
![Календарь](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/Календарь.png)

### 📋 События
![События](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/События.png)

### 🔄 Замены на отпуск
![Замены](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/Змены%20сотрудников.png)

### 💬 Чат
![Чат](https://raw.githubusercontent.com/EvgTitov/WebPortal-gap-rt.ru/main/images/Чат.png)




