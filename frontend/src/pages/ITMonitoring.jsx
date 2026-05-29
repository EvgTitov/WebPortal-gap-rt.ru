import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { RefreshCw, AlertCircle, CheckCircle, LayoutDashboard, CalendarRange, Users, X, UserPlus, Download } from "lucide-react";

const ITMonitoring = ({ showMessage, darkMode }) => {
  const { token, isAdmin, isITEngineer } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filter, setFilter] = useState("current");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Состояния для сотрудников
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usersSearch, setUsersSearch] = useState("");
  
  // Состояния для сортировки выполненных задач (внутри статистики сотрудника)
  const [executedSort, setExecutedSort] = useState("all");
  
  // Состояние для просмотра списка задач из подкнопок карточки "Выполнено"
  const [viewTasksType, setViewTasksType] = useState(null); // 'onTime', 'overdue'

  const canView = isAdmin; // ТОЛЬКО АДМИНИСТРАТОРЫ, IT-инженеры не видят
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
    card: { background: bgColor, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden" },
    header: { padding: "16px 20px", borderBottom: `1px solid ${borderColor}`, background: headerBg, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, color: textColor },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: 20 },
    statCard: { background: bgColor, borderRadius: 12, padding: 16, border: `1px solid ${borderColor}`, textAlign: "center", cursor: "pointer", transition: "all 0.2s", color: textColor },
    statCardActive: { border: "2px solid #3b82f6", background: darkMode ? "rgba(59,130,246,0.15)" : "#eff6ff" },
    statValue: { fontSize: 28, fontWeight: 700 },
    statSubRow: { display: "flex", justifyContent: "space-around", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${borderLight}` },
    statSubButton: { background: darkMode ? "#334155" : "#f1f5f9", border: "none", borderRadius: 20, padding: "4px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", color: textColor },
    statSubButtonActive: { background: "#3b82f6", color: "white" },
    filterBar: { padding: "16px 20px", borderBottom: `1px solid ${borderColor}`, background: headerBg, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" },
    filterBtn: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${borderColor}`, background: bgColor, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, color: textColor },
    filterBtnActive: { background: "#3b82f6", color: "white", borderColor: "#3b82f6" },
    employeeSection: { padding: "16px 20px", borderBottom: `1px solid ${borderColor}`, background: headerBg },
    employeeSelectWrapper: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
    employeeSelect: { padding: "8px 16px", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 14, minWidth: 250, background: bgColor, color: textColor },
    addButton: { background: "#3b82f6", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 },
    sortButtons: { display: "flex", gap: 8, marginTop: 12, marginBottom: 16, flexWrap: "wrap" },
    sortBtn: { padding: "6px 14px", borderRadius: 20, border: `1px solid ${borderColor}`, background: bgColor, cursor: "pointer", fontSize: 12, transition: "all 0.2s", color: textColor },
    sortBtnActive: { background: "#3b82f6", color: "white", borderColor: "#3b82f6" },
    statsTable: { width: "100%", borderCollapse: "collapse", marginBottom: 20 },
    statsTh: { padding: "10px 12px", textAlign: "left", background: headerBg, borderBottom: `1px solid ${borderColor}`, fontSize: 13, fontWeight: 600, color: textColor },
    statsTd: { padding: "10px 12px", borderBottom: `1px solid ${borderLight}`, fontSize: 13, color: textColor },
    taskItem: { padding: "16px 20px", borderBottom: `1px solid ${borderLight}` },
    taskItemOverdue: { background: darkMode ? "rgba(239,68,68,0.15)" : "#fef2f2", borderLeft: "4px solid #ef4444" },
    taskTitle: { fontWeight: 600, marginBottom: 8, fontSize: 15, color: textColor },
    taskMeta: { fontSize: 12, color: textMuted, display: "flex", gap: 16, flexWrap: "wrap" },
    buttonSecondary: { background: "#64748b", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
    statusBadge: { display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 500, marginLeft: 8 },
    dateInput: { padding: 6, borderRadius: 6, border: `1px solid ${borderColor}`, width: 110, background: inputBg, color: textColor },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalContent: { background: bgColor, borderRadius: 20, padding: 24, width: 600, maxWidth: "90%", maxHeight: "80vh", overflowY: "auto", color: textColor },
    searchInput: { width: "100%", padding: "10px 12px", border: `1px solid ${borderColor}`, borderRadius: 8, marginBottom: 16, background: inputBg, color: textColor },
    userItem: { padding: "10px 12px", borderBottom: `1px solid ${borderLight}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: textColor },
    tasksList: { padding: "20px", borderTop: `1px solid ${borderColor}`, background: darkMode ? "#0f172a" : "#fafafa" }
  };

  // Проверка доступа - только администраторы
  if (!canView) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <AlertCircle size={48} style={{ color: "#ef4444", marginBottom: 16 }} />
        <h2 style={{ color: textColor }}>Доступ запрещен</h2>
        <p style={{ color: textMuted }}>Только администраторы могут просматривать мониторинг задач</p>
      </div>
    );
  }

  // Получение авторизованных пользователей
  const fetchAuthorizedUsers = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/users/authorized?limit=100", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAvailableUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Получение сохранённых сотрудников из localStorage (пустой список по умолчанию)
  const loadEmployees = () => {
    const username = localStorage.getItem("username") || "default";
    const saved = localStorage.getItem(`monitoring_employees_${username}`);
    if (saved) {
      setEmployees(JSON.parse(saved));
    } else {
      // Пустой массив - без предустановленных сотрудников
      setEmployees([]);
      localStorage.setItem(`monitoring_employees_${username}`, JSON.stringify([]));
    }
  };

  // Сохранение сотрудников
  const saveEmployees = (newEmployees) => {
    const username = localStorage.getItem("username") || "default";
    setEmployees(newEmployees);
    localStorage.setItem(`monitoring_employees_${username}`, JSON.stringify(newEmployees));
  };

  // Добавление сотрудника
  const addEmployee = (employeeName) => {
    if (!employeeName || employees.includes(employeeName)) {
      showMessage("❌ Сотрудник уже добавлен или имя не указано", "error");
      return;
    }
    const newEmployees = [...employees, employeeName];
    saveEmployees(newEmployees);
    setShowAddEmployeeModal(false);
    setUsersSearch("");
    showMessage(`✅ Сотрудник "${employeeName}" добавлен`);
  };

  // Удаление сотрудника
  const removeEmployee = (employeeName) => {
    if (confirm(`Удалить сотрудника "${employeeName}"?`)) {
      const newEmployees = employees.filter(e => e !== employeeName);
      saveEmployees(newEmployees);
      if (selectedEmployee === employeeName) {
        setSelectedEmployee(null);
      }
      showMessage(`🗑️ Сотрудник "${employeeName}" удалён`);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/it-tasks?archived=false", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        const archivedRes = await fetch("/api/it-tasks?archived=true", {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const archivedData = await archivedRes.json();
        const allTasks = [...(data.tasks || []), ...(archivedData.tasks || [])];
        setTasks(allTasks);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    fetchAuthorizedUsers();
    loadEmployees();
  }, []);

  // Нормализация даты (обнуление времени)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Функция проверки просрочки для текущих задач
  const isTaskOverdue = (task) => {
    if (task.is_archived === 1) return false;
    if (!task.due_date) return false;
    const today = normalizeDate(new Date());
    const dueDate = normalizeDate(task.due_date);
    return dueDate < today;
  };

  // Получение статистики по сотруднику (для таблицы в детализации)
  const getEmployeeStats = (employeeName) => {
    const employeeTasks = tasks.filter(t => t.executor === employeeName);
    const total = employeeTasks.length;
    const completed = employeeTasks.filter(t => t.is_archived === 1).length;
    const onTime = employeeTasks.filter(t => {
      if (t.is_archived !== 1) return false;
      if (!t.due_date || !t.completed_date) return false;
      return normalizeDate(t.completed_date) <= normalizeDate(t.due_date);
    }).length;
    const overdue = employeeTasks.filter(t => {
      if (t.is_archived !== 1) return false;
      if (!t.due_date || !t.completed_date) return false;
      return normalizeDate(t.completed_date) > normalizeDate(t.due_date);
    }).length;
    const inProgress = employeeTasks.filter(t => t.is_archived !== 1).length;
    const overduePending = employeeTasks.filter(t => {
      if (t.is_archived === 1) return false;
      if (!t.due_date) return false;
      return normalizeDate(new Date()) > normalizeDate(t.due_date);
    }).length;
    
    let displayTasks = employeeTasks;
    if (executedSort === "on_time") {
      displayTasks = employeeTasks.filter(t => {
        if (t.is_archived !== 1) return false;
        if (!t.due_date || !t.completed_date) return false;
        return normalizeDate(t.completed_date) <= normalizeDate(t.due_date);
      });
    } else if (executedSort === "overdue") {
      displayTasks = employeeTasks.filter(t => {
        if (t.is_archived !== 1) return false;
        if (!t.due_date || !t.completed_date) return false;
        return normalizeDate(t.completed_date) > normalizeDate(t.due_date);
      });
    } else if (executedSort === "in_progress") {
      displayTasks = employeeTasks.filter(t => t.is_archived !== 1);
    }
    
    return { total, completed, onTime, overdue, inProgress, overduePending, displayTasks };
  };

  // Получение задач для подкнопок (только по всем сотрудникам)
  const getOverallTasksByType = (type) => {
    // Берём все выполненные задачи из архива, у которых есть обе даты
    const completedTasksWithDates = tasks.filter(t => t.is_archived === 1 && t.due_date && t.completed_date);
    
    if (type === "onTime") {
      return completedTasksWithDates.filter(t => {
        return normalizeDate(t.completed_date) <= normalizeDate(t.due_date);
      });
    } else if (type === "overdue") {
      return completedTasksWithDates.filter(t => {
        return normalizeDate(t.completed_date) > normalizeDate(t.due_date);
      });
    }
    return [];
  };

  // Экспорт отчёта
  const exportReport = () => {
    const stats = employees.map(emp => {
      const { total, completed, onTime, overdue, inProgress, overduePending } = getEmployeeStats(emp);
      return {
        "Исполнитель": emp,
        "Всего задач": total,
        "Выполнено": completed,
        "В срок": onTime,
        "Не в срок": overdue,
        "В работе": inProgress,
        "Просрочено": overduePending
      };
    });
    
    const totalStats = stats.reduce((acc, s) => ({
      "Всего задач": acc["Всего задач"] + s["Всего задач"],
      "Выполнено": acc["Выполнено"] + s["Выполнено"],
      "В срок": acc["В срок"] + s["В срок"],
      "Не в срок": acc["Не в срок"] + s["Не в срок"],
      "В работе": acc["В работе"] + s["В работе"],
      "Просрочено": acc["Просрочено"] + s["Просрочено"]
    }), {
      "Всего задач": 0, "Выполнено": 0, "В срок": 0, "Не в срок": 0,
      "В работе": 0, "Просрочено": 0
    });
    
    stats.push({ "Исполнитель": "ИТОГО", ...totalStats });
    
    const csv = [Object.keys(stats[0]).join(";"), ...stats.map(s => Object.values(s).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `monitoring_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showMessage("📊 Отчёт экспортирован");
  };

  // Фильтрация основного списка
  useEffect(() => {
    let filtered = [...tasks];
    
    if (selectedEmployee) {
      filtered = filtered.filter(t => t.executor === selectedEmployee);
    }
    
    if (filter === "current") {
      filtered = filtered.filter(t => t.is_archived !== 1);
    } else if (filter === "overdue") {
      filtered = filtered.filter(t => {
        if (t.is_archived === 1) return false;
        if (!t.due_date) return false;
        return normalizeDate(new Date()) > normalizeDate(t.due_date);
      });
    } else if (filter === "completed") {
      filtered = filtered.filter(t => t.is_archived === 1);
    } else if (filter === "interval") {
      if (startDate && endDate) {
        filtered = filtered.filter(t => {
          const created = new Date(t.created_date);
          return created >= new Date(startDate) && created <= new Date(endDate);
        });
      } else {
        filtered = filtered.filter(t => t.is_archived !== 1);
      }
    }
    setFilteredTasks(filtered);
  }, [tasks, filter, startDate, endDate, selectedEmployee]);

  // Базовые статистики для карточек
  const activeTasks = tasks.filter(t => t.is_archived !== 1);
  const overdueCount = activeTasks.filter(t => {
    if (!t.due_date) return false;
    return normalizeDate(new Date()) > normalizeDate(t.due_date);
  }).length;
  const completedTasks = tasks.filter(t => t.is_archived === 1);
  const completedCount = completedTasks.length;
  
  // Вычисляем задачи "В срок" и "Не в срок" ТОЛЬКО из задач, у которых есть обе даты
  const completedTasksWithDates = completedTasks.filter(t => t.due_date && t.completed_date);
  const completedOnTime = completedTasksWithDates.filter(t => {
    return normalizeDate(t.completed_date) <= normalizeDate(t.due_date);
  }).length;
  const completedOverdue = completedTasksWithDates.filter(t => {
    return normalizeDate(t.completed_date) > normalizeDate(t.due_date);
  }).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("ru-RU");
  };

  const handleDateInput = (e, setter) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);
    let formatted = "";
    if (val.length >= 1) {
      formatted = val.slice(0, 2);
      if (val.length >= 3) formatted += "." + val.slice(2, 4);
      if (val.length >= 5) formatted += "." + val.slice(4, 8);
    }
    if (formatted.length >= 2) {
      const day = parseInt(formatted.slice(0, 2));
      if (day > 31) return;
    }
    if (formatted.length >= 5) {
      const month = parseInt(formatted.slice(3, 5));
      if (month > 12) return;
    }
    e.target.value = formatted;
    setter(formatted);
  };

  const selectedEmployeeStats = selectedEmployee ? getEmployeeStats(selectedEmployee) : null;
  const modalTasks = viewTasksType ? getOverallTasksByType(viewTasksType) : [];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ color: textColor }}>📊 Мониторинг задач</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportReport} style={styles.buttonSecondary}>
              <Download size={14} /> Экспорт
            </button>
            <button onClick={fetchTasks} style={styles.buttonSecondary}>
              <RefreshCw size={14} /> Обновить
            </button>
          </div>
        </div>

        {/* Три основные карточки */}
        <div style={styles.statsGrid}>
          <div onClick={() => setFilter("current")} style={{...styles.statCard, ...(filter === "current" ? styles.statCardActive : {})}}>
            <div style={{...styles.statValue, color: "#3b82f6"}}>{activeTasks.length}</div>
            <div>📋 В работе</div>
          </div>

          <div onClick={() => setFilter("overdue")} style={{...styles.statCard, ...(filter === "overdue" ? styles.statCardActive : {})}}>
            <div style={{...styles.statValue, color: "#ef4444"}}>{overdueCount}</div>
            <div>⚠️ Просрочено</div>
          </div>

          <div onClick={() => setFilter("completed")} style={{...styles.statCard, ...(filter === "completed" ? styles.statCardActive : {})}}>
            <div style={{...styles.statValue, color: "#10b981"}}>{completedCount}</div>
            <div>✅ Выполнено</div>
            <div style={styles.statSubRow}>
              <button 
                onClick={(e) => { e.stopPropagation(); setViewTasksType("onTime"); }}
                style={styles.statSubButton}
              >
                🟢 В срок ({completedOnTime})
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setViewTasksType("overdue"); }}
                style={styles.statSubButton}
              >
                🔴 Не в срок ({completedOverdue})
              </button>
            </div>
          </div>
        </div>

        {/* Блок выбора сотрудника */}
        <div style={styles.employeeSection}>
          <div style={styles.employeeSelectWrapper}>
            <Users size={18} style={{ color: textMuted }} />
            <select 
              value={selectedEmployee || ""} 
              onChange={e => setSelectedEmployee(e.target.value || null)}
              style={styles.employeeSelect}
            >
              <option value="">-- Все сотрудники --</option>
              {employees.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
            <button onClick={() => setShowAddEmployeeModal(true)} style={styles.addButton}>
              <UserPlus size={14} /> Добавить сотрудника
            </button>
          </div>
        </div>

        {/* Фильтры по статусу */}
        <div style={styles.filterBar}>
          <button onClick={() => setFilter("current")} style={{...styles.filterBtn, ...(filter === "current" ? styles.filterBtnActive : {})}}><LayoutDashboard size={14} /> В работе</button>
          <button onClick={() => setFilter("overdue")} style={{...styles.filterBtn, ...(filter === "overdue" ? styles.filterBtnActive : {})}}><AlertCircle size={14} /> Просрочено</button>
          <button onClick={() => setFilter("completed")} style={{...styles.filterBtn, ...(filter === "completed" ? styles.filterBtnActive : {})}}><CheckCircle size={14} /> Выполнено</button>
          <button onClick={() => setFilter("interval")} style={{...styles.filterBtn, ...(filter === "interval" ? styles.filterBtnActive : {})}}><CalendarRange size={14} /> По датам создания</button>
          
          {filter === "interval" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: textMuted }}>с</span>
              <input type="text" placeholder="ДД.ММ.ГГГГ" value={startDate} maxLength={10} onInput={(e) => handleDateInput(e, setStartDate)} style={styles.dateInput} />
              <span style={{ fontSize: 13, color: textMuted }}>по</span>
              <input type="text" placeholder="ДД.ММ.ГГГГ" value={endDate} maxLength={10} onInput={(e) => handleDateInput(e, setEndDate)} style={styles.dateInput} />
            </div>
          )}
        </div>

        {/* Статистика по выбранному сотруднику */}
        {selectedEmployee && selectedEmployeeStats && (
          <div style={{ padding: "0 20px" }}>
            <h4 style={{ margin: "16px 0 12px 0", fontSize: 16, color: textColor }}>📊 Статистика сотрудника: {selectedEmployee}</h4>
            <table style={styles.statsTable}>
              <thead>
                <tr><th style={styles.statsTh}>Показатель</th><th style={styles.statsTh}>Значение</th></tr>
              </thead>
              <tbody>
                <tr><td style={styles.statsTd}>📊 Всего задач</td><td style={styles.statsTd}><strong>{selectedEmployeeStats.total}</strong></td></tr>
                <tr><td style={styles.statsTd}>✅ Выполнено</td><td style={styles.statsTd}><strong style={{ color: "#10b981" }}>{selectedEmployeeStats.completed}</strong></td></tr>
                <tr><td style={styles.statsTd}>🟢 Выполнено в срок</td><td style={styles.statsTd}>{selectedEmployeeStats.onTime}</td></tr>
                <tr><td style={styles.statsTd}>🔴 Выполнено не в срок</td><td style={styles.statsTd}>{selectedEmployeeStats.overdue}</td></tr>
                <tr><td style={styles.statsTd}>⏳ В работе</td><td style={styles.statsTd}>{selectedEmployeeStats.inProgress}</td></tr>
                <tr><td style={styles.statsTd}>⚠️ Просрочено</td><td style={styles.statsTd}>{selectedEmployeeStats.overduePending}</td></tr>
              </tbody>
            </table>

            <div style={styles.sortButtons}>
              <button onClick={() => setExecutedSort("all")} style={{ ...styles.sortBtn, ...(executedSort === "all" ? styles.sortBtnActive : {}) }}>📋 Все ({selectedEmployeeStats.total})</button>
              <button onClick={() => setExecutedSort("on_time")} style={{ ...styles.sortBtn, ...(executedSort === "on_time" ? styles.sortBtnActive : {}) }}>✅ В срок ({selectedEmployeeStats.onTime})</button>
              <button onClick={() => setExecutedSort("overdue")} style={{ ...styles.sortBtn, ...(executedSort === "overdue" ? styles.sortBtnActive : {}) }}>⚠️ Не в срок ({selectedEmployeeStats.overdue})</button>
              <button onClick={() => setExecutedSort("in_progress")} style={{ ...styles.sortBtn, ...(executedSort === "in_progress" ? styles.sortBtnActive : {}) }}>⏳ В работе ({selectedEmployeeStats.inProgress})</button>
            </div>

            <div style={styles.tasksList}>
              <h4 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: textColor }}>
                📋 Список задач 
                {executedSort === "on_time" && "(выполненные в срок)"}
                {executedSort === "overdue" && "(выполненные не в срок)"}
                {executedSort === "in_progress" && "(в работе)"}
                {executedSort === "all" && "(все задачи)"}
              </h4>
              {selectedEmployeeStats.displayTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: textMuted }}>Нет задач для отображения</div>
              ) : (
                selectedEmployeeStats.displayTasks.map(task => {
                  const isCompleted = task.is_archived === 1;
                  const isOnTime = isCompleted && task.due_date && task.completed_date && normalizeDate(task.completed_date) <= normalizeDate(task.due_date);
                  const isPendingOverdue = !isCompleted && task.due_date && normalizeDate(new Date()) > normalizeDate(task.due_date);
                  
                  let statusBadge = null;
                  if (isOnTime) statusBadge = <span style={{...styles.statusBadge, background: "#10b98120", color: "#10b981"}}>✅ В срок</span>;
                  else if (isCompleted && !isOnTime) statusBadge = <span style={{...styles.statusBadge, background: "#ef444420", color: "#ef4444"}}>⚠️ Не в срок</span>;
                  else if (isPendingOverdue) statusBadge = <span style={{...styles.statusBadge, background: "#ef444420", color: "#ef4444"}}>⏰ Просрочена</span>;
                  else if (!isCompleted) statusBadge = <span style={{...styles.statusBadge, background: "#f59e0b20", color: "#f59e0b"}}>⏳ В работе</span>;
                  
                  return (
                    <div key={task.id} style={styles.taskItem}>
                      <div style={styles.taskTitle}>
                        {task.title}
                        {statusBadge}
                        {task.monitoring_id && <span style={{...styles.statusBadge, background: "#8b5cf620", color: "#8b5cf6"}}>🔄 Авто</span>}
                      </div>
                      <div style={styles.taskMeta}>
                        {task.due_date && <span>📅 Срок: {formatDate(task.due_date)}</span>}
                        {task.completed_date && <span>✅ Выполнена: {formatDate(task.completed_date)}</span>}
                        {task.assigned_to && <span>👤 Кому: {task.assigned_to}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Общий список задач (когда сотрудник не выбран) */}
        {!selectedEmployee && (
          <>
            {loading ? (
              <div style={{ padding: 60, textAlign: "center", color: textMuted }}>Загрузка...</div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: textMuted }}>Нет задач</div>
            ) : (
              filteredTasks.map(task => {
                const overdue = isTaskOverdue(task);
                return (
                  <div key={task.id} style={{ ...styles.taskItem, ...(overdue ? styles.taskItemOverdue : {}) }}>
                    <div style={styles.taskTitle}>
                      {task.title}
                      {task.is_archived === 1 && <span style={{...styles.statusBadge, background: "#10b98120", color: "#10b981"}}>✅ Выполнена</span>}
                      {overdue && <span style={{...styles.statusBadge, background: "#ef444420", color: "#ef4444"}}>⚠️ Просрочена</span>}
                      {task.monitoring_id && <span style={{...styles.statusBadge, background: "#8b5cf620", color: "#8b5cf6"}}>🔄 Авто</span>}
                    </div>
                    <div style={styles.taskMeta}>
                      {task.due_date && <span>📅 Срок: {formatDate(task.due_date)}</span>}
                      {task.created_date && <span>📅 Создана: {formatDate(task.created_date)}</span>}
                      {task.completed_date && <span>✅ Выполнена: {formatDate(task.completed_date)}</span>}
                      {task.assigned_to && <span>👤 Кому: {task.assigned_to}</span>}
                      {task.executor && <span>🔧 Исполнитель: {task.executor}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Модальное окно для подкнопок "В срок" / "Не в срок" */}
      {viewTasksType && (
        <div style={styles.modalOverlay} onClick={() => setViewTasksType(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: textColor }}>
                {viewTasksType === "onTime" && "🟢 Задачи, выполненные в срок"}
                {viewTasksType === "overdue" && "🔴 Задачи, выполненные не в срок"}
                <span style={{ fontSize: 14, marginLeft: 10, color: textMuted }}>({modalTasks.length})</span>
              </h3>
              <button onClick={() => setViewTasksType(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: textMuted }}>✕</button>
            </div>
            {modalTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: textMuted }}>Нет задач</div>
            ) : (
              modalTasks.map(task => {
                const isOnTime = normalizeDate(task.completed_date) <= normalizeDate(task.due_date);
                const statusBadge = isOnTime 
                  ? <span style={{...styles.statusBadge, background: "#10b98120", color: "#10b981"}}>✅ В срок</span>
                  : <span style={{...styles.statusBadge, background: "#ef444420", color: "#ef4444"}}>⚠️ Не в срок</span>;
                return (
                  <div key={task.id} style={styles.taskItem}>
                    <div style={styles.taskTitle}>
                      {task.title}
                      {statusBadge}
                      {task.executor && <span style={{...styles.statusBadge, background: darkMode ? "#334155" : "#e2e8f0", color: textMuted}}>👤 {task.executor}</span>}
                    </div>
                    <div style={styles.taskMeta}>
                      {task.due_date && <span>📅 Срок: {formatDate(task.due_date)}</span>}
                      {task.completed_date && <span>✅ Выполнена: {formatDate(task.completed_date)}</span>}
                      {task.assigned_to && <span>👤 Кому: {task.assigned_to}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Модальное окно добавления сотрудника */}
      {showAddEmployeeModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddEmployeeModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: textColor }}>➕ Добавить сотрудника</h3>
              <button onClick={() => setShowAddEmployeeModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: textMuted }}>✕</button>
            </div>
            <input 
              type="text" 
              placeholder="🔍 Поиск сотрудников..." 
              value={usersSearch} 
              onChange={e => setUsersSearch(e.target.value)} 
              style={styles.searchInput} 
            />
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {availableUsers.filter(u => 
                u.display_name?.toLowerCase().includes(usersSearch.toLowerCase()) ||
                u.username?.toLowerCase().includes(usersSearch.toLowerCase())
              ).length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: textMuted }}>Нет доступных пользователей</div>
              ) : (
                availableUsers.filter(u => 
                  u.display_name?.toLowerCase().includes(usersSearch.toLowerCase()) ||
                  u.username?.toLowerCase().includes(usersSearch.toLowerCase())
                ).map(user => (
                  <div key={user.username} style={styles.userItem} onClick={() => addEmployee(user.display_name || user.username)}>
                    <span>👤 {user.display_name || user.username}</span>
                    <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}>+ Добавить</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITMonitoring;