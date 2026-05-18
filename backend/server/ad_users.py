import ldap3
from ldap3 import Server, Connection, ALL

LDAP_SERVER = '*******'
LDAP_BASE_DN = '******'
LDAP_USER = '******'
LDAP_PASSWORD = '******'

def get_all_ad_users():
    try:
        server = Server(LDAP_SERVER, get_info=ALL)
        conn = Connection(server, LDAP_USER, LDAP_PASSWORD, auto_bind=True)
        
        users = []
        cookie = None
        page = 0
        
        while True:
            page += 1
            # Постраничный поиск
            conn.search(
                search_base=LDAP_BASE_DN,
                search_filter='(sAMAccountName=*)',
                attributes=['sAMAccountName', 'displayName', 'mail'],
                size_limit=0,
                paged_size=500,  # 500 записей на страницу
                paged_cookie=cookie
            )
            
            for entry in conn.entries:
                username = str(entry.sAMAccountName) if hasattr(entry, 'sAMAccountName') and entry.sAMAccountName else None
                if not username or username.endswith('$'):
                    continue
                
                display_name = str(entry.displayName) if hasattr(entry, 'displayName') and entry.displayName else username
                email = str(entry.mail) if hasattr(entry, 'mail') and entry.mail else f'{username}@gap-rt.ru'
                
                users.append({
                    'username': username,
                    'name': display_name,
                    'email': email
                })
            
            # Получаем cookie для следующей страницы
            cookie = conn.result.get('controls', {}).get('1.2.840.113556.1.4.319', {}).get('value', {}).get('cookie')
            if not cookie:
                break
        
        conn.unbind()
        print(f"Loaded {len(users)} users from AD (paginated)")
        
        # Проверяем наличие e.titov
        for u in users:
            if u['username'] == 'e.titov':
                print(f"✅ e.titov НАЙДЕН: {u['username']} - {u['name']}")
                break
        else:
            print("❌ e.titov НЕ НАЙДЕН")
            
        return users
    except Exception as e:
        print(f"LDAP get users error: {e}")
        return []
