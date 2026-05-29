import React, { useState, useEffect } from "react";
import { Plus, X, Trash2, Edit2, RefreshCw, Save } from "lucide-react";

const ITEquipment = ({ getToken, showMessage, userRole, isAdminByGroup, darkMode }) => {
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "pc_component",
    unit: "шт"
  });

  const canManage = userRole === "admin" || userRole === "it_engineer" || isAdminByGroup;

  const fetchEquipmentTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/equipment-types", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setEquipmentTypes(data.types || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const saveItem = async () => {
    if (!formData.name.trim()) {
      showMessage("Введите название", "error");
      return;
    }

    const formBody = new FormData();
    formBody.append("name", formData.name);
    formBody.append("category", formData.category);
    formBody.append("unit", formData.unit);

    const url = editingItem
      ? `/api/admin/equipment-types/${editingItem.id}`
      : "/api/admin/equipment-types";
    const method = editingItem ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formBody
      });
      if (res.ok) {
        showMessage(editingItem ? "✅ Тип обновлён" : "✅ Тип добавлен");
        resetForm();
        await fetchEquipmentTypes();
      } else {
        showMessage("Ошибка сохранения", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Удалить тип комплектующего?")) return;
    try {
      const res = await fetch(`/api/admin/equipment-types/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Тип удалён");
        await fetchEquipmentTypes();
      }
    } catch (err) {
      showMessage("Ошибка удаления", "error");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", category: "pc_component", unit: "шт" });
    setEditingItem(null);
    setShowForm(false);
  };

  const editItem = (item) => {
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit
    });
    setEditingItem(item);
    setShowForm(true);
  };

  useEffect(() => {
    fetchEquipmentTypes();
  }, []);

  if (!canManage) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: darkMode ? "#f1f5f9" : "#1e293b" }}>
        <h2>Доступ запрещен</h2>
        <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Только IT-инженеры и администраторы могут управлять комплектующими</p>
      </div>
    );
  }

  const getCategoryLabel = (category) => {
    switch(category) {
      case "pc_component": return "💻 Комплектующие ПК";
      case "printer": return "🖨️ Расходники принтеров";
      case "network": return "🌐 Сетевое оборудование";
      default: return category;
    }
  };

  const styles = {
    card: { 
      background: darkMode ? "#1e293b" : "white", 
      borderRadius: 16, 
      border: darkMode ? "1px solid #475569" : "1px solid #e2e8f0", 
      overflow: "hidden" 
    },
    cardHeader: {
      padding: "16px 20px",
      borderBottom: darkMode ? "1px solid #475569" : "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: darkMode ? "#0f172a" : "#f8fafc",
      flexWrap: "wrap",
      gap: 10,
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { 
      textAlign: "left", 
      padding: "12px 16px", 
      borderBottom: darkMode ? "1px solid #475569" : "1px solid #e2e8f0", 
      fontWeight: 600, 
      fontSize: 13,
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    td: { 
      padding: "12px 16px", 
      borderBottom: darkMode ? "1px solid #334155" : "1px solid #e2e8f0", 
      fontSize: 13,
      color: darkMode ? "#cbd5e1" : "#1e293b"
    },
    buttonPrimary: { 
      background: "#3b82f6", 
      color: "white", 
      border: "none", 
      padding: "6px 12px", 
      borderRadius: 6, 
      cursor: "pointer", 
      fontSize: 12, 
      display: "inline-flex", 
      alignItems: "center", 
      gap: 4 
    },
    buttonIcon: { 
      background: "none", 
      border: "none", 
      cursor: "pointer", 
      padding: 4, 
      borderRadius: 6, 
      display: "inline-flex", 
      alignItems: "center",
      color: darkMode ? "#94a3b8" : "#64748b"
    },
    input: {
      width: "100%",
      padding: "8px 12px",
      border: darkMode ? "1px solid #475569" : "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      boxSizing: "border-box",
      background: darkMode ? "#0f172a" : "white",
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    select: {
      width: "100%",
      padding: "8px 12px",
      border: darkMode ? "1px solid #475569" : "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      background: darkMode ? "#0f172a" : "white",
      color: darkMode ? "#f1f5f9" : "#1e293b"
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
      background: darkMode ? "#1e293b" : "white", 
      borderRadius: 20, 
      padding: 24, 
      width: 450, 
      maxWidth: "90%",
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    badge: { display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 },
    badgePc: { background: "#3b82f620", color: "#3b82f6" },
    badgePrinter: { background: "#10b98120", color: "#10b981" },
    badgeNetwork: { background: "#8b5cf620", color: "#8b5cf6" }
  };

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={{ margin: 0, fontSize: 16, color: darkMode ? "#f1f5f9" : "#1e293b" }}>🔧 Типы комплектующих</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchEquipmentTypes} style={styles.buttonIcon} title="Обновить">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} style={styles.buttonPrimary}>
              <Plus size={14} /> Добавить тип
            </button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: darkMode ? "#94a3b8" : "#64748b" }}>Загрузка...</div>
        ) : equipmentTypes.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: darkMode ? "#94a3b8" : "#64748b" }}>
            <p>Нет типов комплектующих</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Название</th>
                  <th style={styles.th}>Категория</th>
                  <th style={styles.th}>Ед. измерения</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {equipmentTypes.map(item => (
                  <tr key={item.id}>
                    <td style={styles.td}><strong>{item.name}</strong></td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(item.category === "pc_component" ? styles.badgePc :
                          item.category === "printer" ? styles.badgePrinter : styles.badgeNetwork)
                      }}>
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td style={styles.td}>{item.unit}</td>
                    <td style={styles.td}>
                      <button onClick={() => editItem(item)} style={styles.buttonIcon}><Edit2 size={14} /></button>
                      <button onClick={() => deleteItem(item.id)} style={{ ...styles.buttonIcon, color: "#dc2626" }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>{editingItem ? "✏️ Редактировать тип" : "➕ Новый тип"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: darkMode ? "#94a3b8" : "#64748b" }}>✕</button>
            </div>
            
            <input
              type="text"
              placeholder="Название *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
            />
            
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              style={styles.select}
            >
              <option value="pc_component">💻 Комплектующие ПК</option>
              <option value="printer">🖨️ Расходники принтеров</option>
              <option value="network">🌐 Сетевое оборудование</option>
            </select>
            
            <input
              type="text"
              placeholder="Единица измерения (шт, ГБ, м)"
              value={formData.unit}
              onChange={e => setFormData({ ...formData, unit: e.target.value })}
              style={styles.input}
            />
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 20px", border: darkMode ? "1px solid #475569" : "1px solid #e2e8f0", borderRadius: 8, background: darkMode ? "#0f172a" : "white", cursor: "pointer", color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                Отмена
              </button>
              <button onClick={saveItem} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>
                <Save size={14} /> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITEquipment;