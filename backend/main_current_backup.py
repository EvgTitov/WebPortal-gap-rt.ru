import logging
from fastapi import FastAPI, HTTPException, Request, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ad_auth import authenticate_user
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
import jwt
import datetime
import sqlite3
from datetime import datetime as dt
from datetime import timedelta
import os
import shutil
import json
import urllib.parse
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import csv
from io import StringIO, BytesIO
from dotenv import load_dotenv
import calendar

# ============ ЗАГРУЗКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ============
load_dotenv()

# ============ НАСТРОЙКИ ПОЧТЫ (из .env) ============
SMTP_SERVER = os.getenv("SMTP_SERVER", "192.168.168.206")
SMTP_PORT = int(os.getenv("SMTP_PORT", 25))
SMTP_USER = os.getenv("SMTP_USER", "web-mail@gap-rt.ru")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "V9tSKNSdBS5dCfOskdwI")

logger = logging.getLogger("main")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = FastAPI(title="Corporate Portal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ============ НАСТРОЙКА ДЛЯ НОВОСТЕЙ ============
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

NEWS_DB_PATH = os.path.join(BASE_DIR, "news.db")
CHAT_DB_PATH = os.path.join(BASE_DIR, "chat.db")
SETTINGS_DB_PATH = os.path.join(BASE_DIR, "settings.db")

def get_event_type_name(event_type):
    """Преобразует тип события в читаемое название для email"""
    types = {
        'meeting': 'Совещание',
        'vks': 'ВКС',
        'deadline': 'Задача',
        'replacement': 'Замена'
    }
    return types.get(event_type, event_type)

def send_calendar_event_email(to_email, to_name, event, is_new=True):
    """Отправка email уведомления о событии календаря"""
    if not to_email:
        logger.warning(f"Email не указан для {to_name}")
        return False
    
    try:
        event_date = event.get('event_date')
        if event_date and '-' in event_date:
            event_date_display = f"{event_date[8:10]}.{event_date[5:7]}.{event_date[0:4]}"
        else:
            event_date_display = event_date
        
        event_time = event.get('event_time', '10:00') if not event.get('is_all_day') else 'весь день'
        
        if is_new:
            subject = f"📅 Новое событие в календаре: {event.get('title')}"
        else:
            subject = f"✏️ Изменение события в календаре: {event.get('title')}"
        
        event_type_name = get_event_type_name(event.get('event_type', 'meeting'))
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #3b82f6, #4f46e5); padding: 20px; color: white; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px;">📅 {event.get('title')}</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Уважаемый(ая) <strong>{to_name}</strong>!</p>
                    <p>Вас добавили в событие календаря.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>📅 Дата:</strong></td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{event_date_display} {f'в {event_time}' if event_time != 'весь день' else '(весь день)'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>🏷️ Тип:</strong></td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{event_type_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>📍 Место:</strong></td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{event.get('location') or 'Не указано'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>📝 Описание:</strong></td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{event.get('description') or 'Нет'}</td>
                        </tr>
                    </table>
                    <hr>
                    <p style="text-align: center;">
                        <a href="https://srv-app16.gap-rt.ru" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Перейти в календарь</a>
                    </p>
                    <p style="color: #666; font-size: 12px; text-align: center;">Это автоматическое уведомление. Пожалуйста, не отвечайте на него.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"✅ Email о событии отправлен {to_name} на {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка отправки email о событии: {e}")
        return False

def send_task_email(to_email, to_name, task_title, task_description, due_date, task_id):
    """Отправка уведомления исполнителю о новой задаче"""
    if not to_email:
        logger.warning(f"Email не указан для исполнителя {to_name}")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = f"📋 Новая IT-задача: {task_title}"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
        <h2>Уважаемый(ая) {to_name}!</h2>
        <p>Вам назначена новая задача в корпоративном портале.</p>
        <hr>
        <h3>📌 Задача: {task_title}</h3>
        <p><strong>📝 Описание:</strong> {task_description or 'Не указано'}</p>
        <p><strong>⏰ Срок выполнения:</strong> {due_date or 'Не указан'}</p>
        <hr>
        <p>Ссылка на портал: <a href="https://srv-app16.gap-rt.ru">Портал gap-rt.ru</a></p>
        <p>ID задачи: #{task_id}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Это автоматическое уведомление. Пожалуйста, не отвечайте на него.</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email отправлен исполнителю {to_name} на {to_email}")
        return True
    except Exception as e:
        logger.error(f"Ошибка отправки email исполнителю: {e}")
        return False

def init_news_db():
    conn = sqlite3.connect(NEWS_DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'announcement',
        author TEXT,
        pub_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS news_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        news_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
    )''')
    conn.commit()
    conn.close()

def init_chat_db():
    conn = sqlite3.connect(CHAT_DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, name TEXT, department TEXT, email TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_by TEXT NOT NULL, is_general INTEGER DEFAULT 0, created_at TEXT NOT NULL)")
    c.execute("CREATE TABLE IF NOT EXISTS chat_members (chat_id INTEGER, username TEXT, PRIMARY KEY (chat_id, username))")
    c.execute("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER, sender_id TEXT, sender_name TEXT, text TEXT, is_file INTEGER DEFAULT 0, file_name TEXT, file_data TEXT, file_type TEXT, edited INTEGER DEFAULT 0, reply_to INTEGER, timestamp TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS read_receipts (chat_id INTEGER, username TEXT, last_read_time TEXT, PRIMARY KEY (chat_id, username))")
    general = c.execute("SELECT id FROM chats WHERE is_general = 1").fetchone()
    if not general:
        c.execute("INSERT INTO chats (name, created_by, is_general, created_at) VALUES (?, ?, ?, ?)", ("Общий чат", "system", 1, dt.now().isoformat()))
    conn.commit()
    conn.close()

def init_settings_db():
    conn = sqlite3.connect(SETTINGS_DB_PATH)
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS ad_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_name TEXT UNIQUE NOT NULL,
        display_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS resource_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT '📁',
        is_global INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS category_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES resource_categories(id) ON DELETE CASCADE
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS network_resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_name TEXT NOT NULL,
        resource_path TEXT NOT NULL,
        resource_type TEXT DEFAULT 'folder',
        category_id INTEGER,
        is_global INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES resource_categories(id) ON DELETE SET NULL
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS network_resource_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_id INTEGER NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        FOREIGN KEY (resource_id) REFERENCES network_resources(id) ON DELETE CASCADE
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT NOT NULL,
        service_url TEXT NOT NULL,
        service_icon TEXT DEFAULT '🔗',
        is_global INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS service_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT UNIQUE NOT NULL,
        display_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        permission_key TEXT UNIQUE NOT NULL,
        display_name TEXT,
        module TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER,
        permission_id INTEGER,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (permission_id) REFERENCES permissions(id),
        PRIMARY KEY (role_id, permission_id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS user_roles (
        username TEXT NOT NULL,
        role_id INTEGER,
        assigned_by TEXT,
        assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        PRIMARY KEY (username, role_id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS vacation_replacements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_name TEXT NOT NULL,
        position TEXT,
        department TEXT,
        substitute_name TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        reason TEXT,
        status TEXT DEFAULT 'active',
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        event_date TEXT NOT NULL,
        event_time TEXT DEFAULT '10:00',
        end_date TEXT,
        end_time TEXT,
        event_type TEXT DEFAULT 'meeting',
        location TEXT,
        description TEXT,
        is_all_day INTEGER DEFAULT 0,
        repeat TEXT DEFAULT 'none',
        remind_before INTEGER DEFAULT 0,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS calendar_event_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        participant_type TEXT NOT NULL,
        participant_id TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS calendar_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS calendar_group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        FOREIGN KEY (group_id) REFERENCES calendar_groups(id) ON DELETE CASCADE
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS organization_tree (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tree_data TEXT NOT NULL,
        updated_by TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS task_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS equipment_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'pc_component',
        unit TEXT DEFAULT 'шт',
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS it_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        equipment_id INTEGER,
        assigned_to TEXT,
        components_status TEXT DEFAULT 'missing',
        executor TEXT,
        created_by TEXT,
        created_date TEXT,
        due_date TEXT,
        completed_date TEXT,
        is_archived INTEGER DEFAULT 0,
        assigned_email TEXT,
        monitoring_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES task_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (equipment_id) REFERENCES equipment_types(id) ON DELETE SET NULL
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS it_task_monitoring (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_template TEXT NOT NULL,
        description_template TEXT,
        category_id INTEGER,
        equipment_id INTEGER,
        assigned_to TEXT,
        executor TEXT,
        interval_days INTEGER DEFAULT 30,
        is_active INTEGER DEFAULT 1,
        last_run TEXT,
        next_run TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES task_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (equipment_id) REFERENCES equipment_types(id) ON DELETE SET NULL
    )''')

    c.execute("INSERT OR IGNORE INTO roles (role_name, display_name) VALUES ('it_engineer', 'IT-инженер')")
    
    it_role = c.execute("SELECT id FROM roles WHERE role_name = 'it_engineer'").fetchone()
    if it_role:
        it_permissions = [
            ('tasks.view', 'Просмотр задач', 'it_tasks'),
            ('tasks.create', 'Создание задач', 'it_tasks'),
            ('tasks.edit', 'Редактирование задач', 'it_tasks'),
            ('tasks.delete', 'Удаление задач', 'it_tasks'),
            ('tasks.archive', 'Архивирование задач', 'it_tasks'),
            ('tasks.restore', 'Восстановление из архива', 'it_tasks'),
            ('equipment.view', 'Просмотр комплектующих', 'it_tasks'),
            ('equipment.manage', 'Управление комплектующими', 'it_tasks'),
            ('reports.view', 'Просмотр отчетов', 'reports'),
        ]
        for perm_key, display_name, module in it_permissions:
            c.execute("INSERT OR IGNORE INTO permissions (permission_key, display_name, module) VALUES (?, ?, ?)", 
                     (perm_key, display_name, module))
            perm = c.execute("SELECT id FROM permissions WHERE permission_key = ?", (perm_key,)).fetchone()
            if perm:
                c.execute("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", 
                         (it_role[0], perm[0]))

    c.execute("SELECT COUNT(*) FROM task_categories")
    if c.fetchone()[0] == 0:
        default_categories = [
            ('🖥️ Сборка ПК', '#10b981'),
            ('🔧 Ремонт', '#f59e0b'),
            ('💿 Настройка ПО', '#3b82f6'),
            ('🌐 Сеть', '#8b5cf6'),
            ('🖨️ Принтеры/МФУ', '#ef4444'),
            ('🔒 Доступы/Права', '#ec4898'),
        ]
        for name, color in default_categories:
            c.execute("INSERT INTO task_categories (name, color) VALUES (?, ?)", (name, color))
    
    c.execute("SELECT COUNT(*) FROM equipment_types")
    if c.fetchone()[0] == 0:
        default_equipment = [
            ('Материнская плата', 'pc_component', 'шт'),
            ('Процессор', 'pc_component', 'шт'),
            ('Оперативная память (ОЗУ)', 'pc_component', 'ГБ'),
            ('SSD-накопитель', 'pc_component', 'шт'),
            ('HDD-накопитель', 'pc_component', 'шт'),
            ('Блок питания', 'pc_component', 'шт'),
            ('Видеокарта', 'pc_component', 'шт'),
            ('Корпус', 'pc_component', 'шт'),
            ('Картридж', 'printer', 'шт'),
            ('Барабан', 'printer', 'шт'),
            ('Роутер', 'network', 'шт'),
            ('Коммутатор', 'network', 'шт'),
        ]
        for name, category, unit in default_equipment:
            c.execute("INSERT INTO equipment_types (name, category, unit) VALUES (?, ?, ?)", (name, category, unit))

    c.execute("INSERT OR IGNORE INTO roles (role_name, display_name) VALUES ('admin', 'Администратор')")
    c.execute("INSERT OR IGNORE INTO roles (role_name, display_name) VALUES ('department_head', 'Начальник отдела')")
    c.execute("INSERT OR IGNORE INTO roles (role_name, display_name) VALUES ('moderator', 'Модератор')")
    c.execute("INSERT OR IGNORE INTO roles (role_name, display_name) VALUES ('user', 'Пользователь')")

    permissions = [
        ('news.create', 'Создание новостей', 'news'),
        ('news.edit', 'Редактирование новостей', 'news'),
        ('news.delete', 'Удаление новостей', 'news'),
        ('replacements.create', 'Создание замен на отпуск', 'hr'),
        ('replacements.edit', 'Редактирование замен на отпуск', 'hr'),
        ('replacements.delete', 'Удаление замен на отпуск', 'hr'),
        ('calendar.create', 'Создание событий календаря', 'calendar'),
        ('calendar.edit', 'Редактирование событий календаря', 'calendar'),
        ('calendar.delete', 'Удаление событий календаря', 'calendar'),
        ('services.manage', 'Управление сервисами', 'services'),
        ('network.manage', 'Управление сетевыми ресурсами', 'network'),
        ('categories.manage', 'Управление категориями', 'network'),
        ('groups.manage', 'Управление AD группами', 'groups'),
        ('users.manage', 'Управление пользователями', 'admin'),
        ('notifications.manage', 'Управление оповещениями', 'admin'),
        ('organization.manage', 'Управление структурой организации', 'organization'),
    ]
    for perm in permissions:
        c.execute("INSERT OR IGNORE INTO permissions (permission_key, display_name, module) VALUES (?, ?, ?)", perm)

    admin_role = c.execute("SELECT id FROM roles WHERE role_name = 'admin'").fetchone()
    if admin_role:
        all_perms = c.execute("SELECT id FROM permissions").fetchall()
        for perm in all_perms:
            c.execute("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", (admin_role[0], perm[0]))

    dept_role = c.execute("SELECT id FROM roles WHERE role_name = 'department_head'").fetchone()
    if dept_role:
        dept_perms = ['replacements.create', 'replacements.edit', 'replacements.delete', 'calendar.create', 'calendar.edit', 'calendar.delete']
        for perm_key in dept_perms:
            perm = c.execute("SELECT id FROM permissions WHERE permission_key = ?", (perm_key,)).fetchone()
            if perm:
                c.execute("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", (dept_role[0], perm[0]))

    mod_role = c.execute("SELECT id FROM roles WHERE role_name = 'moderator'").fetchone()
    if mod_role:
        mod_perms = ['news.create', 'news.edit', 'news.delete']
        for perm_key in mod_perms:
            perm = c.execute("SELECT id FROM permissions WHERE permission_key = ?", (perm_key,)).fetchone()
            if perm:
                c.execute("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", (mod_role[0], perm[0]))

    c.execute("INSERT OR IGNORE INTO ad_groups (group_name, display_name) VALUES ('!citovmt', 'IT отдел')")
    
    default_tree = [
        {
            "id": 1,
            "name": "IT отдел",
            "type": "department",
            "employee": "",
            "children": [
                {"id": 2, "name": "Начальник отдела", "type": "position", "employee": "Сенюшин Александр Вл.", "children": []},
                {"id": 3, "name": "Системный администратор", "type": "position", "employee": "Титов Евгений Алексеевич", "children": []}
            ]
        }
    ]
    
    existing = c.execute("SELECT id FROM organization_tree LIMIT 1").fetchone()
    if not existing:
        c.execute("INSERT INTO organization_tree (tree_data, updated_by, updated_at) VALUES (?, ?, ?)",
                  (json.dumps(default_tree), "system", dt.now().isoformat()))
        logger.info("Organization tree initialized with default data")

    conn.commit()
    conn.close()
    logger.info("Settings database initialized")

def migrate_db():
    conn = sqlite3.connect(SETTINGS_DB_PATH)
    c = conn.cursor()

    try:
        c.execute('''CREATE TABLE IF NOT EXISTS service_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        )''')
    except: pass

    try:
        c.execute('''CREATE TABLE IF NOT EXISTS network_resource_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resource_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            FOREIGN KEY (resource_id) REFERENCES network_resources(id) ON DELETE CASCADE
        )''')
    except: pass

    try:
        c.execute('''CREATE TABLE IF NOT EXISTS category_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES resource_categories(id) ON DELETE CASCADE
        )''')
    except: pass

    try:
        c.execute("ALTER TABLE network_resources ADD COLUMN created_by TEXT")
    except: pass

    try:
        c.execute("ALTER TABLE it_tasks ADD COLUMN equipment_id INTEGER")
        c.execute("ALTER TABLE it_tasks ADD COLUMN assigned_email TEXT")
        c.execute("ALTER TABLE it_tasks ADD COLUMN monitoring_id INTEGER")
    except: pass

    try:
        c.execute("ALTER TABLE calendar_events ADD COLUMN end_date TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE calendar_events ADD COLUMN end_time TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE calendar_events ADD COLUMN repeat TEXT DEFAULT 'none'")
    except: pass
    try:
        c.execute("ALTER TABLE calendar_events ADD COLUMN remind_before INTEGER DEFAULT 0")
    except: pass

    try:
        c.execute('''CREATE TABLE IF NOT EXISTS calendar_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_by TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS calendar_group_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            FOREIGN KEY (group_id) REFERENCES calendar_groups(id) ON DELETE CASCADE
        )''')
    except: pass

    try:
        c.execute('''CREATE TABLE IF NOT EXISTS it_task_monitoring (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title_template TEXT NOT NULL,
            description_template TEXT,
            category_id INTEGER,
            equipment_id INTEGER,
            assigned_to TEXT,
            executor TEXT,
            interval_days INTEGER DEFAULT 30,
            is_active INTEGER DEFAULT 1,
            last_run TEXT,
            next_run TEXT,
            created_by TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES task_categories(id) ON DELETE SET NULL,
            FOREIGN KEY (equipment_id) REFERENCES equipment_types(id) ON DELETE SET NULL
        )''')
    except: pass

    # Добавляем колонку email в users если её нет
    try:
        c.execute("ALTER TABLE users ADD COLUMN email TEXT")
    except:
        pass

    conn.commit()
    conn.close()
    logger.info("Database migration completed")

def add_email_column():
    conn = sqlite3.connect(CHAT_DB_PATH)
    c = conn.cursor()
    try:
        c.execute("ALTER TABLE users ADD COLUMN email TEXT")
        logger.info("Колонка email добавлена в таблицу users")
    except:
        pass
    conn.commit()
    conn.close()

init_news_db()
init_chat_db()
init_settings_db()
migrate_db()
add_email_column()

# ============ МОДЕЛИ ============
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    token_type: str
    user: dict

# ============ АУТЕНТИФИКАЦИЯ ============
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_db():
    conn = sqlite3.connect(CHAT_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_settings_db():
    conn = sqlite3.connect(SETTINGS_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def is_admin_by_group(user_groups: list) -> bool:
    return "!citovmt" in user_groups

async def get_user_role(username: str) -> str:
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("""
        SELECT r.role_name FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.username = ?
    """, (username,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else "user"

async def has_permission(username: str, permission_key: str, user_groups: list = None) -> bool:
    if user_groups and is_admin_by_group(user_groups):
        return True
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("""
        SELECT r.role_name FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.username = ?
    """, (username,))
    role_row = c.fetchone()
    role = role_row[0] if role_row else "user"
    if role == 'admin' or role == 'it_engineer':
        conn.close()
        return True
    c.execute("""
        SELECT 1 FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE r.role_name = ? AND p.permission_key = ?
    """, (role, permission_key))
    result = c.fetchone()
    conn.close()
    return result is not None

def send_event_notification_to_all_participants(event_id, conn, is_new=True):
    """Отправка уведомления всем участникам события (email из chat.db)"""
    logger.info(f"========== ОТПРАВКА EMAIL ДЛЯ СОБЫТИЯ {event_id} ==========")
    c = conn.cursor()
    
    c.execute("SELECT * FROM calendar_events WHERE id = ?", (event_id,))
    event = dict(c.fetchone())
    logger.info(f"Событие: {event.get('title')}")
    logger.info(f"Дата: {event.get('event_date')}")
    logger.info(f"Время: {event.get('event_time')}")
    
    c.execute("SELECT participant_type, participant_id FROM calendar_event_participants WHERE event_id = ?", (event_id,))
    participants = c.fetchall()
    logger.info(f"Найдено участников: {len(participants)}")
    
    # Подключаемся к chat.db для получения email
    chat_conn = get_db()
    chat_c = chat_conn.cursor()
    
    for p_type, p_id in participants:
        logger.info(f"Обработка участника: тип={p_type}, id={p_id}")
        if p_type == 'user':
            # Ищем email в базе chat.db
            chat_c.execute("SELECT name, email FROM users WHERE username = ?", (p_id,))
            user = chat_c.fetchone()
            
            if user and user[1]:  # если есть email
                logger.info(f"Отправка email на {user[1]} для {user[0] or p_id}")
                send_calendar_event_email(
                    user[1],
                    user[0] or p_id,
                    event,
                    is_new
                )
            else:
                logger.warning(f"Не найден email для пользователя {p_id} в базе chat.db")
        elif p_type == 'calendar_group':
            c.execute("SELECT username FROM calendar_group_members WHERE group_id = ?", (p_id,))
            members = c.fetchall()
            for member in members:
                chat_c.execute("SELECT name, email FROM users WHERE username = ?", (member[0],))
                user = chat_c.fetchone()
                if user and user[1]:
                    logger.info(f"Отправка email на {user[1]} для {user[0] or member[0]} (из группы)")
                    send_calendar_event_email(
                        user[1],
                        user[0] or member[0],
                        event,
                        is_new
                    )
    
    chat_conn.close()
    logger.info(f"========== ОТПРАВКА EMAIL ДЛЯ СОБЫТИЯ {event_id} ЗАВЕРШЕНА ==========")

# ============ API ЭНДПОИНТЫ ============

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    auth_result = authenticate_user(request.username, request.password)
    if auth_result.get('status') != 'success':
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль")
    
    user_data = auth_result["user_info"]
    username = user_data["username"]
    user_groups = auth_result.get("groups", [])
    display_name = user_data.get("display_name", username)
    user_email = user_data.get("email", "")
    
    # Сохраняем пользователя в БД чата (с email)
    with get_db() as conn:
        # Сначала добавляем колонку email если её нет
        try:
            conn.execute("ALTER TABLE users ADD COLUMN email TEXT")
        except:
            pass
        # Сохраняем или обновляем пользователя
        conn.execute("INSERT OR IGNORE INTO users (username, name, department, email) VALUES (?, ?, ?, ?)",
                    (username, display_name, "", user_email))
        conn.execute("UPDATE users SET email = ?, name = ? WHERE username = ?", (user_email, display_name, username))
        general = conn.execute("SELECT id FROM chats WHERE is_general = 1").fetchone()
        if general:
            conn.execute("INSERT OR IGNORE INTO chat_members (chat_id, username) VALUES (?, ?)",
                        (general["id"], username))
        conn.commit()
    
    # Проверяем есть ли у пользователя роль, если нет - назначаем user
    with get_settings_db() as conn:
        user_role = conn.execute("SELECT 1 FROM user_roles WHERE username = ?", (username,)).fetchone()
        if not user_role:
            user_role_id = conn.execute("SELECT id FROM roles WHERE role_name = 'user'").fetchone()
            if user_role_id:
                conn.execute("INSERT INTO user_roles (username, role_id, assigned_by) VALUES (?, ?, ?)",
                            (username, user_role_id[0], "system"))
            # Если пользователь в группе !citovmt, даём ему роль it_engineer
            if "!citovmt" in user_groups:
                it_role = conn.execute("SELECT id FROM roles WHERE role_name = 'it_engineer'").fetchone()
                if it_role:
                    conn.execute("INSERT OR IGNORE INTO user_roles (username, role_id, assigned_by) VALUES (?, ?, ?)",
                                (username, it_role[0], "system"))
        conn.commit()
    
    token_data = {
        "sub": username,
        "name": display_name,
        "groups": user_groups
    }
    token = create_access_token(token_data)
    
    return LoginResponse(
        token=token,
        token_type="bearer",
        user={
            "username": username,
            "name": display_name,
            "groups": user_groups
        }
    )

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "username": current_user.get("sub"),
        "name": current_user.get("name"),
        "groups": current_user.get("groups", [])
    }

@app.post("/api/auth/logout")
async def logout():
    return {"message": "Logged out"}

# ============ API ПОЛЬЗОВАТЕЛЕЙ ============

@app.get("/api/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    """Получить список всех пользователей из чата (авторизованных)"""
    with get_db() as conn:
        users = conn.execute("SELECT username, name, department, email FROM users ORDER BY name").fetchall()
        return [dict(user) for user in users]

@app.get("/api/users/authorized")
async def get_authorized_users(query: str = "", limit: int = 500, current_user: dict = Depends(get_current_user)):
    """Получить список авторизованных пользователей (из чата)"""
    with get_db() as conn:
        if query:
            users = conn.execute(
                "SELECT username, name, email FROM users WHERE name LIKE ? OR username LIKE ? LIMIT ?",
                (f"%{query}%", f"%{query}%", limit)
            ).fetchall()
        else:
            users = conn.execute("SELECT username, name, email FROM users ORDER BY name LIMIT ?", (limit,)).fetchall()
        return [dict(user) for user in users]

@app.get("/api/users/search")
async def search_users(query: str, limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Поиск пользователей по имени или username"""
    from server.ad_users import get_all_ad_users
    all_users = get_all_ad_users()
    query_lower = query.lower()
    result = []
    for user in all_users:
        if query_lower in user.get('name', '').lower() or query_lower in user.get('username', '').lower():
            result.append({
                'username': user.get('username'),
                'name': user.get('name'),
                'email': user.get('email')
            })
        if len(result) >= limit:
            break
    return result

# ============ API НОВОСТЕЙ ============

@app.get("/api/news")
async def get_news(limit: int = 50, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(NEWS_DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM news ORDER BY pub_date DESC, id DESC LIMIT ?", (limit,))
    news_list = [dict(row) for row in c.fetchall()]
    for news in news_list:
        c.execute("SELECT image_url FROM news_images WHERE news_id = ? ORDER BY sort_order", (news['id'],))
        news['images'] = [row['image_url'] for row in c.fetchall()]
    conn.close()
    return news_list

@app.get("/api/news/{news_id}")
async def get_news_item(news_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(NEWS_DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM news WHERE id = ?", (news_id,))
    news = c.fetchone()
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    news_dict = dict(news)
    c.execute("SELECT image_url FROM news_images WHERE news_id = ? ORDER BY sort_order", (news_id,))
    news_dict['images'] = [row['image_url'] for row in c.fetchall()]
    conn.close()
    return news_dict

@app.post("/api/news")
async def create_news(
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form("announcement"),
    images: list[UploadFile] = File([]),
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "news.create", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = sqlite3.connect(NEWS_DB_PATH)
    c = conn.cursor()
    pub_date = dt.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("INSERT INTO news (title, content, category, author, pub_date) VALUES (?, ?, ?, ?, ?)",
              (title, content, category, username, pub_date))
    news_id = c.lastrowid
    
    for i, image in enumerate(images):
        ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        filename = f"news_{news_id}_{i}_{dt.now().timestamp()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(image.file, f)
        image_url = f"/uploads/{filename}"
        c.execute("INSERT INTO news_images (news_id, image_url, sort_order) VALUES (?, ?, ?)",
                  (news_id, image_url, i))
    
    conn.commit()
    conn.close()
    return {"id": news_id, "message": "Новость создана"}

@app.put("/api/news/{news_id}")
async def update_news(
    news_id: int,
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form("announcement"),
    images: list[UploadFile] = File([]),
    existing_images: str = Form("[]"),
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "news.edit", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = sqlite3.connect(NEWS_DB_PATH)
    c = conn.cursor()
    
    # Обновляем новость
    c.execute("UPDATE news SET title = ?, content = ?, category = ? WHERE id = ?",
              (title, content, category, news_id))
    
    # Получаем текущие изображения
    c.execute("SELECT image_url FROM news_images WHERE news_id = ?", (news_id,))
    current_images = [row[0] for row in c.fetchall()]
    
    # Удаляем изображения, которых нет в existing_images
    existing = json.loads(existing_images)
    for img in current_images:
        if img not in existing:
            filepath = os.path.join(BASE_DIR, img.lstrip('/'))
            if os.path.exists(filepath):
                os.remove(filepath)
            c.execute("DELETE FROM news_images WHERE news_id = ? AND image_url = ?", (news_id, img))
    
    # Добавляем новые изображения
    for i, image in enumerate(images):
        ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        filename = f"news_{news_id}_{i}_{dt.now().timestamp()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(image.file, f)
        image_url = f"/uploads/{filename}"
        c.execute("INSERT INTO news_images (news_id, image_url, sort_order) VALUES (?, ?, ?)",
                  (news_id, image_url, i))
    
    conn.commit()
    conn.close()
    return {"message": "Новость обновлена"}

@app.delete("/api/news/{news_id}")
async def delete_news(news_id: int, current_user: dict = Depends(get_current_user)):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "news.delete", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = sqlite3.connect(NEWS_DB_PATH)
    c = conn.cursor()
    
    # Удаляем связанные файлы
    c.execute("SELECT image_url FROM news_images WHERE news_id = ?", (news_id,))
    for row in c.fetchall():
        filepath = os.path.join(BASE_DIR, row[0].lstrip('/'))
        if os.path.exists(filepath):
            os.remove(filepath)
    
    c.execute("DELETE FROM news WHERE id = ?", (news_id,))
    conn.commit()
    conn.close()
    return {"message": "Новость удалена"}

# ============ API СЕТЕВЫХ РЕСУРСОВ ============

@app.get("/api/network-resources")
async def get_network_resources(category_id: int = None, current_user: dict = Depends(get_current_user)):
    """Получить сетевые ресурсы с учётом прав доступа"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    conn = get_settings_db()
    c = conn.cursor()
    
    if category_id:
        c.execute("SELECT * FROM network_resources WHERE category_id = ? ORDER BY sort_order, resource_name", (category_id,))
    else:
        c.execute("SELECT * FROM network_resources ORDER BY sort_order, resource_name")
    
    all_resources = [dict(row) for row in c.fetchall()]
    result = []
    
    for resource in all_resources:
        # Проверяем права доступа
        has_access = False
        
        # Глобальные ресурсы доступны всем
        if resource.get('is_global'):
            has_access = True
        else:
            # Проверяем целевые группы/пользователей
            c.execute("SELECT target_type, target_id FROM network_resource_targets WHERE resource_id = ?", (resource['id'],))
            targets = c.fetchall()
            for target in targets:
                if target['target_type'] == 'user' and target['target_id'] == username:
                    has_access = True
                    break
                elif target['target_type'] == 'group' and target['target_id'] in user_groups:
                    has_access = True
                    break
        
        if has_access:
            result.append(resource)
    
    conn.close()
    return result

@app.get("/api/resource-categories")
async def get_resource_categories(current_user: dict = Depends(get_current_user)):
    """Получить категории ресурсов"""
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM resource_categories ORDER BY sort_order, name")
    categories = [dict(row) for row in c.fetchall()]
    conn.close()
    return categories

@app.post("/api/resource-categories")
async def create_resource_category(
    name: str,
    description: str = "",
    icon: str = "📁",
    is_global: bool = False,
    target_groups: list = [],
    target_users: list = [],
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "categories.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("INSERT INTO resource_categories (name, description, icon, is_global) VALUES (?, ?, ?, ?)",
              (name, description, icon, 1 if is_global else 0))
    category_id = c.lastrowid
    
    if not is_global:
        for group in target_groups:
            c.execute("INSERT INTO category_targets (category_id, target_type, target_id) VALUES (?, ?, ?)",
                      (category_id, 'group', group))
        for user in target_users:
            c.execute("INSERT INTO category_targets (category_id, target_type, target_id) VALUES (?, ?, ?)",
                      (category_id, 'user', user))
    
    conn.commit()
    conn.close()
    return {"id": category_id, "message": "Категория создана"}

@app.put("/api/resource-categories/{category_id}")
async def update_resource_category(
    category_id: int,
    name: str,
    description: str = "",
    icon: str = "📁",
    is_global: bool = False,
    target_groups: list = [],
    target_users: list = [],
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "categories.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("UPDATE resource_categories SET name = ?, description = ?, icon = ?, is_global = ? WHERE id = ?",
              (name, description, icon, 1 if is_global else 0, category_id))
    
    c.execute("DELETE FROM category_targets WHERE category_id = ?", (category_id,))
    
    if not is_global:
        for group in target_groups:
            c.execute("INSERT INTO category_targets (category_id, target_type, target_id) VALUES (?, ?, ?)",
                      (category_id, 'group', group))
        for user in target_users:
            c.execute("INSERT INTO category_targets (category_id, target_type, target_id) VALUES (?, ?, ?)",
                      (category_id, 'user', user))
    
    conn.commit()
    conn.close()
    return {"message": "Категория обновлена"}

@app.delete("/api/resource-categories/{category_id}")
async def delete_resource_category(category_id: int, current_user: dict = Depends(get_current_user)):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "categories.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM resource_categories WHERE id = ?", (category_id,))
    conn.commit()
    conn.close()
    return {"message": "Категория удалена"}

@app.post("/api/network-resources")
async def create_network_resource(
    resource_name: str,
    resource_path: str,
    resource_type: str = "folder",
    category_id: int = None,
    is_global: bool = False,
    target_groups: list = [],
    target_users: list = [],
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "network.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("""INSERT INTO network_resources 
                (resource_name, resource_path, resource_type, category_id, is_global, created_by) 
                VALUES (?, ?, ?, ?, ?, ?)""",
              (resource_name, resource_path, resource_type, category_id, 1 if is_global else 0, username))
    resource_id = c.lastrowid
    
    if not is_global:
        for group in target_groups:
            c.execute("INSERT INTO network_resource_targets (resource_id, target_type, target_id) VALUES (?, ?, ?)",
                      (resource_id, 'group', group))
        for user in target_users:
            c.execute("INSERT INTO network_resource_targets (resource_id, target_type, target_id) VALUES (?, ?, ?)",
                      (resource_id, 'user', user))
    
    conn.commit()
    conn.close()
    return {"id": resource_id, "message": "Ресурс создан"}

@app.put("/api/network-resources/{resource_id}")
async def update_network_resource(
    resource_id: int,
    resource_name: str,
    resource_path: str,
    resource_type: str = "folder",
    category_id: int = None,
    is_global: bool = False,
    target_groups: list = [],
    target_users: list = [],
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "network.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("""UPDATE network_resources 
                SET resource_name = ?, resource_path = ?, resource_type = ?, category_id = ?, is_global = ?
                WHERE id = ?""",
              (resource_name, resource_path, resource_type, category_id, 1 if is_global else 0, resource_id))
    
    c.execute("DELETE FROM network_resource_targets WHERE resource_id = ?", (resource_id,))
    
    if not is_global:
        for group in target_groups:
            c.execute("INSERT INTO network_resource_targets (resource_id, target_type, target_id) VALUES (?, ?, ?)",
                      (resource_id, 'group', group))
        for user in target_users:
            c.execute("INSERT INTO network_resource_targets (resource_id, target_type, target_id) VALUES (?, ?, ?)",
                      (resource_id, 'user', user))
    
    conn.commit()
    conn.close()
    return {"message": "Ресурс обновлён"}

@app.delete("/api/network-resources/{resource_id}")
async def delete_network_resource(resource_id: int, current_user: dict = Depends(get_current_user)):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "network.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM network_resources WHERE id = ?", (resource_id,))
    conn.commit()
    conn.close()
    return {"message": "Ресурс удалён"}

# ============ API СЕРВИСОВ ============

@app.get("/api/services")
async def get_services(current_user: dict = Depends(get_current_user)):
    """Получить сервисы с учётом прав доступа"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM services ORDER BY sort_order, service_name")
    all_services = [dict(row) for row in c.fetchall()]
    result = []
    
    for service in all_services:
        has_access = False
        
        if service.get('is_global'):
            has_access = True
        else:
            c.execute("SELECT target_type, target_id FROM service_targets WHERE service_id = ?", (service['id'],))
            targets = c.fetchall()
            for target in targets:
                if target['target_type'] == 'user' and target['target_id'] == username:
                    has_access = True
                    break
                elif target['target_type'] == 'group' and target['target_id'] in user_groups:
                    has_access = True
                    break
        
        if has_access:
            result.append(service)
    
    conn.close()
    return result

@app.post("/api/services")
async def create_service(
    service_name: str,
    service_url: str,
    service_icon: str = "🔗",
    is_global: bool = False,
    target_groups: list = [],
    target_users: list = [],
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "services.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("INSERT INTO services (service_name, service_url, service_icon, is_global) VALUES (?, ?, ?, ?)",
              (service_name, service_url, service_icon, 1 if is_global else 0))
    service_id = c.lastrowid
    
    if not is_global:
        for group in target_groups:
            c.execute("INSERT INTO service_targets (service_id, target_type, target_id) VALUES (?, ?, ?)",
                      (service_id, 'group', group))
        for user in target_users:
            c.execute("INSERT INTO service_targets (service_id, target_type, target_id) VALUES (?, ?, ?)",
                      (service_id, 'user', user))
    
    conn.commit()
    conn.close()
    return {"id": service_id, "message": "Сервис создан"}

@app.put("/api/services/{service_id}")
async def update_service(
    service_id: int,
    service_name: str,
    service_url: str,
    service_icon: str = "🔗",
    is_global: bool = False,
    target_groups: list = [],
    target_users: list = [],
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "services.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("UPDATE services SET service_name = ?, service_url = ?, service_icon = ?, is_global = ? WHERE id = ?",
              (service_name, service_url, service_icon, 1 if is_global else 0, service_id))
    
    c.execute("DELETE FROM service_targets WHERE service_id = ?", (service_id,))
    
    if not is_global:
        for group in target_groups:
            c.execute("INSERT INTO service_targets (service_id, target_type, target_id) VALUES (?, ?, ?)",
                      (service_id, 'group', group))
        for user in target_users:
            c.execute("INSERT INTO service_targets (service_id, target_type, target_id) VALUES (?, ?, ?)",
                      (service_id, 'user', user))
    
    conn.commit()
    conn.close()
    return {"message": "Сервис обновлён"}

@app.delete("/api/services/{service_id}")
async def delete_service(service_id: int, current_user: dict = Depends(get_current_user)):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "services.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM services WHERE id = ?", (service_id,))
    conn.commit()
    conn.close()
    return {"message": "Сервис удалён"}

# ============ API ЗАМЕН НА ОТПУСК ============

@app.get("/api/vacation-replacements")
async def get_vacation_replacements(current_user: dict = Depends(get_current_user)):
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM vacation_replacements WHERE status = 'active' ORDER BY created_at DESC")
    replacements = [dict(row) for row in c.fetchall()]
    conn.close()
    return replacements

@app.post("/api/vacation-replacements")
async def create_vacation_replacement(
    employee_name: str,
    position: str,
    department: str,
    substitute_name: str,
    start_date: str = None,
    end_date: str = None,
    reason: str = "",
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "replacements.create", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("""INSERT INTO vacation_replacements 
                (employee_name, position, department, substitute_name, start_date, end_date, reason, status, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
              (employee_name, position, department, substitute_name, start_date, end_date, reason, "active", username))
    
    conn.commit()
    conn.close()
    return {"message": "Замена создана"}

@app.put("/api/vacation-replacements/{replacement_id}")
async def update_vacation_replacement(
    replacement_id: int,
    employee_name: str,
    position: str,
    department: str,
    substitute_name: str,
    start_date: str = None,
    end_date: str = None,
    reason: str = "",
    status: str = "active",
    current_user: dict = Depends(get_current_user)
):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "replacements.edit", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("""UPDATE vacation_replacements 
                SET employee_name = ?, position = ?, department = ?, substitute_name = ?, 
                    start_date = ?, end_date = ?, reason = ?, status = ?
                WHERE id = ?""",
              (employee_name, position, department, substitute_name, start_date, end_date, reason, status, replacement_id))
    
    conn.commit()
    conn.close()
    return {"message": "Замена обновлена"}

@app.delete("/api/vacation-replacements/{replacement_id}")
async def delete_vacation_replacement(replacement_id: int, current_user: dict = Depends(get_current_user)):
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "replacements.delete", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM vacation_replacements WHERE id = ?", (replacement_id,))
    conn.commit()
    conn.close()
    return {"message": "Замена удалена"}

# ============ API КАЛЕНДАРЯ ============

@app.get("/api/calendar/events")
async def get_calendar_events(
    start_date: str = None,
    end_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Получить события календаря для текущего пользователя"""
    username = current_user.get("sub")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    query = """
        SELECT ce.* FROM calendar_events ce
        LEFT JOIN calendar_event_participants cep ON ce.id = cep.event_id
        WHERE cep.participant_type = 'user' AND cep.participant_id = ?
    """
    params = [username]
    
    if start_date:
        query += " AND ce.event_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND ce.event_date <= ?"
        params.append(end_date)
    
    query += " ORDER BY ce.event_date, ce.event_time"
    
    c.execute(query, params)
    events = [dict(row) for row in c.fetchall()]
    
    for event in events:
        c.execute("SELECT participant_type, participant_id FROM calendar_event_participants WHERE event_id = ?", (event['id'],))
        event['participants'] = [dict(row) for row in c.fetchall()]
    
    conn.close()
    return events

@app.get("/api/calendar/events/{event_id}")
async def get_calendar_event(event_id: int, current_user: dict = Depends(get_current_user)):
    """Получить событие календаря по ID"""
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("SELECT * FROM calendar_events WHERE id = ?", (event_id,))
    event = c.fetchone()
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    event_dict = dict(event)
    c.execute("SELECT participant_type, participant_id FROM calendar_event_participants WHERE event_id = ?", (event_id,))
    event_dict['participants'] = [dict(row) for row in c.fetchall()]
    
    conn.close()
    return event_dict

@app.post("/api/calendar/events")
async def create_calendar_event(
    title: str,
    event_date: str,
    event_time: str = "10:00",
    end_date: str = None,
    end_time: str = None,
    event_type: str = "meeting",
    location: str = "",
    description: str = "",
    is_all_day: bool = False,
    repeat: str = "none",
    remind_before: int = 0,
    participants: list = [],
    current_user: dict = Depends(get_current_user)
):
    """Создать событие календаря"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "calendar.create", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("""
        INSERT INTO calendar_events 
        (title, event_date, event_time, end_date, end_time, event_type, location, description, is_all_day, repeat, remind_before, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (title, event_date, event_time, end_date, end_time, event_type, location, description, 1 if is_all_day else 0, repeat, remind_before, username))
    
    event_id = c.lastrowid
    
    # Добавляем участников
    for p in participants:
        c.execute("INSERT INTO calendar_event_participants (event_id, participant_type, participant_id) VALUES (?, ?, ?)",
                  (event_id, p.get('type'), p.get('id')))
    
    conn.commit()
    
    # Отправляем уведомления
    send_event_notification_to_all_participants(event_id, conn, is_new=True)
    
    conn.close()
    return {"id": event_id, "message": "Событие создано"}

@app.put("/api/calendar/events/{event_id}")
async def update_calendar_event(
    event_id: int,
    title: str,
    event_date: str,
    event_time: str = "10:00",
    end_date: str = None,
    end_time: str = None,
    event_type: str = "meeting",
    location: str = "",
    description: str = "",
    is_all_day: bool = False,
    repeat: str = "none",
    remind_before: int = 0,
    participants: list = [],
    current_user: dict = Depends(get_current_user)
):
    """Обновить событие календаря"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "calendar.edit", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("""
        UPDATE calendar_events 
        SET title = ?, event_date = ?, event_time = ?, end_date = ?, end_time = ?,
            event_type = ?, location = ?, description = ?, is_all_day = ?, repeat = ?, remind_before = ?
        WHERE id = ?
    """, (title, event_date, event_time, end_date, end_time, event_type, location, description, 1 if is_all_day else 0, repeat, remind_before, event_id))
    
    # Обновляем участников
    c.execute("DELETE FROM calendar_event_participants WHERE event_id = ?", (event_id,))
    for p in participants:
        c.execute("INSERT INTO calendar_event_participants (event_id, participant_type, participant_id) VALUES (?, ?, ?)",
                  (event_id, p.get('type'), p.get('id')))
    
    conn.commit()
    
    # Отправляем уведомления
    send_event_notification_to_all_participants(event_id, conn, is_new=False)
    
    conn.close()
    return {"message": "Событие обновлено"}

@app.delete("/api/calendar/events/{event_id}")
async def delete_calendar_event(event_id: int, current_user: dict = Depends(get_current_user)):
    """Удалить событие календаря"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "calendar.delete", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM calendar_events WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()
    return {"message": "Событие удалено"}

@app.get("/api/calendar/groups")
async def get_calendar_groups(current_user: dict = Depends(get_current_user)):
    """Получить группы календаря"""
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM calendar_groups ORDER BY name")
    groups = [dict(row) for row in c.fetchall()]
    
    for group in groups:
        c.execute("SELECT username FROM calendar_group_members WHERE group_id = ?", (group['id'],))
        group['members'] = [row[0] for row in c.fetchall()]
    
    conn.close()
    return groups

@app.post("/api/calendar/groups")
async def create_calendar_group(
    name: str,
    description: str = "",
    members: list = [],
    current_user: dict = Depends(get_current_user)
):
    """Создать группу календаря"""
    username = current_user.get("sub")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("INSERT INTO calendar_groups (name, description, created_by) VALUES (?, ?, ?)",
              (name, description, username))
    group_id = c.lastrowid
    
    for member in members:
        c.execute("INSERT INTO calendar_group_members (group_id, username) VALUES (?, ?)",
                  (group_id, member))
    
    conn.commit()
    conn.close()
    return {"id": group_id, "message": "Группа создана"}

@app.put("/api/calendar/groups/{group_id}")
async def update_calendar_group(
    group_id: int,
    name: str,
    description: str = "",
    members: list = [],
    current_user: dict = Depends(get_current_user)
):
    """Обновить группу календаря"""
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("UPDATE calendar_groups SET name = ?, description = ? WHERE id = ?",
              (name, description, group_id))
    
    c.execute("DELETE FROM calendar_group_members WHERE group_id = ?", (group_id,))
    for member in members:
        c.execute("INSERT INTO calendar_group_members (group_id, username) VALUES (?, ?)",
                  (group_id, member))
    
    conn.commit()
    conn.close()
    return {"message": "Группа обновлена"}

@app.delete("/api/calendar/groups/{group_id}")
async def delete_calendar_group(group_id: int, current_user: dict = Depends(get_current_user)):
    """Удалить группу календаря"""
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM calendar_groups WHERE id = ?", (group_id,))
    conn.commit()
    conn.close()
    return {"message": "Группа удалена"}

# ============ API УВЕДОМЛЕНИЙ ============

@app.get("/api/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Получить текущие уведомления"""
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5")
    notifications = [dict(row) for row in c.fetchall()]
    conn.close()
    return notifications

@app.post("/api/notifications")
async def create_notification(
    text: str,
    current_user: dict = Depends(get_current_user)
):
    """Создать уведомление"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "notifications.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("INSERT INTO notifications (text, created_by) VALUES (?, ?)", (text, username))
    conn.commit()
    conn.close()
    return {"message": "Уведомление создано"}

@app.delete("/api/notifications/{notification_id}")
async def delete_notification(notification_id: int, current_user: dict = Depends(get_current_user)):
    """Удалить уведомление"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "notifications.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM notifications WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"message": "Уведомление удалено"}

# ============ API ГРУПП ============

@app.get("/api/admin/groups")
async def get_ad_groups(current_user: dict = Depends(get_current_user)):
    """Получить список AD групп"""
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM ad_groups ORDER BY display_name")
    groups = [dict(row) for row in c.fetchall()]
    conn.close()
    return groups

@app.post("/api/admin/groups")
async def create_ad_group(
    group_name: str,
    display_name: str = "",
    current_user: dict = Depends(get_current_user)
):
    """Создать AD группу"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "groups.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO ad_groups (group_name, display_name) VALUES (?, ?)",
              (group_name, display_name or group_name))
    conn.commit()
    conn.close()
    return {"message": "Группа создана"}

@app.delete("/api/admin/groups/{group_id}")
async def delete_ad_group(group_id: int, current_user: dict = Depends(get_current_user)):
    """Удалить AD группу"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "groups.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM ad_groups WHERE id = ?", (group_id,))
    conn.commit()
    conn.close()
    return {"message": "Группа удалена"}

# ============ API РОЛЕЙ И ПРАВ ============

@app.get("/api/admin/roles")
async def get_roles(current_user: dict = Depends(get_current_user)):
    """Получить список ролей"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "users.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM roles ORDER BY id")
    roles = [dict(row) for row in c.fetchall()]
    
    for role in roles:
        c.execute("""SELECT p.permission_key, p.display_name 
                    FROM permissions p 
                    JOIN role_permissions rp ON p.id = rp.permission_id 
                    WHERE rp.role_id = ?""", (role['id'],))
        role['permissions'] = [dict(row) for row in c.fetchall()]
    
    conn.close()
    return roles

@app.get("/api/admin/user-role")
async def get_user_role_api(current_user: dict = Depends(get_current_user)):
    """Получить роль текущего пользователя"""
    username = current_user.get("sub")
    role = await get_user_role(username)
    return {"role": role}

@app.put("/api/admin/user-role")
async def assign_user_role(
    username: str,
    role_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Назначить роль пользователю"""
    admin_username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(admin_username, "users.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    role = c.execute("SELECT id FROM roles WHERE role_name = ?", (role_name,)).fetchone()
    if not role:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    
    c.execute("DELETE FROM user_roles WHERE username = ?", (username,))
    c.execute("INSERT INTO user_roles (username, role_id, assigned_by) VALUES (?, ?, ?)",
              (username, role['id'], admin_username))
    
    conn.commit()
    conn.close()
    return {"message": f"Роль {role_name} назначена пользователю {username}"}

# ============ API ОРГАНИЗАЦИОННОЙ СТРУКТУРЫ ============

@app.get("/api/admin/organization-tree")
async def get_organization_tree(current_user: dict = Depends(get_current_user)):
    """Получить дерево организации"""
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT tree_data, updated_by, updated_at FROM organization_tree ORDER BY id DESC LIMIT 1")
    row = c.fetchone()
    conn.close()
    
    if row:
        return {
            "tree": json.loads(row[0]),
            "updated_by": row[1],
            "updated_at": row[2]
        }
    return {"tree": [], "updated_by": None, "updated_at": None}

@app.put("/api/admin/organization-tree")
async def update_organization_tree(
    tree: list,
    current_user: dict = Depends(get_current_user)
):
    """Обновить дерево организации"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "organization.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("DELETE FROM organization_tree")
    c.execute("INSERT INTO organization_tree (tree_data, updated_by, updated_at) VALUES (?, ?, ?)",
              (json.dumps(tree), username, dt.now().isoformat()))
    
    conn.commit()
    conn.close()
    return {"message": "Организационная структура обновлена"}

# ============ API IT-ЗАДАЧ ============

@app.get("/api/task-categories")
async def get_task_categories(current_user: dict = Depends(get_current_user)):
    """Получить категории задач"""
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM task_categories ORDER BY sort_order, name")
    categories = [dict(row) for row in c.fetchall()]
    conn.close()
    return categories

@app.post("/api/task-categories")
async def create_task_category(
    name: str,
    color: str = "#3b82f6",
    current_user: dict = Depends(get_current_user)
):
    """Создать категорию задач"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.create", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("INSERT INTO task_categories (name, color) VALUES (?, ?)", (name, color))
    conn.commit()
    category_id = c.lastrowid
    conn.close()
    return {"id": category_id, "message": "Категория создана"}

@app.put("/api/task-categories/{category_id}")
async def update_task_category(
    category_id: int,
    name: str,
    color: str = "#3b82f6",
    sort_order: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Обновить категорию задач"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.edit", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("UPDATE task_categories SET name = ?, color = ?, sort_order = ? WHERE id = ?",
              (name, color, sort_order, category_id))
    conn.commit()
    conn.close()
    return {"message": "Категория обновлена"}

@app.delete("/api/task-categories/{category_id}")
async def delete_task_category(category_id: int, current_user: dict = Depends(get_current_user)):
    """Удалить категорию задач"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.delete", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM task_categories WHERE id = ?", (category_id,))
    conn.commit()
    conn.close()
    return {"message": "Категория удалена"}

@app.get("/api/equipment-types")
async def get_equipment_types(current_user: dict = Depends(get_current_user)):
    """Получить типы комплектующих"""
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM equipment_types ORDER BY sort_order, name")
    equipment = [dict(row) for row in c.fetchall()]
    conn.close()
    return equipment

@app.post("/api/equipment-types")
async def create_equipment_type(
    name: str,
    category: str = "pc_component",
    unit: str = "шт",
    current_user: dict = Depends(get_current_user)
):
    """Создать тип комплектующих"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "equipment.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("INSERT INTO equipment_types (name, category, unit) VALUES (?, ?, ?)", (name, category, unit))
    conn.commit()
    equipment_id = c.lastrowid
    conn.close()
    return {"id": equipment_id, "message": "Тип комплектующих создан"}

@app.put("/api/equipment-types/{equipment_id}")
async def update_equipment_type(
    equipment_id: int,
    name: str,
    category: str = "pc_component",
    unit: str = "шт",
    sort_order: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Обновить тип комплектующих"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "equipment.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("UPDATE equipment_types SET name = ?, category = ?, unit = ?, sort_order = ? WHERE id = ?",
              (name, category, unit, sort_order, equipment_id))
    conn.commit()
    conn.close()
    return {"message": "Тип комплектующих обновлен"}

@app.delete("/api/equipment-types/{equipment_id}")
async def delete_equipment_type(equipment_id: int, current_user: dict = Depends(get_current_user)):
    """Удалить тип комплектующих"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "equipment.manage", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM equipment_types WHERE id = ?", (equipment_id,))
    conn.commit()
    conn.close()
    return {"message": "Тип комплектующих удален"}

@app.get("/api/it-tasks")
async def get_it_tasks(
    is_archived: bool = False,
    category_id: int = None,
    assigned_to: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Получить IT-задачи"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    conn = get_settings_db()
    c = conn.cursor()
    
    query = "SELECT * FROM it_tasks WHERE is_archived = ?"
    params = [1 if is_archived else 0]
    
    if category_id:
        query += " AND category_id = ?"
        params.append(category_id)
    
    if assigned_to:
        query += " AND assigned_to = ?"
        params.append(assigned_to)
    
    query += " ORDER BY created_date DESC, id DESC"
    
    c.execute(query, params)
    tasks = [dict(row) for row in c.fetchall()]
    
    # Добавляем информацию о комплектующих
    for task in tasks:
        if task.get('equipment_id'):
            c.execute("SELECT * FROM equipment_types WHERE id = ?", (task['equipment_id'],))
            equipment = c.fetchone()
            if equipment:
                task['equipment'] = dict(equipment)
    
    conn.close()
    return tasks

@app.get("/api/it-tasks/{task_id}")
async def get_it_task(task_id: int, current_user: dict = Depends(get_current_user)):
    """Получить IT-задачу по ID"""
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("SELECT * FROM it_tasks WHERE id = ?", (task_id,))
    task = c.fetchone()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    task_dict = dict(task)
    if task_dict.get('equipment_id'):
        c.execute("SELECT * FROM equipment_types WHERE id = ?", (task_dict['equipment_id'],))
        equipment = c.fetchone()
        if equipment:
            task_dict['equipment'] = dict(equipment)
    
    conn.close()
    return task_dict

@app.post("/api/it-tasks")
async def create_it_task(
    title: str,
    description: str = "",
    category_id: int = None,
    equipment_id: int = None,
    assigned_to: str = None,
    components_status: str = "missing",
    executor: str = None,
    due_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Создать IT-задачу"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.create", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    created_date = dt.now().strftime("%Y-%m-%d")
    
    # Получаем email назначенного пользователя
    assigned_email = None
    if assigned_to:
        chat_conn = get_db()
        chat_c = chat_conn.cursor()
        chat_c.execute("SELECT email FROM users WHERE username = ? OR name = ?", (assigned_to, assigned_to))
        user = chat_c.fetchone()
        if user and user[0]:
            assigned_email = user[0]
        chat_conn.close()
    
    c.execute("""
        INSERT INTO it_tasks 
        (title, description, category_id, equipment_id, assigned_to, components_status, executor, created_by, created_date, due_date, assigned_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (title, description, category_id, equipment_id, assigned_to, components_status, executor, username, created_date, due_date, assigned_email))
    
    task_id = c.lastrowid
    conn.commit()
    
    # Отправляем email уведомление
    if assigned_email:
        send_task_email(assigned_email, assigned_to, title, description, due_date, task_id)
    
    conn.close()
    return {"id": task_id, "message": "Задача создана"}

@app.put("/api/it-tasks/{task_id}")
async def update_it_task(
    task_id: int,
    title: str,
    description: str = "",
    category_id: int = None,
    equipment_id: int = None,
    assigned_to: str = None,
    components_status: str = "missing",
    executor: str = None,
    due_date: str = None,
    completed_date: str = None,
    is_archived: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Обновить IT-задачу"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.edit", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    # Получаем email назначенного пользователя
    assigned_email = None
    if assigned_to:
        chat_conn = get_db()
        chat_c = chat_conn.cursor()
        chat_c.execute("SELECT email FROM users WHERE username = ? OR name = ?", (assigned_to, assigned_to))
        user = chat_c.fetchone()
        if user and user[0]:
            assigned_email = user[0]
        chat_conn.close()
    
    c.execute("""
        UPDATE it_tasks 
        SET title = ?, description = ?, category_id = ?, equipment_id = ?, assigned_to = ?,
            components_status = ?, executor = ?, due_date = ?, completed_date = ?, is_archived = ?, assigned_email = ?
        WHERE id = ?
    """, (title, description, category_id, equipment_id, assigned_to, components_status, executor, due_date, completed_date, 1 if is_archived else 0, assigned_email, task_id))
    
    conn.commit()
    conn.close()
    return {"message": "Задача обновлена"}

@app.delete("/api/it-tasks/{task_id}")
async def delete_it_task(task_id: int, current_user: dict = Depends(get_current_user)):
    """Удалить IT-задачу"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.delete", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM it_tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": "Задача удалена"}

@app.post("/api/it-tasks/{task_id}/archive")
async def archive_it_task(task_id: int, current_user: dict = Depends(get_current_user)):
    """Архивировать IT-задачу"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.archive", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("UPDATE it_tasks SET is_archived = 1 WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": "Задача архивирована"}

@app.post("/api/it-tasks/{task_id}/restore")
async def restore_it_task(task_id: int, current_user: dict = Depends(get_current_user)):
    """Восстановить IT-задачу из архива"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.restore", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("UPDATE it_tasks SET is_archived = 0 WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": "Задача восстановлена"}

# ============ API МОНИТОРИНГА ЗАДАЧ ============

@app.get("/api/it-task-monitoring")
async def get_it_task_monitoring(current_user: dict = Depends(get_current_user)):
    """Получить настройки мониторинга задач"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.view", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("SELECT * FROM it_task_monitoring ORDER BY created_at DESC")
    monitors = [dict(row) for row in c.fetchall()]
    conn.close()
    return monitors

@app.post("/api/it-task-monitoring")
async def create_it_task_monitoring(
    title_template: str,
    description_template: str = "",
    category_id: int = None,
    equipment_id: int = None,
    assigned_to: str = None,
    executor: str = None,
    interval_days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Создать настройку мониторинга задач"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.create", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    next_run = (dt.now() + timedelta(days=interval_days)).strftime("%Y-%m-%d")
    
    c.execute("""
        INSERT INTO it_task_monitoring 
        (title_template, description_template, category_id, equipment_id, assigned_to, executor, interval_days, next_run, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (title_template, description_template, category_id, equipment_id, assigned_to, executor, interval_days, next_run, username))
    
    monitor_id = c.lastrowid
    conn.commit()
    conn.close()
    return {"id": monitor_id, "message": "Настройка мониторинга создана"}

@app.put("/api/it-task-monitoring/{monitor_id}")
async def update_it_task_monitoring(
    monitor_id: int,
    title_template: str,
    description_template: str = "",
    category_id: int = None,
    equipment_id: int = None,
    assigned_to: str = None,
    executor: str = None,
    interval_days: int = 30,
    is_active: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Обновить настройку мониторинга задач"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.edit", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    c.execute("""
        UPDATE it_task_monitoring 
        SET title_template = ?, description_template = ?, category_id = ?, equipment_id = ?,
            assigned_to = ?, executor = ?, interval_days = ?, is_active = ?
        WHERE id = ?
    """, (title_template, description_template, category_id, equipment_id, assigned_to, executor, interval_days, 1 if is_active else 0, monitor_id))
    
    conn.commit()
    conn.close()
    return {"message": "Настройка мониторинга обновлена"}

@app.delete("/api/it-task-monitoring/{monitor_id}")
async def delete_it_task_monitoring(monitor_id: int, current_user: dict = Depends(get_current_user)):
    """Удалить настройку мониторинга задач"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "tasks.delete", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    c.execute("DELETE FROM it_task_monitoring WHERE id = ?", (monitor_id,))
    conn.commit()
    conn.close()
    return {"message": "Настройка мониторинга удалена"}

# ============ API ОТЧЕТОВ ============

@app.get("/api/reports/tasks")
async def get_tasks_report(
    start_date: str = None,
    end_date: str = None,
    category_id: int = None,
    assigned_to: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Получить отчет по задачам"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "reports.view", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    query = """
        SELECT t.*, c.name as category_name, e.name as equipment_name
        FROM it_tasks t
        LEFT JOIN task_categories c ON t.category_id = c.id
        LEFT JOIN equipment_types e ON t.equipment_id = e.id
        WHERE 1=1
    """
    params = []
    
    if start_date:
        query += " AND t.created_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND t.created_date <= ?"
        params.append(end_date)
    if category_id:
        query += " AND t.category_id = ?"
        params.append(category_id)
    if assigned_to:
        query += " AND t.assigned_to = ?"
        params.append(assigned_to)
    
    query += " ORDER BY t.created_date DESC"
    
    c.execute(query, params)
    tasks = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return tasks

@app.get("/api/reports/tasks/export")
async def export_tasks_csv(
    start_date: str = None,
    end_date: str = None,
    category_id: int = None,
    assigned_to: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Экспорт задач в CSV"""
    username = current_user.get("sub")
    user_groups = current_user.get("groups", [])
    
    if not await has_permission(username, "reports.view", user_groups):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    conn = get_settings_db()
    c = conn.cursor()
    
    query = """
        SELECT t.id, t.title, t.description, c.name as category, e.name as equipment,
               t.assigned_to, t.components_status, t.executor, t.created_by,
               t.created_date, t.due_date, t.completed_date
        FROM it_tasks t
        LEFT JOIN task_categories c ON t.category_id = c.id
        LEFT JOIN equipment_types e ON t.equipment_id = e.id
        WHERE 1=1
    """
    params = []
    
    if start_date:
        query += " AND t.created_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND t.created_date <= ?"
        params.append(end_date)
    if category_id:
        query += " AND t.category_id = ?"
        params.append(category_id)
    if assigned_to:
        query += " AND t.assigned_to = ?"
        params.append(assigned_to)
    
    query += " ORDER BY t.created_date DESC"
    
    c.execute(query, params)
    tasks = c.fetchall()
    conn.close()
    
    # Создаем CSV
    output = StringIO()
    writer = csv.writer(output, delimiter=';')
    writer.writerow(['ID', 'Название', 'Описание', 'Категория', 'Комплектующие', 
                     'Назначено', 'Статус компонентов', 'Исполнитель', 'Создал',
                     'Дата создания', 'Срок', 'Дата выполнения'])
    
    for task in tasks:
        writer.writerow([
            task[0], task[1], task[2], task[3] or '', task[4] or '',
            task[5] or '', task[6] or '', task[7] or '', task[8] or '',
            task[9] or '', task[10] or '', task[11] or ''
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue().encode('utf-8-sig')]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=tasks_report_{dt.now().strftime('%Y%m%d')}.csv"}
    )

# ============ АЛИАСЫ ДЛЯ /api/admin/* ============

@app.get("/api/admin/users")
async def admin_users(current_user: dict = Depends(get_current_user)):
    return await get_users(current_user)

@app.get("/api/admin/resource-categories")
async def admin_resource_categories(current_user: dict = Depends(get_current_user)):
    return await get_resource_categories(current_user)

@app.get("/api/admin/network-resources")
async def admin_network_resources(current_user: dict = Depends(get_current_user)):
    return await get_network_resources(current_user)

@app.get("/api/admin/roles")
async def admin_roles_endpoint(current_user: dict = Depends(get_current_user)):
    return await get_roles(current_user)

@app.get("/api/admin/groups")
async def admin_groups_endpoint(current_user: dict = Depends(get_current_user)):
    return await get_ad_groups(current_user)

@app.get("/api/admin/user-role")
async def admin_user_role_endpoint(current_user: dict = Depends(get_current_user)):
    return await get_user_role_api(current_user)

@app.get("/api/admin/organization-tree")
async def admin_organization_tree_endpoint(current_user: dict = Depends(get_current_user)):
    return await get_organization_tree(current_user)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)