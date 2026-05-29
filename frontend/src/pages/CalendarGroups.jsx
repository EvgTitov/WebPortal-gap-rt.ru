import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { Plus, Trash2, Edit2, RefreshCw, Save, X, Users, User, ChevronRight } from "lucide-react";

const CalendarGroups = ({ showMessage }) => {
  const { token, isAdmin } = useAuth();
  const [groups, setGroups] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [adUsersMap, setAdUsersMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    members: []
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const canManage = isAdmin;
  const getToken = () => localStorage.getItem("token") || token;

  if (!canManage) {
    return (
      <div style={styles.accessDenied}>
        <Users size={48} style={{ color: "#ef4444", marginBottom: 16 }} />
        <h2>Доступ запрещен</h2>
        <p>Только администраторы могут управлять группами календаря</p>
      </div>
    );
  }

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/groups", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setGroups(data.groups || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch("/api/calendar/available-users", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setAvailableUsers(data.users || []);
    } catch (err) { console.error(err); }
  };

  const fetchAllAdUsers = async () => {
    try {
      const res = await fetch("/api/users/authorized?query=&limit=500", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok && data.users) {
        const map = {};
        data.users.forEach(u => {
          map[u.username] = u.display_name || u.username;
        });
        setAdUsersMap(map);
      }
    } catch (err) { console.error(err); }
  };

  const saveGroup = async () => {
    if (!form.name.trim()) {
      showMessage("Введите название группы", "error");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    if (form.description) formData.append("description", form.description);
    if (form.members.length > 0) formData.append("members", JSON.stringify(form.members));

    const url = editing ? `/api/calendar/groups/${editing.id}` : "/api/calendar/groups";
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        showMessage(editing ? "✅ Группа обновлена" : "✅ Группа создана");
        resetForm();
        await fetchGroups();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const deleteGroup = async (id) => {
    if (!confirm("Удалить группу?")) return;
    try {
      const res = await fetch(`/api/calendar/groups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Группа удалена");
        await fetchGroups();
      }
    } catch (err) {
      showMessage("Ошибка", "error");
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", members: [] });
    setEditing(null);
    setShowForm(false);
    setSearchQuery("");
  };

  const editGroup = (group) => {
    setForm({
      name: group.name,
      description: group.description || "",
      members: group.members || []
    });
    setEditing(group);
    setShowForm(true);
  };

  const addMember = (username) => {
    if (!form.members.includes(username)) {
      setForm({ ...form, members: [...form.members, username] });
    }
  };

  const removeMember = (username) => {
    setForm({ ...form, members: form.members.filter(m => m !== username) });
  };

  const openMembersModal = (group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
  };

  const filteredUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    fetchGroups();
    fetchAvailableUsers();
    fetchAllAdUsers();
  }, []);

  const styles = {
    container: { padding: "20px 24px" },
    accessDenied: { textAlign: "center", padding: 60 },
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
    groupItem: {
      padding: "16px 20px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
      transition: "background 0.2s",
      cursor: "pointer"
    },
    groupName: {
      fontWeight: 600,
      fontSize: 15,
      marginBottom: 4
    },
    groupDescription: {
      fontSize: 13,
      color: "#64748b",
      marginBottom: 4
    },
    groupMeta: {
      fontSize: 12,
      color: "#94a3b8",
      display: "flex",
      alignItems: "center",
      gap: 4
    },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 },
    buttonDanger: { background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 },
    buttonSecondary: { background: "#64748b", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 },
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
      width: 500,
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
    memberBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 20,
      fontSize: 12,
      background: "#e2e8f0",
      color: "#1e293b"
    },
    memberList: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
      marginBottom: 16
    },
    userList: {
      maxHeight: 200,
      overflowY: "auto",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      marginTop: 8
    },
    userItem: {
      padding: "8px 12px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer"
    },
    memberModalList: {
      maxHeight: 400,
      overflowY: "auto"
    },
    memberModalItem: {
      padding: "12px 16px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={{ margin: 0, fontSize: 18 }}>👥 Группы участников календаря</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchGroups} style={styles.buttonSecondary}>
              <RefreshCw size={14} /> Обновить
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} style={styles.buttonPrimary}>
              <Plus size={14} /> Создать группу
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>Загрузка...</div>
        ) : groups.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
            <Users size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Нет созданных групп</p>
            <p style={{ fontSize: 13 }}>Создайте группу, чтобы добавлять её целиком в события календаря</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} style={styles.groupItem} onClick={() => openMembersModal(group)}>
              <div style={{ flex: 1 }}>
                <div style={styles.groupName}>{group.name}</div>
                {group.description && <div style={styles.groupDescription}>{group.description}</div>}
                <div style={styles.groupMeta}>
                  <Users size={12} />
                  <span>{group.members_count || 0} участников</span>
                  <ChevronRight size={14} style={{ marginLeft: 4 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => editGroup(group)} style={styles.buttonPrimary}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteGroup(group.id)} style={styles.buttonDanger}>
                  <Trash2 size={14} />
                </button>
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
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3>{editing ? "✏️ Редактировать группу" : "➕ Создать группу"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <input
              type="text"
              placeholder="Название группы *"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={styles.input}
            />

            <textarea
              placeholder="Описание (необязательно)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              style={styles.textarea}
            />

            <label style={{ fontWeight: 500, fontSize: 14, marginBottom: 8, display: "block" }}>👥 Участники группы</label>
            
            <div style={styles.memberList}>
              {form.members.length === 0 ? (
                <span style={{ fontSize: 13, color: "#94a3b8" }}>Нет участников</span>
              ) : (
                form.members.map(member => (
                  <span key={member} style={styles.memberBadge}>
                    <User size={12} /> {adUsersMap[member] || member}
                    <button onClick={() => removeMember(member)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", marginLeft: 6 }}>×</button>
                  </span>
                ))
              )}
            </div>

            <input
              type="text"
              placeholder="🔍 Поиск пользователей..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={styles.input}
            />

            {searchQuery && (
              <div style={styles.userList}>
                {filteredUsers.length === 0 ? (
                  <div style={{ padding: 12, color: "#64748b" }}>Ничего не найдено</div>
                ) : (
                  filteredUsers.map(user => (
                    <div key={user.username} style={styles.userItem} onClick={() => addMember(user.username)}>
                      <span><User size={14} style={{ marginRight: 8 }} /> {user.display_name || user.username}</span>
                      <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>Добавить</button>
                    </div>
                  ))
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 20px", border: "1px solid #e2e8f0", borderRadius: 8, background: "white", cursor: "pointer" }}>
                Отмена
              </button>
              <button onClick={saveGroup} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>
                <Save size={14} /> {editing ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMembersModal && selectedGroup && (
        <div 
          style={styles.modal} 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowMembersModal(false);
            }
          }}
        >
          <div style={styles.modalContent} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3>👥 {selectedGroup.name} - участники</h3>
              <button onClick={() => setShowMembersModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            
            {selectedGroup.description && (
              <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                {selectedGroup.description}
              </div>
            )}
            
            <div style={styles.memberModalList}>
              {selectedGroup.members && selectedGroup.members.length > 0 ? (
                selectedGroup.members.map(member => (
                  <div key={member} style={styles.memberModalItem}>
                    <User size={16} style={{ color: "#64748b" }} />
                    <span>{adUsersMap[member] || member}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                  <Users size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p>Нет участников в группе</p>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowMembersModal(false)} style={{ padding: "8px 20px", border: "1px solid #e2e8f0", borderRadius: 8, background: "white", cursor: "pointer" }}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarGroups;