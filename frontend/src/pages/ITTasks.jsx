import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { 
  Plus, X, Trash2, Edit2, CheckCircle, RefreshCw, Save, 
  Calendar, User, Wrench, Archive, Filter, FileText, RotateCcw
} from "lucide-react";
import UserSearchInput from "../components/UserSearchInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ITTasks = ({ showMessage, darkMode }) => {
  const { user, token, userRole, isAdmin, isITEngineer } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    category_id: "",
    equipment_id: "",
    assigned_to: "",
    components_status: "missing",
    executor: "",
    due_date: "",
  });

  // Функции для преобразования даты
  const dateToDisplayString = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const displayStringToDate = (str) => {
    if (!str || str.length !== 10) return null;
    const parts = str.split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month, day);
  };

  // Функция для нормализации даты (обнуление времени)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const handleDateKeyDown = (e, setter) => {
    const input = e.target;
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    if (controlKeys.includes(e.key)) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        setTimeout(() => {
          let value = input.value;
          if (value === '' && setter) setter('');
        }, 0);
        return;
      }
      return;
    }
    
    if (!/[\d]/.test(e.key)) {
      e.preventDefault();
      return;
    }
    
    if (/[\d]/.test(e.key)) {
      let currentValue = input.value.replace(/\D/g, "");
      if (currentValue.length >= 8) {
        e.preventDefault();
        return;
      }
      
      setTimeout(() => {
        const rawValue = input.value.replace(/\D/g, "");
        let formatted = "";
        
        if (rawValue.length >= 1) {
          formatted = rawValue.slice(0, 2);
          if (rawValue.length >= 3) formatted += "." + rawValue.slice(2, 4);
          if (rawValue.length >= 5) formatted += "." + rawValue.slice(4, 8);
        }
        
        if (formatted.length >= 2 && rawValue.length >= 2) {
          const day = parseInt(formatted.slice(0, 2));
          if (day > 31) return;
        }
        if (formatted.length >= 5 && rawValue.length >= 4) {
          const month = parseInt(formatted.slice(3, 5));
          if (month > 12) return;
        }
        
        input.value = formatted;
        if (setter) setter(formatted);
      }, 0);
    }
  };

  const categoriesWithComponents = ["🖥️ Сборка ПК", "🔧 Ремонт", "🖨️ Принтеры/МФУ"];
  
  const canManageTasks = isAdmin || isITEngineer;
  const getToken = () => localStorage.getItem("token") || token;

  // Функция сортировки задач по сроку (ближайшие сверху)
  const sortTasksByDueDate = (tasksArray) => {
    return [...tasksArray].sort((a, b) => {
      // Сначала задачи без срока отправляем вниз
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      
      // Сравниваем даты (ближайшая сверху)
      const dateA = normalizeDate(a.due_date);
      const dateB = normalizeDate(b.due_date);
      return dateA - dateB;
    });
  };

  if (!canManageTasks) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: darkMode ? "#f1f5f9" : "#1e293b" }}>
        <Wrench size={48} style={{ color: "#ef4444", marginBottom: 16 }} />
        <h2>Доступ запрещен</h2>
        <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Только IT-инженеры и администраторы могут просматривать задачи</p>
      </div>
    );
  }

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/it-tasks?archived=${showArchived}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        const tasksData = data.tasks || [];
        // СОРТИРОВКА: задачи с ближайшим сроком сверху
        setTasks(sortTasksByDueDate(tasksData));
      }
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

  const fetchEquipmentTypes = async () => {
    try {
      const res = await fetch("/api/admin/equipment-types", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setEquipmentList(data.types || []);
    } catch (err) { console.error(err); }
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) {
      showMessage("Введите название задачи", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", taskForm.title);
    if (taskForm.description) formData.append("description", taskForm.description);
    if (taskForm.category_id) formData.append("category_id", taskForm.category_id);
    if (taskForm.equipment_id) formData.append("equipment_id", taskForm.equipment_id);
    if (taskForm.assigned_to) formData.append("assigned_to", taskForm.assigned_to);
    formData.append("components_status", taskForm.components_status);
    if (taskForm.executor) formData.append("executor", taskForm.executor);
    if (taskForm.due_date) formData.append("due_date", taskForm.due_date);

    const url = editingTask ? `/api/it-tasks/${editingTask.id}` : "/api/it-tasks";
    const method = editingTask ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        showMessage(editingTask ? "✅ Задача обновлена" : "✅ Задача создана");
        resetForm();
        await fetchTasks();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка сохранения", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const completeTask = async (task) => {
    const formData = new FormData();
    formData.append("is_archived", "1");
    
    try {
      const res = await fetch(`/api/it-tasks/${task.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        showMessage("✅ Задача выполнена и отправлена в архив");
        await fetchTasks();
      }
    } catch (err) {
      showMessage("Ошибка", "error");
    }
  };

  const restoreTask = async (taskId) => {
    try {
      const res = await fetch(`/api/it-tasks/${taskId}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("↩️ Задача восстановлена из архива");
        await fetchTasks();
      }
    } catch (err) {
      showMessage("Ошибка восстановления", "error");
    }
  };

  const deleteTask = async (id) => {
    if (!confirm("Удалить задачу?")) return;
    try {
      const res = await fetch(`/api/it-tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Задача удалена");
        await fetchTasks();
      }
    } catch (err) {
      showMessage("Ошибка удаления", "error");
    }
  };

  const generateReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      showMessage("Выберите период для отчета", "error");
      return;
    }
    
    setReportLoading(true);
    try {
      const formData = new FormData();
      formData.append("start_date", reportStartDate);
      formData.append("end_date", reportEndDate);
      
      const res = await fetch("/api/it-tasks/report", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tasks_report_${reportStartDate}_${reportEndDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showMessage("📊 Отчет сформирован и скачан");
        setShowReportModal(false);
        setReportStartDate("");
        setReportEndDate("");
      }
    } catch (err) {
      showMessage("Ошибка формирования отчета", "error");
    }
    setReportLoading(false);
  };

  const resetForm = () => {
    setTaskForm({
      title: "",
      description: "",
      category_id: "",
      equipment_id: "",
      assigned_to: "",
      components_status: "missing",
      executor: "",
      due_date: "",
    });
    setEditingTask(null);
    setShowTaskForm(false);
  };

  const editTask = (task) => {
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      category_id: task.category_id || "",
      equipment_id: task.equipment_id || "",
      assigned_to: task.assigned_to || "",
      components_status: task.components_status || "missing",
      executor: task.executor || "",
      due_date: task.due_date || "",
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "available": return "#10b981";
      case "partial": return "#f59e0b";
      default: return "#ef4444";
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case "available": return "✅ Есть";
      case "partial": return "🟡 Не полный";
      default: return "❌ Нет";
    }
  };

  const shouldShowComponentsStatus = () => {
    if (!taskForm.category_id) return false;
    const selectedCategory = categories.find(c => c.id == taskForm.category_id);
    return selectedCategory && categoriesWithComponents.includes(selectedCategory.name);
  };

  useEffect(() => {
    if (canManageTasks) {
      fetchTasks();
      fetchCategories();
      fetchEquipmentTypes();
    }
  }, [showArchived, canManageTasks]);

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
    card: { background: bgColor, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden", marginBottom: 24 },
    cardHeader: {
      padding: "16px 20px",
      borderBottom: `1px solid ${borderColor}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: headerBg,
      flexWrap: "wrap",
      gap: 10,
      color: textColor
    },
    taskItem: {
      padding: "16px 20px",
      borderBottom: `1px solid ${borderLight}`,
      transition: "background 0.2s",
      cursor: "pointer"
    },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 },
    buttonSuccess: { background: "#10b981", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 },
    buttonDanger: { background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 },
    buttonSecondary: { background: "#64748b", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 },
    buttonInfo: { background: "#8b5cf6", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 },
    statusBadge: { display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 },
    modal: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    modalContent: { background: bgColor, borderRadius: 20, padding: 24, width: 550, maxWidth: "90%", maxHeight: "85vh", overflowY: "auto", color: textColor },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 12,
      boxSizing: "border-box",
      background: inputBg,
      color: textColor
    },
    textarea: {
      width: "100%",
      padding: "10px 12px",
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 12,
      boxSizing: "border-box",
      resize: "vertical",
      background: inputBg,
      color: textColor
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      fontSize: 13,
      background: inputBg,
      color: textColor,
      marginBottom: 12
    },
    radioGroup: { display: "flex", gap: 16, marginBottom: 12, alignItems: "center", flexWrap: "wrap", color: textColor },
    taskTitle: { fontSize: 16, fontWeight: 600, marginBottom: 8, color: textColor },
    taskMeta: { display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: textMuted, marginTop: 8 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={{ margin: 0, fontSize: 18, color: textColor }}>🛠️ Задачи IT-отдела</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={fetchTasks} style={styles.buttonSecondary}><RefreshCw size={14} /> Обновить</button>
            <button onClick={() => setShowArchived(!showArchived)} style={styles.buttonSecondary}>
              {showArchived ? <Archive size={14} /> : <Filter size={14} />}
              {showArchived ? " Активные" : " Архив"}
            </button>
            <button onClick={() => setShowReportModal(true)} style={styles.buttonInfo}><FileText size={14} /> Отчёт</button>
            <button onClick={() => { resetForm(); setShowTaskForm(true); }} style={styles.buttonPrimary}><Plus size={14} /> Новая задача</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: textMuted }}>Загрузка...</div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: textMuted }}>
            <Wrench size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Нет задач</p>
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              style={styles.taskItem} 
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "#334155" : "#f8fafc"} 
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={styles.taskTitle}>{task.title}</span>
                    <span style={{ ...styles.statusBadge, background: `${getStatusColor(task.components_status)}20`, color: getStatusColor(task.components_status) }}>
                      {getStatusText(task.components_status)}
                    </span>
                    {task.category_name && (
                      <span style={{ ...styles.statusBadge, background: `${task.category_color || "#3b82f6"}20`, color: task.category_color || "#3b82f6" }}>
                        📁 {task.category_name}
                      </span>
                    )}
                    {task.equipment_name && (
                      <span style={{ ...styles.statusBadge, background: "#8b5cf620", color: "#8b5cf6" }}>
                        🔧 {task.equipment_name}
                      </span>
                    )}
                    {/* Индикатор срочности */}
                    {task.due_date && !task.is_archived && (
                      (() => {
                        const today = normalizeDate(new Date());
                        const dueDate = normalizeDate(task.due_date);
                        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        if (diffDays < 0) {
                          return <span style={{ ...styles.statusBadge, background: "#ef444420", color: "#ef4444" }}>⚠️ Просрочена</span>;
                        } else if (diffDays <= 3) {
                          return <span style={{ ...styles.statusBadge, background: "#f59e0b20", color: "#f59e0b" }}>⏰ Скоро! {diffDays} дн.</span>;
                        }
                        return null;
                      })()
                    )}
                  </div>
                  {task.description && <div style={{ fontSize: 13, color: textMuted, marginBottom: 8 }}>{task.description}</div>}
                  <div style={styles.taskMeta}>
                    {task.assigned_to && <span><User size={12} style={{ display: "inline", marginRight: 4 }} /> Кому: {task.assigned_to}</span>}
                    {task.executor && <span><Wrench size={12} style={{ display: "inline", marginRight: 4 }} /> Исполнитель: {task.executor}</span>}
                    {task.due_date && <span><Calendar size={12} style={{ display: "inline", marginRight: 4 }} /> Срок: {task.due_date}</span>}
                    {task.created_date && <span>📅 Создана: {new Date(task.created_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {showArchived ? (
                    <button onClick={() => restoreTask(task.id)} style={styles.buttonInfo}><RotateCcw size={14} /> Вернуть</button>
                  ) : (
                    <button onClick={() => completeTask(task)} style={styles.buttonSuccess}><CheckCircle size={14} /> Выполнено</button>
                  )}
                  <button onClick={() => editTask(task)} style={styles.buttonPrimary}><Edit2 size={14} /></button>
                  <button onClick={() => deleteTask(task.id)} style={styles.buttonDanger}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно добавления/редактирования задачи */}
      {showTaskForm && (
        <div style={styles.modal} onMouseDown={(e) => { if (e.target === e.currentTarget) setShowTaskForm(false); }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: textColor }}>{editingTask ? "✏️ Редактировать задачу" : "➕ Новая задача"}</h3>
              <button onClick={() => setShowTaskForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: textMuted }}>✕</button>
            </div>
            
            <input type="text" placeholder="Название задачи *" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} style={styles.input} />
            <textarea placeholder="Описание" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={3} style={styles.textarea} />
            
            <select value={taskForm.category_id} onChange={e => setTaskForm({ ...taskForm, category_id: e.target.value })} style={styles.select}>
              <option value="">-- Без категории --</option>
              {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            
            <UserSearchInput value={taskForm.assigned_to} onChange={(val) => setTaskForm({ ...taskForm, assigned_to: val })} placeholder="Кому выдать (ФИО)" getToken={getToken} />
            <UserSearchInput value={taskForm.executor} onChange={(val) => setTaskForm({ ...taskForm, executor: val })} placeholder="Исполнитель (ФИО)" getToken={getToken} />
            
            <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <DatePicker 
                  selected={displayStringToDate(taskForm.due_date)} 
                  onChange={(date) => { 
                    if (date) { 
                      setTaskForm({ ...taskForm, due_date: dateToDisplayString(date) }); 
                    } else { 
                      setTaskForm({ ...taskForm, due_date: "" }); 
                    } 
                  }} 
                  dateFormat="dd.MM.yyyy" 
                  placeholderText="ДД.ММ.ГГГГ" 
                  className="custom-datepicker" 
                  showMonthDropdown 
                  showYearDropdown 
                  dropdownMode="select" 
                  onKeyDown={(e) => handleDateKeyDown(e, (val) => setTaskForm({ ...taskForm, due_date: val }))} 
                />
              </div>
              {taskForm.due_date && (
                <button type="button" onClick={() => setTaskForm({ ...taskForm, due_date: "" })} style={{ background: "#ef4444", color: "white", border: "none", padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <X size={14} /> Очистить
                </button>
              )}
            </div>
            
            {shouldShowComponentsStatus() && (
              <>
                <select value={taskForm.equipment_id} onChange={e => setTaskForm({ ...taskForm, equipment_id: e.target.value })} style={styles.select}>
                  <option value="">-- Выберите комплектующее --</option>
                  {equipmentList.map(eq => (<option key={eq.id} value={eq.id}>{eq.name} ({eq.unit})</option>))}
                </select>
                
                <div style={styles.radioGroup}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Статус комплектующих:</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="radio" value="available" checked={taskForm.components_status === "available"} onChange={e => setTaskForm({ ...taskForm, components_status: e.target.value })} /> 🟢 Есть</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="radio" value="partial" checked={taskForm.components_status === "partial"} onChange={e => setTaskForm({ ...taskForm, components_status: e.target.value })} /> 🟡 Не полный</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="radio" value="missing" checked={taskForm.components_status === "missing"} onChange={e => setTaskForm({ ...taskForm, components_status: e.target.value })} /> 🔴 Нет</label>
                </div>
              </>
            )}
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowTaskForm(false)} style={{ padding: "8px 20px", border: `1px solid ${borderColor}`, borderRadius: 8, background: inputBg, cursor: "pointer", color: textColor }}>Отмена</button>
              <button onClick={saveTask} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}><Save size={14} /> Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно отчёта */}
      {showReportModal && (
        <div style={styles.modal} onMouseDown={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: textColor }}>📊 Сформировать отчёт</h3>
              <button onClick={() => setShowReportModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: textMuted }}>✕</button>
            </div>
            
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: textMuted }}>Дата начала</label>
            <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <DatePicker 
                  selected={displayStringToDate(reportStartDate)} 
                  onChange={(date) => { 
                    if (date) { 
                      setReportStartDate(dateToDisplayString(date)); 
                    } else { 
                      setReportStartDate(""); 
                    } 
                  }} 
                  dateFormat="dd.MM.yyyy" 
                  placeholderText="ДД.ММ.ГГГГ" 
                  className="custom-datepicker" 
                  showMonthDropdown 
                  showYearDropdown 
                  dropdownMode="select" 
                  onKeyDown={(e) => handleDateKeyDown(e, setReportStartDate)} 
                />
              </div>
              {reportStartDate && (<button type="button" onClick={() => setReportStartDate("")} style={{ background: "#ef4444", color: "white", border: "none", padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}><X size={14} /> Очистить</button>)}
            </div>
            
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: textMuted }}>Дата окончания</label>
            <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <DatePicker 
                  selected={displayStringToDate(reportEndDate)} 
                  onChange={(date) => { 
                    if (date) { 
                      setReportEndDate(dateToDisplayString(date)); 
                    } else { 
                      setReportEndDate(""); 
                    } 
                  }} 
                  dateFormat="dd.MM.yyyy" 
                  placeholderText="ДД.ММ.ГГГГ" 
                  className="custom-datepicker" 
                  showMonthDropdown 
                  showYearDropdown 
                  dropdownMode="select" 
                  onKeyDown={(e) => handleDateKeyDown(e, setReportEndDate)} 
                />
              </div>
              {reportEndDate && (<button type="button" onClick={() => setReportEndDate("")} style={{ background: "#ef4444", color: "white", border: "none", padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}><X size={14} /> Очистить</button>)}
            </div>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowReportModal(false)} style={{ padding: "8px 20px", border: `1px solid ${borderColor}`, borderRadius: 8, background: inputBg, cursor: "pointer", color: textColor }}>Отмена</button>
              <button onClick={generateReport} disabled={reportLoading} style={{ background: "#8b5cf6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>{reportLoading ? "Загрузка..." : "Сформировать"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITTasks;