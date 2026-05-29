import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';

const ToastNotification = ({ getToken, darkMode }) => {
  const [notifications, setNotifications] = useState([]);
  const shownIds = React.useRef(new Set());

  const fetchToasts = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const res = await fetch('/api/notifications/toast', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.notifications && data.notifications.length > 0) {
        // Добавляем только те тосты, которых ещё нет
        const newToasts = data.notifications.filter(n => !shownIds.current.has(n.id));
        if (newToasts.length > 0) {
          newToasts.forEach(n => shownIds.current.add(n.id));
          setNotifications(prev => [...prev, ...newToasts]);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки тостов:', err);
    }
  };

  useEffect(() => {
    fetchToasts();
    const interval = setInterval(fetchToasts, 10000);
    return () => clearInterval(interval);
  }, [getToken]);

  const closeNotification = async (id) => {
    const token = getToken();
    try {
      await fetch(`/api/notifications/toast/${id}/shown`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      shownIds.current.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Ошибка закрытия тоста:', err);
    }
  };

  const getEventTypeLabel = (type) => {
    const types = {
      'meeting': 'Совещание',
      'vks': 'ВКС',
      'deadline': 'Задача',
      'replacement': 'Замена'
    };
    return types[type] || 'Событие';
  };

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 380,
      width: 'calc(100% - 40px)'
    }}>
      {notifications.map((notif) => (
        <div
          key={notif.id}
          style={{
            background: darkMode ? '#1e293b' : '#ffffff',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: darkMode ? '1px solid #475569' : '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div style={{
            background: '#f59e0b',
            padding: '10px 14px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} />
              <span>НАПОМИНАНИЕ</span>
            </div>
            <button
              onClick={() => closeNotification(notif.id)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 6,
                padding: 4,
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              У вас событие {notif.remind_before === 15 ? 'через 15 минут' : 
                notif.remind_before === 30 ? 'через 30 минут' : 
                notif.remind_before === 60 ? 'через 1 час' : 'завтра'}!
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {notif.title}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              🕐 {notif.event_time}
            </div>
            {notif.location && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                📍 {notif.location}
              </div>
            )}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastNotification;
