#!/usr/bin/env python3
import sqlite3
import sys
import os

sys.path.append('/home/webportal/myapp-api/backend')
from server.ad_users import get_all_ad_users
from datetime import datetime

DB_PATH = '/home/webportal/myapp-api/backend/settings.db'
CHAT_DB_PATH = '/home/webportal/myapp-api/backend/chat.db'

def sync_users():
    print(f"[{datetime.now()}] Начинаем синхронизацию пользователей из AD...")
    
    # Получаем всех пользователей из AD
    ad_users = get_all_ad_users()
    print(f"Загружено {len(ad_users)} пользователей из AD")
    
    if not ad_users:
        print("Ошибка: не удалось загрузить пользователей из AD")
        return
    
    # Подключаемся к базам данных
    conn_settings = sqlite3.connect(DB_PATH)
    conn_chat = sqlite3.connect(CHAT_DB_PATH)
    c_settings = conn_settings.cursor()
    c_chat = conn_chat.cursor()
    
    # Получаем роль user
    c_settings.execute("SELECT id FROM roles WHERE role_name = 'user'")
    user_role = c_settings.fetchone()
    user_role_id = user_role[0] if user_role else 4
    
    count_new = 0
    count_updated = 0
    
    for user in ad_users:
        username = user.get('username')
        display_name = user.get('name', username)
        email = user.get('email', f'{username}@gap-rt.ru')
        
        if not username:
            continue
        
        # Добавляем/обновляем в settings.db (user_roles)
        c_settings.execute("SELECT role_id FROM user_roles WHERE username = ?", (username,))
        existing = c_settings.fetchone()
        
        if not existing:
            c_settings.execute(
                "INSERT INTO user_roles (username, role_id, assigned_by, assigned_at) VALUES (?, ?, ?, ?)",
                (username, user_role_id, "system", datetime.now().isoformat())
            )
            count_new += 1
            print(f"  + Добавлен: {username} - {display_name}")
        else:
            count_updated += 1
        
        # Добавляем/обновляем в chat.db (users)
        c_chat.execute(
            "INSERT OR REPLACE INTO users (username, name, department) VALUES (?, ?, ?)",
            (username, display_name, "")
        )
    
    conn_settings.commit()
    conn_chat.commit()
    conn_settings.close()
    conn_chat.close()
    
    print(f"[{datetime.now()}] Синхронизация завершена: +{count_new} новых, обновлено {count_updated}, всего {len(ad_users)}")
    print("Готово!")

if __name__ == "__main__":
    sync_users()
