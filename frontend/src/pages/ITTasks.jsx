import React, { useState, useEffect } from "react";
import { 
  Plus, X, Trash2, Edit2, CheckCircle, RefreshCw, Save, 
  Calendar, User, Wrench, Archive, Filter 
} from "lucide-react";
import UserSearchInput from "../components/UserSearchInput";

const ITTasks = ({ getToken, showMessage, userRole, isAdminByGroup }) => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
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

  const categoriesWithComponents = ["🖥️ Сборка ПК", "🔧 Ремонт", "🖨️ Принтеры/МФУ"];

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/it-tasks?archived=${showArchived}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setTasks(data.tasks || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://192.168.7.103:8000/api/task-categories", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch (err) { console.error(err); }
  };

  const fetchEquipmentTypes = async () => {
    try {
      const res = await fetch("http://192.168.7.103:8000/api/admin/equipment-types", {
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

    const url = editingTask
      ? `http://192.168.7.103:8000/api/it-tasks/${editingTask.id}`
      : "http://192.168.7.103:8000/api/it-tasks";
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
      const res = await fetch(`http://192.168.7.103:8000/api/it-tasks/${task.id}`, {
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

  const deleteTask = async (id) => {
    if (!confirm("Удалить задачу?")) return;
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/it-tasks/${id}`, {
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
    if (userRole === 'admin' || userRole === 'it_engineer' || isAdminByGroup) {
      fetchTasks();
      fetchCategories();
      fetchEquipmentTypes();
    }
  }, [showArchived, userRole, isAdminByGroup]);

  if (userRole !== 'admin' && userRole !== 'it_engineer' && !isAdminByGroup) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Wrench size={48} style={{ color: "#ef4444", marginBottom: 16 }} />
        <h2>Доступ запрещен</h2>
        <p style={{ color: "#64748b" }}>Только IT-инженеры и администраторы могут просматривать задачи</p>
      </div>
    );
  }

  const styles = {
    container: { padding: "20px 24px" },
    card: { background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" },
    cardHeader: {
      padding: "16px 20px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#f8fafc",
      flexWrap: "wrap",
      gap: 10
    },
    taskItem: {
      padding: "16px 20px",
      borderBottom: "1px solid #e2e8f0",
      transition: "background 0.2s",
      cursor: "pointer"
    },
    buttonPrimary: {
      background: "#3b82f6",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    },
    buttonSuccess: {
      background: "#10b981",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    },
    buttonDanger: {
      background: "#ef4444",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    },
    buttonSecondary: {
      background: "#64748b",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    },
    statusBadge: {
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500
    },
    modal: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    modalContent: {
      background: "white",
      borderRadius: 20,
      padding: 24,
      width: 550,
      maxWidth: "90%",
      maxHeight: "85vh",
      overflowY: "auto"
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 12,
      boxSizing: "border-box"
    },
    textarea: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 12,
      boxSizing: "border-box",
      resize: "vertical"
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      background: "white",
      marginBottom: 12
    },
    radioGroup: { display: "flex", gap: 16, marginBottom: 12, alignItems: "center", flexWrap: "wrap" },
    taskTitle: { fontSize: 16, fontWeight: 600, marginBottom: 8 },
    taskMeta: { display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: "#64748b", marginTop: 8 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={{ margin: 0, fontSize: 20 }}>🛠️ Задачи IT-отдела</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchTasks} style={styles.buttonSecondary}>
              <RefreshCw size={14} /> Обновить
            </button>
            <button onClick={() => setShowArchived(!showArchived)} style={styles.buttonSecondary}>
              {showArchived ? <Archive size={14} /> : <Filter size={14} />}
              {showArchived ? " Активные" : " Архив"}
            </button>
            <button onClick={() => { resetForm(); setShowTaskForm(true); }} style={styles.buttonPrimary}>
              <Plus size={14} /> Новая задача
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>Загрузка...</div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
            <Wrench size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Нет задач</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} style={styles.taskItem} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={styles.taskTitle}>{task.title}</span>
                    <span style={{
                      ...styles.statusBadge,
                      background: `${getStatusColor(task.components_status)}20`,
                      color: getStatusColor(task.components_status)
                    }}>
                      {getStatusText(task.components_status)}
                    </span>
                    {task.category_name && (
                      <span style={{
                        ...styles.statusBadge,
                        background: `${task.category_color || "#3b82f6"}20`,
                        color: task.category_color || "#3b82f6"
                      }}>
                        📁 {task.category_name}
                      </span>
                    )}
                    {task.equipment_name && (
                      <span style={{
                        ...styles.statusBadge,
                        background: "#8b5cf620",
                        color: "#8b5cf6"
                      }}>
                        🔧 {task.equipment_name}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{task.description}</div>
                  )}
                  <div style={styles.taskMeta}>
                    {task.assigned_to && <span><User size={12} style={{ display: "inline", marginRight: 4 }} /> Кому: {task.assigned_to}</span>}
                    {task.executor && <span><Wrench size={12} style={{ display: "inline", marginRight: 4 }} /> Исполнитель: {task.executor}</span>}
                    {task.due_date && <span><Calendar size={12} style={{ display: "inline", marginRight: 4 }} /> Срок: {task.due_date}</span>}
                    {task.created_date && <span>📅 Создана: {new Date(task.created_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {!task.is_archived && (
                    <button onClick={() => completeTask(task)} style={styles.buttonSuccess} title="Выполнено">
                      <CheckCircle size={14} /> Выполнено
                    </button>
                  )}
                  <button onClick={() => editTask(task)} style={styles.buttonPrimary}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteTask(task.id)} style={styles.buttonDanger}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showTaskForm && (
        <div 
          style={styles.modal} 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && window.getSelection().toString() === "") {
              setShowTaskForm(false);
            }
          }}
        >
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3>{editingTask ? "✏️ Редактировать задачу" : "➕ Новая задача"}</h3>
              <button onClick={() => setShowTaskForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            
            <input
              type="text"
              placeholder="Название задачи *"
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              style={styles.input}
            />
            
            <textarea
              placeholder="Описание"
              value={taskForm.description}
              onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
              rows={3}
              style={styles.textarea}
            />
            
            <select
              value={taskForm.category_id}
              onChange={e => setTaskForm({ ...taskForm, category_id: e.target.value })}
              style={styles.select}
            >
              <option value="">-- Без категории --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            <UserSearchInput
              value={taskForm.assigned_to}
              onChange={(val) => setTaskForm({ ...taskForm, assigned_to: val })}
              placeholder="Кому выдать (ФИО)"
              getToken={getToken}
            />
            
            <UserSearchInput
              value={taskForm.executor}
              onChange={(val) => setTaskForm({ ...taskForm, executor: val })}
              placeholder="Исполнитель (ФИО)"
              getToken={getToken}
            />
            
            <input
              type="date"
              placeholder="Срок выполнения"
              value={taskForm.due_date}
              onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
              style={styles.input}
            />
            
            {shouldShowComponentsStatus() && (
              <>
                <select
                  value={taskForm.equipment_id}
                  onChange={e => setTaskForm({ ...taskForm, equipment_id: e.target.value })}
                  style={styles.select}
                >
                  <option value="">-- Выберите комплектующее --</option>
                  {equipmentList.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.unit})</option>
                  ))}
                </select>
                
                <div style={styles.radioGroup}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Статус:</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="radio"
                      value="available"
                      checked={taskForm.components_status === "available"}
                      onChange={e => setTaskForm({ ...taskForm, components_status: e.target.value })}
                    /> 🟢 Есть
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="radio"
                      value="partial"
                      checked={taskForm.components_status === "partial"}
                      onChange={e => setTaskForm({ ...taskForm, components_status: e.target.value })}
                    /> 🟡 Не полный
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="radio"
                      value="missing"
                      checked={taskForm.components_status === "missing"}
                      onChange={e => setTaskForm({ ...taskForm, components_status: e.target.value })}
                    /> 🔴 Нет
                  </label>
                </div>
              </>
            )}
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowTaskForm(false)} style={{ padding: "8px 20px", border: "1px solid #e2e8f0", borderRadius: 8, background: "white", cursor: "pointer" }}>
                Отмена
              </button>
              <button onClick={saveTask} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>
                <Save size={14} /> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITTasks;
