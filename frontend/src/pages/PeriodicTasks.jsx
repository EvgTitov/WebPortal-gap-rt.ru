import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { 
  Plus, Trash2, Edit2, RefreshCw, Save, 
  User, Play, Pause, Repeat, Clock
} from "lucide-react";
import UserSearchInput from "../components/UserSearchInput";

const PeriodicTasks = ({ showMessage, darkMode }) => {
  const { token, isAdmin, isITEngineer } = useAuth();
  const [monitoringTasks, setMonitoringTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    title_template: "",
    description_template: "",
    category_id: "",
    assigned_to: "",
    executor: "",
    interval_days: 30,
    is_active: true
  });

  const canManage = isAdmin || isITEngineer;
  const getToken = () => localStorage.getItem("token") || token;

  // Базовые цвета для тёмной/светлой темы
  const bgColor = darkMode ? "#1e293b" : "white";
  const headerBg = darkMode ? "#0f172a" : "#f8fafc";
  const borderColor = darkMode ? "#475569" : "#e2e8f0";
  const borderLight = darkMode ? "#334155" : "#e2e8f0";
  const textColor = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "#0f172a" : "white";

  const styles = {
    container: { padding: "20px 24px" },
    accessDenied: { textAlign: "center", padding: 60, color: textColor },
    card: { background: bgColor, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden" },
    cardHeader: {
      padding: "16px 20px",
      borderBottom: `1px solid ${borderColor}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: headerBg,
      color: textColor
    },
    item: {
      padding: "16px 20px",
      borderBottom: `1px solid ${borderLight}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
      color: textColor
    },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
    buttonSuccess: { background: "#10b981", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
    buttonDanger: { background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
    buttonSecondary: { background: "#64748b", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
    buttonWarning: { background: "#f59e0b", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
    modal: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    modalContent: {
      background: bgColor,
      borderRadius: 20,
      padding: 24,
      width: 500,
      maxWidth: "90%",
      color: textColor
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      marginBottom: 12,
      background: inputBg,
      color: textColor
    },
    textarea: {
      width: "100%",
      padding: "10px 12px",
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      marginBottom: 12,
      background: inputBg,
      color: textColor,
      resize: "vertical"
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      marginBottom: 12,
      background: inputBg,
      color: textColor
    }
  };

  if (!canManage) {
    return (
      <div style={styles.accessDenied}>
        <Clock size={48} style={{ color: "#ef4444", marginBottom: 16 }} />
        <h2>Доступ запрещен</h2>
        <p style={{ color: textMuted }}>Только IT-инженеры и администраторы</p>
      </div>
    );
  }

  const fetchMonitoringTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/it-tasks/monitoring", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setMonitoringTasks(data.monitoring_tasks || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/task-categories", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch (err) { console.error(err); }
  };

  const saveTask = async () => {
    if (!form.title_template.trim()) {
      showMessage("Введите шаблон названия", "error");
      return;
    }

    const url = editing
      ? `/api/it-tasks/monitoring/${editing.id}`
      : "/api/it-tasks/monitoring";
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        showMessage(editing ? "✅ Обновлен" : "✅ Создан");
        resetForm();
        await fetchMonitoringTasks();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const deleteTask = async (id) => {
    if (!confirm("Удалить?")) return;
    try {
      const res = await fetch(`/api/it-tasks/monitoring/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Удалено");
        await fetchMonitoringTasks();
      }
    } catch (err) {
      showMessage("Ошибка", "error");
    }
  };

  const toggleStatus = async (monitoring) => {
    try {
      const res = await fetch(`/api/it-tasks/monitoring/${monitoring.id}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage(monitoring.is_active ? "⏸️ Остановлен" : "▶️ Запущен");
        await fetchMonitoringTasks();
      }
    } catch (err) {
      showMessage("Ошибка", "error");
    }
  };

  const runNow = async (monitoringId) => {
    try {
      const res = await fetch(`/api/it-tasks/monitoring/${monitoringId}/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🔄 Задача создана");
        await fetchMonitoringTasks();
      }
    } catch (err) {
      showMessage("Ошибка", "error");
    }
  };

  const resetForm = () => {
    setForm({
      title_template: "",
      description_template: "",
      category_id: "",
      assigned_to: "",
      executor: "",
      interval_days: 30,
      is_active: true
    });
    setEditing(null);
    setShowForm(false);
  };

  const editItem = (item) => {
    setForm({
      title_template: item.title_template || "",
      description_template: item.description_template || "",
      category_id: item.category_id || "",
      assigned_to: item.assigned_to || "",
      executor: item.executor || "",
      interval_days: item.interval_days || 30,
      is_active: item.is_active === 1
    });
    setEditing(item);
    setShowForm(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ru-RU");
  };

  useEffect(() => {
    fetchMonitoringTasks();
    fetchCategories();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={{ color: textColor }}>🔄 Периодические задачи</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={styles.buttonPrimary}>
            <Plus size={14} /> Добавить
          </button>
        </div>
        
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: textMuted }}>Загрузка...</div>
        ) : monitoringTasks.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: textMuted }}>
            <Clock size={48} style={{ opacity: 0.5 }} />
            <p>Нет периодических задач</p>
          </div>
        ) : (
          monitoringTasks.map(item => (
            <div key={item.id} style={styles.item}>
              <div>
                <div><strong>{item.title_template}</strong></div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
                  Каждые {item.interval_days} дней | {item.is_active ? "🟢 Активен" : "🔴 Остановлен"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => runNow(item.id)} style={styles.buttonWarning}>Запустить</button>
                <button onClick={() => toggleStatus(item)} style={item.is_active ? styles.buttonSecondary : styles.buttonSuccess}>
                  {item.is_active ? "Остановить" : "Запустить"}
                </button>
                <button onClick={() => editItem(item)} style={styles.buttonPrimary}>✏️</button>
                <button onClick={() => deleteTask(item.id)} style={styles.buttonDanger}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div 
          style={styles.modal} 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div style={styles.modalContent} onMouseDown={(e) => e.stopPropagation()}>
            <h3 style={{ color: textColor }}>{editing ? "Редактировать" : "Новая периодическая задача"}</h3>
            <input
              placeholder="Шаблон названия"
              value={form.title_template}
              onChange={e => setForm({...form, title_template: e.target.value})}
              style={styles.input}
            />
            <textarea
              placeholder="Шаблон описания"
              value={form.description_template}
              onChange={e => setForm({...form, description_template: e.target.value})}
              rows={3}
              style={styles.textarea}
            />
            <select
              value={form.category_id}
              onChange={e => setForm({...form, category_id: e.target.value})}
              style={styles.select}
            >
              <option value="">Без категории</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <UserSearchInput
              value={form.assigned_to}
              onChange={val => setForm({...form, assigned_to: val})}
              placeholder="Кому выдать"
              getToken={getToken}
            />
            <UserSearchInput
              value={form.executor}
              onChange={val => setForm({...form, executor: val})}
              placeholder="Исполнитель"
              getToken={getToken}
            />
            <input
              type="number"
              placeholder="Интервал (дней)"
              value={form.interval_days}
              onChange={e => setForm({...form, interval_days: parseInt(e.target.value)})}
              style={styles.input}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: textColor }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm({...form, is_active: e.target.checked})}
              /> Активен
            </label>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={styles.buttonSecondary}>Отмена</button>
              <button onClick={saveTask} style={styles.buttonPrimary}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodicTasks;