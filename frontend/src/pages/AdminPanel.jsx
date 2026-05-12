import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  Users, Link, Shield, Plus, X, Trash2, Edit2,
  FolderOpen, RefreshCw, Search, Loader, Globe,
  UserPlus, UserCheck, Group, Save, Layers, FolderTree,
  ChevronDown, ChevronRight, Settings, Target, Copy, Wrench
} from "lucide-react";
import ITTasksManager from "./ITTasksManager";

// ==================== КОМПОНЕНТ ДЛЯ РЕЗУЛЬТАТА ПОИСКА ПОЛЬЗОВАТЕЛЯ ====================
const UserSearchResultItem = ({ user, roles, getToken, onRoleChange }) => {
  const [userRole, setUserRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch(`http://192.168.7.103:8000/api/admin/users`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (res.ok && data.users) {
          const found = data.users.find(u => u.username === user.username);
          if (found) setUserRole(found.role);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserRole();
  }, [user.username, getToken]);

  const handleRoleChange = async (newRole) => {
    setUserRole(newRole);
    const formData = new FormData();
    formData.append("role_name", newRole);

    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/users/${user.username}/role`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok && onRoleChange) {
        onRoleChange(user.username, newRole);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleDisplayName = (role) => {
    switch(role) {
      case "admin": return "⚙️ Администратор";
      case "department_head": return "👑 Начальник отдела";
      case "moderator": return "🛡️ Модератор";
      case "it_engineer": return "🔧 IT-инженер";
      default: return "👤 Пользователь";
    }
  };

  const styles = {
    searchResultItem: {
      padding: "12px 16px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
      background: "white"
    },
    select: {
      padding: "6px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 6,
      fontSize: 12,
      background: "white",
      minWidth: 160
    },
    loader: {
      width: 20,
      height: 20,
      border: "2px solid #e2e8f0",
      borderTop: "2px solid #3b82f6",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    }
  };

  if (loading) {
    return (
      <div style={styles.searchResultItem}>
        <div>
          <strong>{user.display_name || user.username}</strong>
          <div style={{ fontSize: 11, color: "#64748b" }}>{user.username}</div>
        </div>
        <div style={styles.loader} />
      </div>
    );
  }

  return (
    <div style={styles.searchResultItem}>
      <div>
        <strong>{user.display_name || user.username}</strong>
        <div style={{ fontSize: 11, color: "#64748b" }}>{user.username}</div>
        {user.email && <div style={{ fontSize: 11, color: "#94a3b8" }}>{user.email}</div>}
      </div>
      <div>
        <select
          value={userRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          style={styles.select}
        >
          {roles.map(r => {
            let displayName = getRoleDisplayName(r.role_name);
            return <option key={r.id} value={r.role_name}>{displayName}</option>;
          })}
        </select>
      </div>
    </div>
  );
};

// ==================== КОМПОНЕНТ ДЛЯ СПИСКА ПОЛУЧАТЕЛЕЙ ====================
const TargetsList = ({ targets, onRemove, getTargetName, title = "🎯 Получатели" }) => {
  const uniqueTargets = [...new Map(
    (targets || []).map(t => [`${t.target_type}_${t.target_id}`, t])
  ).values()];

  const styles = {
    container: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
      marginBottom: 16
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 20,
      fontSize: 12,
      background: "#f1f5f9",
      color: "#1e293b"
    },
    removeBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#dc2626",
      padding: 0,
      marginLeft: 6,
      display: "inline-flex",
      alignItems: "center"
    }
  };

  if (uniqueTargets.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#64748b" }}>{title}</div>
      <div style={styles.container}>
        {uniqueTargets.map((target, idx) => (
          <div key={idx} style={styles.badge}>
            {target.target_type === "group" ? "👥" : "👤"} {getTargetName(target)}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemove(target);
              }} 
              style={styles.removeBtn} 
              title="Удалить"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== КОМПОНЕНТ ДЛЯ УПРАВЛЕНИЯ РЕСУРСАМИ И КАТЕГОРИЯМИ ====================
const ResourcesAndCategoriesManager = ({ adGroups, usersMap, getToken, showMessage }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: "", description: "", icon: "📁", is_global: 0, sort_order: 0
  });
  const [categoryTargets, setCategoryTargets] = useState({});
  const [categoryTargetSearch, setCategoryTargetSearch] = useState("");
  const [categoryTargetResults, setCategoryTargetResults] = useState([]);
  const [categoryTargetType, setCategoryTargetType] = useState("group");
  
  const [resourceForm, setResourceForm] = useState({
    resource_name: "", resource_path: "", resource_type: "folder",
    category_id: "", is_global: 0, sort_order: 0, inherit_from_category: 0
  });
  const [resourceTargets, setResourceTargets] = useState({});
  const [resourceTargetSearch, setResourceTargetSearch] = useState("");
  const [resourceTargetResults, setResourceTargetResults] = useState([]);
  const [resourceTargetType, setResourceTargetType] = useState("group");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://192.168.7.103:8000/api/admin/resource-categories", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
        const targetsMap = {};
        for (const cat of (data.categories || [])) {
          targetsMap[cat.id] = cat.targets || [];
        }
        setCategoryTargets(targetsMap);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://192.168.7.103:8000/api/admin/network-resources", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        setResources(data.resources || []);
        const targetsMap = {};
        for (const resItem of (data.resources || [])) {
          targetsMap[resItem.id] = resItem.targets || [];
        }
        setResourceTargets(targetsMap);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      showMessage("Введите название категории", "error");
      return;
    }

    const formData = new FormData();
    formData.append("name", categoryForm.name);
    formData.append("description", categoryForm.description || "");
    formData.append("icon", categoryForm.icon);
    formData.append("is_global", categoryForm.is_global ? "1" : "0");
    formData.append("sort_order", categoryForm.sort_order);

    const url = editingCategory
      ? `http://192.168.7.103:8000/api/admin/resource-categories/${editingCategory.id}`
      : "http://192.168.7.103:8000/api/admin/resource-categories";
    const method = editingCategory ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        showMessage(editingCategory ? "✅ Категория обновлена" : "✅ Категория добавлена");
        resetCategoryForm();
        await fetchCategories();
        await fetchResources();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка сохранения", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const deleteCategory = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!confirm(`Удалить категорию "${category?.name}"?`)) return;

    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/resource-categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Категория удалена");
        await fetchCategories();
        await fetchResources();
      } else {
        showMessage("Ошибка удаления", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const addCategoryTarget = async (categoryId, targetType, targetId, targetName) => {
    if (!targetId) return;
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/resource-categories/${categoryId}/targets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ target_type: targetType, target_id: targetId })
      });
      if (res.ok) {
        showMessage(`✅ Получатель "${targetName}" добавлен`);
        await fetchCategories();
        await fetchResources();
      } else {
        showMessage("Ошибка добавления получателя", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const removeCategoryTarget = async (categoryId, target) => {
    const targetDbId = target.id;
    if (!targetDbId) {
      showMessage("Ошибка: не удалось определить ID получателя", "error");
      return;
    }
    
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/resource-categories/${categoryId}/targets/${targetDbId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Получатель удален");
        await fetchCategories();
        await fetchResources();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка удаления", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const saveResource = async () => {
    if (!resourceForm.resource_name.trim() || !resourceForm.resource_path.trim()) {
      showMessage("Заполните название и путь", "error");
      return;
    }

    const formData = new FormData();
    formData.append("resource_name", resourceForm.resource_name);
    formData.append("resource_path", resourceForm.resource_path);
    formData.append("resource_type", resourceForm.resource_type);
    formData.append("is_global", resourceForm.is_global ? "1" : "0");
    formData.append("sort_order", resourceForm.sort_order);
    if (resourceForm.category_id && resourceForm.category_id !== "") {
      formData.append("category_id", resourceForm.category_id);
    }
    formData.append("inherit_from_category", resourceForm.inherit_from_category ? "1" : "0");

    const url = editingResource
      ? `http://192.168.7.103:8000/api/admin/network-resources/${editingResource.id}`
      : "http://192.168.7.103:8000/api/admin/network-resources";
    const method = editingResource ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        showMessage(editingResource ? "✅ Ресурс обновлён" : "✅ Ресурс добавлен");
        resetResourceForm();
        await fetchResources();
        await fetchCategories();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка сохранения", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const deleteResource = async (id) => {
    if (!confirm("Удалить ресурс?")) return;
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/network-resources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Ресурс удалён");
        await fetchResources();
        await fetchCategories();
      } else {
        showMessage("Ошибка удаления", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const addResourceTarget = async (resourceId, targetType, targetId, targetName) => {
    if (!targetId) return;
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/network-resources/${resourceId}/targets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ target_type: targetType, target_id: targetId })
      });
      if (res.ok) {
        showMessage(`✅ Получатель "${targetName}" добавлен`);
        await fetchResources();
        await fetchCategories();
      } else {
        showMessage("Ошибка добавления получателя", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const removeResourceTarget = async (resourceId, target) => {
    const targetDbId = target.id;
    if (!targetDbId) {
      showMessage("Ошибка: не удалось определить ID получателя", "error");
      return;
    }
    
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/network-resources/${resourceId}/targets/${targetDbId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Получатель удален");
        await fetchResources();
        await fetchCategories();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка удаления", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "", icon: "📁", is_global: 0, sort_order: 0 });
    setEditingCategory(null);
    setShowCategoryForm(false);
    setCategoryTargetSearch("");
    setCategoryTargetResults([]);
  };

  const resetResourceForm = () => {
    setResourceForm({ resource_name: "", resource_path: "", resource_type: "folder", category_id: "", is_global: 0, sort_order: 0, inherit_from_category: 0 });
    setEditingResource(null);
    setShowResourceForm(false);
    setResourceTargetSearch("");
    setResourceTargetResults([]);
  };

  const editCategory = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "📁",
      is_global: category.is_global || 0,
      sort_order: category.sort_order || 0
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const editResource = (resource) => {
    setResourceForm({
      resource_name: resource.resource_name,
      resource_path: resource.resource_path,
      resource_type: resource.resource_type || "folder",
      category_id: resource.category_id || "",
      is_global: resource.is_global || 0,
      sort_order: resource.sort_order || 0,
      inherit_from_category: resource.inherits_from_category ? 1 : 0
    });
    setEditingResource(resource);
    setShowResourceForm(true);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const getTargetDisplayName = (target, groups) => {
    if (target.target_type === "group") {
      const group = groups.find(g => g.id == target.target_id);
      return group?.display_name || group?.group_name || target.target_id;
    }
    return usersMap[target.target_id] || target.target_id;
  };

  const searchUsers = async (query, setResults) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/ad-users?query=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setResults(data.users || []);
    } catch (err) {
      setResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (categoryTargetSearch) searchUsers(categoryTargetSearch, setCategoryTargetResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [categoryTargetSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (resourceTargetSearch) searchUsers(resourceTargetSearch, setResourceTargetResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [resourceTargetSearch]);

  useEffect(() => {
    fetchCategories();
    fetchResources();
  }, []);

  const styles = {
    container: { marginBottom: 24 },
    card: { background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 },
    cardHeader: {
      padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "#f8fafc", flexWrap: "wrap", gap: 10
    },
    categoryHeader: {
      padding: "12px 16px",
      background: "#f1f5f9",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      gap: 8,
      cursor: "pointer"
    },
    resourceRow: {
      padding: "12px 16px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
      marginLeft: 32
    },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 },
    buttonIcon: { background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center" },
    input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" },
    select: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "white" },
    modal: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    },
    modalContent: { background: "white", borderRadius: 20, padding: 24, width: 650, maxWidth: "90%", maxHeight: "85vh", overflowY: "auto", overflowX: "hidden" },
    radioGroup: { display: "flex", gap: 20, marginBottom: 16, alignItems: "center" },
    targetsSection: { marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" },
    searchResultsBox: { border: "1px solid #e2e8f0", borderRadius: 8, maxHeight: 150, overflow: "auto", marginTop: 8, background: "white" },
    searchResultItem: { padding: "10px 12px", borderBottom: "1px solid #e2e8f0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
    badge: { display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 },
    badgeGlobal: { background: "#10b98120", color: "#10b981" },
    badgeGroup: { background: "#3b82f620", color: "#3b82f6" },
    badgeInherit: { background: "#8b5cf620", color: "#8b5cf6" },
    badgeCustom: { background: "#f59e0b20", color: "#f59e0b" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={{ margin: 0, fontSize: 16 }}>📂 Управление ресурсами и категориями</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { fetchCategories(); fetchResources(); }} style={styles.buttonIcon} title="Обновить">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => { resetCategoryForm(); setShowCategoryForm(true); }} style={styles.buttonPrimary}>
              <Plus size={14} /> Добавить категорию
            </button>
            <button onClick={() => { resetResourceForm(); setShowResourceForm(true); }} style={styles.buttonPrimary}>
              <Plus size={14} /> Добавить ресурс
            </button>
          </div>
        </div>

        {categories.length === 0 && resources.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
            <FolderTree size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Нет категорий и ресурсов</p>
          </div>
        ) : (
          <div>
            {categories.map(category => {
              const categoryResources = resources.filter(r => r.category_id === category.id);
              const isExpanded = expandedCategories[category.id];
              const targets = categoryTargets[category.id] || [];
              
              return (
                <div key={category.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <div style={styles.categoryHeader} onClick={() => toggleCategory(category.id)}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span style={{ fontSize: 20 }}>{category.icon || "📁"}</span>
                    <strong>{category.name}</strong>
                    <span style={{ ...styles.badge, ...(category.is_global ? styles.badgeGlobal : styles.badgeGroup) }}>
                      {category.is_global ? "🌍 Для всех" : "👥 Ограниченный доступ"}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>({categoryResources.length})</span>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                      <button onClick={(e) => { e.stopPropagation(); editCategory(category); }} style={styles.buttonIcon}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteCategory(category.id); }} style={{ ...styles.buttonIcon, color: "#dc2626" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div>
                      {category.description && (
                        <div style={{ padding: "8px 16px", fontSize: 12, color: "#64748b", background: "#fafbfc", marginLeft: 32 }}>
                          {category.description}
                        </div>
                      )}
                      
                      {!category.is_global && targets.length > 0 && (
                        <div style={{ padding: "8px 16px", marginLeft: 32, borderBottom: "1px solid #e2e8f0", background: "#fafbfc" }}>
                          <TargetsList
                            targets={targets}
                            onRemove={(target) => removeCategoryTarget(category.id, target)}
                            getTargetName={(t) => getTargetDisplayName(t, adGroups)}
                            title="🎯 Кто имеет доступ к категории:"
                          />
                        </div>
                      )}
                      
                      {!category.is_global && (
                        <div style={{ padding: "8px 16px", marginLeft: 32, borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                            <button onClick={() => setCategoryTargetType("group")} style={{ padding: "4px 10px", borderRadius: 6, background: categoryTargetType === "group" ? "#3b82f6" : "#e2e8f0", color: categoryTargetType === "group" ? "white" : "#1e293b", border: "none", cursor: "pointer", fontSize: 11 }}>👥 Группа</button>
                            <button onClick={() => setCategoryTargetType("user")} style={{ padding: "4px 10px", borderRadius: 6, background: categoryTargetType === "user" ? "#3b82f6" : "#e2e8f0", color: categoryTargetType === "user" ? "white" : "#1e293b", border: "none", cursor: "pointer", fontSize: 11 }}>👤 Пользователь</button>
                          </div>
                          
                          {categoryTargetType === "group" ? (
                            <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addCategoryTarget(category.id, "group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={{ ...styles.select, fontSize: 12, padding: "6px 10px" }}>
                              <option value="">-- Выберите группу --</option>
                              {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
                            </select>
                          ) : (
                            <div>
                              <input type="text" placeholder="Поиск пользователя..." value={categoryTargetSearch} onChange={e => setCategoryTargetSearch(e.target.value)} style={{ ...styles.input, fontSize: 12, padding: "6px 10px" }} />
                              {categoryTargetResults.length > 0 && (
                                <div style={styles.searchResultsBox}>
                                  {categoryTargetResults.map(u => (
                                    <div key={u.username} style={styles.searchResultItem} onClick={() => { addCategoryTarget(category.id, "user", u.username, u.display_name || u.username); setCategoryTargetSearch(""); setCategoryTargetResults([]); }}>
                                      <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11 }}>{u.username}</div></div>
                                      <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {categoryResources.length === 0 ? (
                        <div style={{ padding: "20px 16px", color: "#94a3b8", fontSize: 13, textAlign: "center", marginLeft: 32 }}>
                          Нет ресурсов
                        </div>
                      ) : (
                        categoryResources.map(resource => {
                          const resourceTargetsList = resourceTargets[resource.id] || [];
                          const isExpandedResource = expandedCategories[`resource_${resource.id}`];
                          
                          return (
                            <div key={resource.id}>
                              <div style={{ ...styles.resourceRow, cursor: "pointer" }} onClick={() => setExpandedCategories(prev => ({ ...prev, [`resource_${resource.id}`]: !prev[`resource_${resource.id}`] }))}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 18 }}>{resource.resource_type === "folder" ? "📁" : "📄"}</span>
                                    <strong>{resource.resource_name}</strong>
                                    {resource.is_global ? (
                                      <span style={{ ...styles.badge, ...styles.badgeGlobal }}>🌍 Для всех</span>
                                    ) : (
                                      <span style={{ ...styles.badge, ...styles.badgeGroup }}>👥 Ограниченный доступ</span>
                                    )}
                                    {resource.inherits_from_category && (
                                      <span style={{ ...styles.badge, ...styles.badgeInherit }}>📋 Наследует от категории</span>
                                    )}
                                    {resource.has_custom_targets && (
                                      <span style={{ ...styles.badge, ...styles.badgeCustom }}>⚙️ Свои права</span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginTop: 4, wordBreak: "break-all" }}>
                                    {resource.resource_path}
                                  </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => editResource(resource)} style={styles.buttonIcon}>
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => deleteResource(resource.id)} style={{ ...styles.buttonIcon, color: "#dc2626" }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              
                              {isExpandedResource && !resource.is_global && (
                                <div style={{ padding: "8px 16px", marginLeft: 64, borderBottom: "1px solid #e2e8f0", background: "#fafbfc" }}>
                                  {resourceTargetsList.length > 0 && (
                                    <TargetsList
                                      targets={resourceTargetsList}
                                      onRemove={(target) => removeResourceTarget(resource.id, target)}
                                      getTargetName={(t) => getTargetDisplayName(t, adGroups)}
                                      title="🎯 Кто имеет доступ к ресурсу (свои права):"
                                    />
                                  )}
                                  
                                  {resource.inherits_from_category && resource.category_id && (
                                    <div style={{ marginBottom: 16, padding: 8, background: "#e0f2fe", borderRadius: 8, fontSize: 12 }}>
                                      <strong>📋 Наследование:</strong> Ресурс наследует права от категории "{categories.find(c => c.id === resource.category_id)?.name}"
                                    </div>
                                  )}
                                  
                                  <div>
                                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                                      <button onClick={() => setResourceTargetType("group")} style={{ padding: "4px 10px", borderRadius: 6, background: resourceTargetType === "group" ? "#3b82f6" : "#e2e8f0", color: resourceTargetType === "group" ? "white" : "#1e293b", border: "none", cursor: "pointer", fontSize: 11 }}>👥 Группа</button>
                                      <button onClick={() => setResourceTargetType("user")} style={{ padding: "4px 10px", borderRadius: 6, background: resourceTargetType === "user" ? "#3b82f6" : "#e2e8f0", color: resourceTargetType === "user" ? "white" : "#1e293b", border: "none", cursor: "pointer", fontSize: 11 }}>👤 Пользователь</button>
                                    </div>
                                    
                                    {resourceTargetType === "group" ? (
                                      <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addResourceTarget(resource.id, "group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={{ ...styles.select, fontSize: 12, padding: "6px 10px" }}>
                                        <option value="">-- Выберите группу --</option>
                                        {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
                                      </select>
                                    ) : (
                                      <div>
                                        <input type="text" placeholder="Поиск пользователя..." value={resourceTargetSearch} onChange={e => setResourceTargetSearch(e.target.value)} style={{ ...styles.input, fontSize: 12, padding: "6px 10px" }} />
                                        {resourceTargetResults.length > 0 && (
                                          <div style={styles.searchResultsBox}>
                                            {resourceTargetResults.map(u => (
                                              <div key={u.username} style={styles.searchResultItem} onClick={() => { addResourceTarget(resource.id, "user", u.username, u.display_name || u.username); setResourceTargetSearch(""); setResourceTargetResults([]); }}>
                                                <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11 }}>{u.username}</div></div>
                                                <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {resources.filter(r => !r.category_id).length > 0 && (
              <div>
                <div style={styles.categoryHeader}>
                  <FolderOpen size={16} />
                  <strong>📁 Без категории</strong>
                  <span style={{ fontSize: 12, color: "#64748b" }}>({resources.filter(r => !r.category_id).length})</span>
                </div>
                {resources.filter(r => !r.category_id).map(resource => (
                  <div key={resource.id} style={styles.resourceRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 18 }}>{resource.resource_type === "folder" ? "📁" : "📄"}</span>
                        <strong>{resource.resource_name}</strong>
                        {resource.is_global ? (
                          <span style={{ ...styles.badge, ...styles.badgeGlobal }}>🌍 Для всех</span>
                        ) : (
                          <span style={{ ...styles.badge, ...styles.badgeGroup }}>👥 Ограниченный доступ</span>
                        )}
                        {resource.has_custom_targets && (
                          <span style={{ ...styles.badge, ...styles.badgeCustom }}>⚙️ Свои права</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginTop: 4 }}>
                        {resource.resource_path}
                      </div>
                    </div>
                    <div>
                      <button onClick={() => editResource(resource)} style={styles.buttonIcon}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteResource(resource.id)} style={{ ...styles.buttonIcon, color: "#dc2626" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно: Категория */}
      {showCategoryForm && (
        <div style={styles.modal} onClick={() => setShowCategoryForm(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3>{editingCategory ? "✏️ Редактировать" : "➕ Новая"} категория</h3>
              <button onClick={() => setShowCategoryForm(false)}>✕</button>
            </div>
            <input type="text" placeholder="Название *" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} style={styles.input} />
            <input type="text" placeholder="Описание" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} style={{ ...styles.input, marginTop: 12 }} />
            <input type="text" placeholder="Иконка" value={categoryForm.icon} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })} style={{ ...styles.input, marginTop: 12 }} />
            <input type="number" placeholder="Порядок" value={categoryForm.sort_order} onChange={e => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })} style={{ ...styles.input, marginTop: 12 }} />

            <div style={styles.radioGroup}>
              <label><input type="radio" checked={categoryForm.is_global === 1} onChange={() => setCategoryForm({ ...categoryForm, is_global: 1 })} /> 🌍 Для всех</label>
              <label><input type="radio" checked={categoryForm.is_global === 0} onChange={() => setCategoryForm({ ...categoryForm, is_global: 0 })} /> 👥 Для конкретных</label>
            </div>

            {categoryForm.is_global === 0 && editingCategory && (
              <div style={styles.targetsSection}>
                <TargetsList
                  targets={categoryTargets[editingCategory.id] || []}
                  onRemove={(target) => removeCategoryTarget(editingCategory.id, target)}
                  getTargetName={(t) => getTargetDisplayName(t, adGroups)}
                  title="🎯 Текущие получатели:"
                />
                
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <button onClick={() => setCategoryTargetType("group")} style={{ padding: "6px 12px", borderRadius: 6, background: categoryTargetType === "group" ? "#3b82f6" : "#e2e8f0", color: categoryTargetType === "group" ? "white" : "#1e293b", border: "none", cursor: "pointer", fontSize: 12 }}>
                    👥 AD Группа
                  </button>
                  <button onClick={() => setCategoryTargetType("user")} style={{ padding: "6px 12px", borderRadius: 6, background: categoryTargetType === "user" ? "#3b82f6" : "#e2e8f0", color: categoryTargetType === "user" ? "white" : "#1e293b", border: "none", cursor: "pointer", fontSize: 12 }}>
                    👤 Пользователь
                  </button>
                </div>
                
                {categoryTargetType === "group" ? (
                  <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addCategoryTarget(editingCategory.id, "group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={styles.select}>
                    <option value="">-- Выберите группу --</option>
                    {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
                  </select>
                ) : (
                  <div>
                    <input type="text" placeholder="Поиск пользователя..." value={categoryTargetSearch} onChange={e => setCategoryTargetSearch(e.target.value)} style={styles.input} />
                    {categoryTargetResults.length > 0 && (
                      <div style={styles.searchResultsBox}>
                        {categoryTargetResults.map(u => (
                          <div key={u.username} style={styles.searchResultItem} onClick={() => { addCategoryTarget(editingCategory.id, "user", u.username, u.display_name || u.username); setCategoryTargetSearch(""); setCategoryTargetResults([]); }}>
                            <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11 }}>{u.username}</div></div>
                            <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowCategoryForm(false)} style={{ padding: "8px 20px", border: "1px solid #e2e8f0", borderRadius: 8 }}>Отмена</button>
              <button onClick={saveCategory} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8 }}><Save size={14} /> Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Ресурс */}
      {showResourceForm && (
        <div style={styles.modal} onClick={() => setShowResourceForm(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3>{editingResource ? "✏️ Редактировать" : "➕ Новый"} ресурс</h3>
              <button onClick={() => setShowResourceForm(false)}>✕</button>
            </div>
            <input type="text" placeholder="Название *" value={resourceForm.resource_name} onChange={e => setResourceForm({ ...resourceForm, resource_name: e.target.value })} style={styles.input} />
            <input type="text" placeholder="Путь *" value={resourceForm.resource_path} onChange={e => setResourceForm({ ...resourceForm, resource_path: e.target.value })} style={{ ...styles.input, marginTop: 12 }} />
            <select value={resourceForm.resource_type} onChange={e => setResourceForm({ ...resourceForm, resource_type: e.target.value })} style={{ ...styles.select, marginTop: 12 }}>
              <option value="folder">📁 Папка</option>
              <option value="file">📄 Файл</option>
            </select>
            <select value={resourceForm.category_id} onChange={e => setResourceForm({ ...resourceForm, category_id: e.target.value })} style={{ ...styles.select, marginTop: 12 }}>
              <option value="">-- Без категории --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="number" placeholder="Порядок" value={resourceForm.sort_order} onChange={e => setResourceForm({ ...resourceForm, sort_order: parseInt(e.target.value) || 0 })} style={{ ...styles.input, marginTop: 12 }} />

            <div style={styles.radioGroup}>
              <label><input type="radio" checked={resourceForm.is_global === 1} onChange={() => setResourceForm({ ...resourceForm, is_global: 1 })} /> 🌍 Для всех</label>
              <label><input type="radio" checked={resourceForm.is_global === 0} onChange={() => setResourceForm({ ...resourceForm, is_global: 0 })} /> 👥 Для конкретных</label>
            </div>

            {resourceForm.is_global === 0 && editingResource && resourceForm.category_id && (
              <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={resourceForm.inherit_from_category === 1}
                    onChange={(e) => setResourceForm({ ...resourceForm, inherit_from_category: e.target.checked ? 1 : 0 })}
                  />
                  <span>📋 Наследовать права от категории (при включении все свои настройки доступа будут удалены)</span>
                </label>
                {resourceForm.inherit_from_category === 1 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#8b5cf6" }}>
                    ⚠️ При сохранении все добавленные получатели для этого ресурса будут удалены, и ресурс будет использовать права категории
                  </div>
                )}
              </div>
            )}

            {resourceForm.is_global === 0 && editingResource && resourceForm.inherit_from_category !== 1 && (
              <div style={styles.targetsSection}>
                <TargetsList
                  targets={resourceTargets[editingResource.id] || []}
                  onRemove={(target) => removeResourceTarget(editingResource.id, target)}
                  getTargetName={(t) => getTargetDisplayName(t, adGroups)}
                  title="🎯 Свои получатели ресурса:"
                />
                
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <button onClick={() => setResourceTargetType("group")} style={{ padding: "6px 12px", borderRadius: 6, background: resourceTargetType === "group" ? "#3b82f6" : "#e2e8f0", color: resourceTargetType === "group" ? "white" : "#1e293b", border: "none", cursor: "pointer", fontSize: 12 }}>
                    👥 AD Группа
                  </button>
                  <button onClick={() => setResourceTargetType("user")} style={{ padding: "6px 12px", borderRadius: 6, background: resourceTargetType === "user" ? "#3b82f6" : "#e2e8f0", color: resourceTargetType === "user" ? "white" : "#1e293b", border: "none", cursor: "pointer", fontSize: 12 }}>
                    👤 Пользователь
                  </button>
                </div>
                
                {resourceTargetType === "group" ? (
                  <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addResourceTarget(editingResource.id, "group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={styles.select}>
                    <option value="">-- Выберите группу --</option>
                    {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
                  </select>
                ) : (
                  <div>
                    <input type="text" placeholder="Поиск пользователя..." value={resourceTargetSearch} onChange={e => setResourceTargetSearch(e.target.value)} style={styles.input} />
                    {resourceTargetResults.length > 0 && (
                      <div style={styles.searchResultsBox}>
                        {resourceTargetResults.map(u => (
                          <div key={u.username} style={styles.searchResultItem} onClick={() => { addResourceTarget(editingResource.id, "user", u.username, u.display_name || u.username); setResourceTargetSearch(""); setResourceTargetResults([]); }}>
                            <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11 }}>{u.username}</div></div>
                            <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {resourceForm.is_global === 0 && editingResource && resourceForm.inherit_from_category === 1 && resourceForm.category_id && (
              <div style={{ ...styles.targetsSection, background: "#e0f2fe" }}>
                <div style={{ fontSize: 13, color: "#1e293b" }}>
                  <strong>📋 Ресурс наследует права от категории</strong>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    Чтобы настроить свои права для этого ресурса, снимите галочку "Наследовать права от категории"
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowResourceForm(false)} style={{ padding: "8px 20px", border: "1px solid #e2e8f0", borderRadius: 8 }}>Отмена</button>
              <button onClick={saveResource} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8 }}><Save size={14} /> Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== КОМПОНЕНТ ДЛЯ УПРАВЛЕНИЯ СЕРВИСАМИ ====================
const ServicesManager = ({ adGroups, usersMap, getToken, showMessage }) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    service_name: "", service_url: "", service_icon: "🔗", is_global: 0, sort_order: 0
  });
  const [serviceTargets, setServiceTargets] = useState({});
  const [serviceTargetSearch, setServiceTargetSearch] = useState("");
  const [serviceTargetResults, setServiceTargetResults] = useState([]);
  const [serviceTargetType, setServiceTargetType] = useState("group");

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://192.168.7.103:8000/api/admin/services", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        setServices(data.services || []);
        const targetsMap = {};
        for (const svc of (data.services || [])) {
          targetsMap[svc.id] = svc.targets || [];
        }
        setServiceTargets(targetsMap);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const saveService = async () => {
    if (!serviceForm.service_name.trim() || !serviceForm.service_url.trim()) {
      showMessage("Заполните название и URL", "error");
      return;
    }

    const formData = new FormData();
    formData.append("service_name", serviceForm.service_name);
    formData.append("service_url", serviceForm.service_url);
    formData.append("service_icon", serviceForm.service_icon);
    formData.append("is_global", serviceForm.is_global ? "1" : "0");
    formData.append("sort_order", serviceForm.sort_order);

    const url = editingService
      ? `http://192.168.7.103:8000/api/admin/services/${editingService.id}`
      : "http://192.168.7.103:8000/api/admin/services";
    const method = editingService ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        showMessage(editingService ? "✅ Сервис обновлён" : "✅ Сервис добавлен");
        resetForm();
        await fetchServices();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка сохранения", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const deleteService = async (id) => {
    if (!confirm("Удалить сервис?")) return;
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Сервис удалён");
        await fetchServices();
      } else {
        showMessage("Ошибка удаления", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const addServiceTarget = async (serviceId, targetType, targetId, targetName) => {
    if (!targetId) return;
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/services/${serviceId}/targets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ target_type: targetType, target_id: targetId })
      });
      if (res.ok) {
        showMessage(`✅ Получатель "${targetName}" добавлен`);
        await fetchServices();
      } else {
        showMessage("Ошибка добавления получателя", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const removeServiceTarget = async (serviceId, target) => {
    const targetDbId = target.id;
    if (!targetDbId) {
      showMessage("Ошибка: не удалось определить ID получателя", "error");
      return;
    }
    
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/services/${serviceId}/targets/${targetDbId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage("🗑️ Получатель удален");
        await fetchServices();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка удаления", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const resetForm = () => {
    setServiceForm({ service_name: "", service_url: "", service_icon: "🔗", is_global: 0, sort_order: 0 });
    setEditingService(null);
    setShowForm(false);
    setServiceTargetSearch("");
    setServiceTargetResults([]);
  };

  const editService = (service) => {
    setServiceForm({
      service_name: service.service_name,
      service_url: service.service_url,
      service_icon: service.service_icon || "🔗",
      is_global: service.is_global || 0,
      sort_order: service.sort_order || 0
    });
    setEditingService(service);
    setShowForm(true);
  };

  const getTargetDisplayName = (target, groups) => {
    if (target.target_type === "group") {
      const group = groups.find(g => g.id == target.target_id);
      return group?.display_name || group?.group_name || target.target_id;
    }
    return usersMap[target.target_id] || target.target_id;
  };

  const searchUsers = async (query, setResults) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/ad-users?query=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setResults(data.users || []);
    } catch (err) {
      setResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (serviceTargetSearch) searchUsers(serviceTargetSearch, setServiceTargetResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [serviceTargetSearch]);

  useEffect(() => {
    fetchServices();
  }, []);

  const styles = {
    card: { background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 },
    cardHeader: {
      padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "#f8fafc", flexWrap: "wrap", gap: 10
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: 13 },
    td: { padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 13 },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 },
    buttonIcon: { background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center" },
    input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" },
    select: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "white" },
    modal: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    },
    modalContent: { background: "white", borderRadius: 20, padding: 24, width: 650, maxWidth: "90%", maxHeight: "85vh", overflowY: "auto", overflowX: "hidden" },
    radioGroup: { display: "flex", gap: 20, marginBottom: 16, alignItems: "center" },
    targetsSection: { marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" },
    searchResultsBox: { border: "1px solid #e2e8f0", borderRadius: 8, maxHeight: 150, overflow: "auto", marginTop: 8, background: "white" },
    searchResultItem: { padding: "10px 12px", borderBottom: "1px solid #e2e8f0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
    badge: { display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 },
    badgeGlobal: { background: "#10b98120", color: "#10b981" },
    badgeGroup: { background: "#3b82f620", color: "#3b82f6" }
  };

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={{ margin: 0, fontSize: 16 }}>🔗 Управление сервисами</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchServices} style={styles.buttonIcon} title="Обновить">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} style={styles.buttonPrimary}>
              <Plus size={14} /> Добавить сервис
            </button>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}><Loader size={32} /></div>
        ) : services.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
            <Link size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Нет сервисов</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Иконка</th>
                  <th style={styles.th}>Название</th>
                  <th style={styles.th}>URL</th>
                  <th style={styles.th}>Доступ</th>
                  <th style={styles.th}>Порядок</th>
                  <th style={styles.th}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td style={styles.td}>{s.id}</td>
                    <td style={styles.td}>{s.service_icon}</td>
                    <td style={styles.td}><strong>{s.service_name}</strong></td>
                    <td style={styles.td}><code style={{ fontSize: 11 }}>{s.service_url}</code></td>
                    <td style={styles.td}>
                      {s.is_global ? (
                        <span style={{ ...styles.badge, ...styles.badgeGlobal }}>🌍 Для всех</span>
                      ) : (
                        <span style={{ ...styles.badge, ...styles.badgeGroup }}>👥 Ограниченный доступ</span>
                      )}
                    </td>
                    <td style={styles.td}>{s.sort_order || 0}</td>
                    <td style={styles.td}>
                      <button onClick={() => editService(s)} style={styles.buttonIcon}><Edit2 size={14} /></button>
                      <button onClick={() => deleteService(s.id)} style={{ ...styles.buttonIcon, color: "#dc2626" }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div style={styles.modal} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3>{editingService ? "✏️ Редактировать" : "➕ Новый"} сервис</h3>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <input type="text" placeholder="Название *" value={serviceForm.service_name} onChange={e => setServiceForm({ ...serviceForm, service_name: e.target.value })} style={styles.input} />
            <input type="text" placeholder="URL *" value={serviceForm.service_url} onChange={e => setServiceForm({ ...serviceForm, service_url: e.target.value })} style={{ ...styles.input, marginTop: 12 }} />
            <input type="text" placeholder="Иконка" value={serviceForm.service_icon} onChange={e => setServiceForm({ ...serviceForm, service_icon: e.target.value })} style={{ ...styles.input, marginTop: 12 }} />
            <input type="number" placeholder="Порядок" value={serviceForm.sort_order} onChange={e => setServiceForm({ ...serviceForm, sort_order: parseInt(e.target.value) || 0 })} style={{ ...styles.input, marginTop: 12 }} />

            <div style={styles.radioGroup}>
              <label><input type="radio" checked={serviceForm.is_global === 1} onChange={() => setServiceForm({ ...serviceForm, is_global: 1 })} /> 🌍 Для всех</label>
              <label><input type="radio" checked={serviceForm.is_global === 0} onChange={() => setServiceForm({ ...serviceForm, is_global: 0 })} /> 👥 Для конкретных</label>
            </div>

            {serviceForm.is_global === 0 && editingService && (
              <div style={styles.targetsSection}>
                <TargetsList
                  targets={serviceTargets[editingService.id] || []}
                  onRemove={(target) => removeServiceTarget(editingService.id, target)}
                  getTargetName={(t) => getTargetDisplayName(t, adGroups)}
                  title="🎯 Получатели:"
                />
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <button onClick={() => setServiceTargetType("group")} style={{ padding: "6px 12px", borderRadius: 6, background: serviceTargetType === "group" ? "#3b82f6" : "#e2e8f0" }}>AD Группа</button>
                  <button onClick={() => setServiceTargetType("user")} style={{ padding: "6px 12px", borderRadius: 6, background: serviceTargetType === "user" ? "#3b82f6" : "#e2e8f0" }}>Пользователь</button>
                </div>
                {serviceTargetType === "group" ? (
                  <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addServiceTarget(editingService.id, "group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={styles.select}>
                    <option value="">-- Выберите группу --</option>
                    {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
                  </select>
                ) : (
                  <div>
                    <input type="text" placeholder="Поиск пользователя..." value={serviceTargetSearch} onChange={e => setServiceTargetSearch(e.target.value)} style={styles.input} />
                    {serviceTargetResults.length > 0 && (
                      <div style={styles.searchResultsBox}>
                        {serviceTargetResults.map(u => (
                          <div key={u.username} style={styles.searchResultItem} onClick={() => { addServiceTarget(editingService.id, "user", u.username, u.display_name || u.username); setServiceTargetSearch(""); setServiceTargetResults([]); }}>
                            <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11 }}>{u.username}</div></div>
                            <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 4 }}>Выбрать</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 20px", border: "1px solid #e2e8f0", borderRadius: 8 }}>Отмена</button>
              <button onClick={saveService} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8 }}><Save size={14} /> Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ОСНОВНОЙ КОМПОНЕНТ ADMIN PANEL ====================
const AdminPanel = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("resources");
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [adGroups, setAdGroups] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDisplay, setNewGroupDisplay] = useState("");
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const isAdmin = user?.groups?.includes("!citovmt") || user?.group === "!citovmt";

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const getToken = () => localStorage.getItem("token") || token;

  const fetchAdGroups = async () => {
    try {
      const res = await fetch("http://192.168.7.103:8000/api/admin/groups", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setAdGroups(data.groups || []);
    } catch (err) { console.error(err); }
  };

  const fetchUsersMap = async () => {
    try {
      const res = await fetch("http://192.168.7.103:8000/api/admin/ad-users?query=&limit=100000", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok && data.users) {
        const map = {};
        data.users.forEach(u => {
          map[u.username] = u.display_name || u.username;
        });
        setUsersMap(map);
        console.log(`✅ Загружено пользователей в маппинг: ${Object.keys(map).length}`);
      }
    } catch (err) { console.error(err); }
  };

  const addAdGroup = async () => {
    if (!newGroupName.trim()) {
      showMessage("Введите имя группы", "error");
      return;
    }
    const formData = new FormData();
    formData.append("group_name", newGroupName);
    formData.append("display_name", newGroupDisplay || newGroupName);

    try {
      const res = await fetch("http://192.168.7.103:8000/api/admin/groups", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        showMessage(`✅ Группа добавлена`);
        setNewGroupName("");
        setNewGroupDisplay("");
        fetchAdGroups();
      } else {
        showMessage("Ошибка добавления группы", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const deleteAdGroup = async (groupId) => {
    const group = adGroups.find(g => g.id === groupId);
    if (!confirm(`Удалить группу "${group?.display_name || group?.group_name}"?`)) return;

    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/groups/${groupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        showMessage(`✅ Группа удалена`);
        fetchAdGroups();
      } else {
        showMessage("Ошибка удаления группы", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("http://192.168.7.103:8000/api/admin/users", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setRoles(data.roles || []);
    } catch (err) { console.error(err); }
  };

  const searchAdUsers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/ad-users?query=${encodeURIComponent(query)}&limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setSearchResults(data.users || []);
    } catch (err) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) {
        searchAdUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdGroups();
      fetchRoles();
      fetchUsersMap();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Shield size={48} style={{ color: "#ef4444", marginBottom: 16 }} />
        <h2>Доступ запрещен</h2>
        <p style={{ color: "#64748b" }}>Только администраторы могут управлять порталом</p>
      </div>
    );
  }

  const styles = {
    container: { padding: 24 },
    tabs: { display: "flex", gap: 8, borderBottom: "1px solid #e2e8f0", marginBottom: 24, flexWrap: "wrap" },
    tab: { padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, borderRadius: 8, display: "flex", alignItems: "center", gap: 8 },
    tabActive: { background: "#3b82f6", color: "white" },
    card: { background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 },
    cardHeader: { padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: 13 },
    td: { padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 13 },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 },
    buttonIcon: { background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center" },
    input: { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" },
    userSearchBox: { display: "flex", gap: 8, alignItems: "center", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px" }
  };

  return (
    <div style={styles.container}>
      {message.text && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1100, background: message.type === "error" ? "#ef4444" : "#10b981", color: "white", padding: "12px 20px", borderRadius: 10, fontSize: 13 }}>
          {message.text}
        </div>
      )}

      <div style={styles.tabs}>
        <button onClick={() => setActiveTab("resources")} style={{ ...styles.tab, ...(activeTab === "resources" ? styles.tabActive : {}) }}><FolderTree size={16} /> Ресурсы и категории</button>
        <button onClick={() => setActiveTab("services")} style={{ ...styles.tab, ...(activeTab === "services" ? styles.tabActive : {}) }}><Link size={16} /> Сервисы</button>
        <button onClick={() => setActiveTab("groups")} style={{ ...styles.tab, ...(activeTab === "groups" ? styles.tabActive : {}) }}><Group size={16} /> AD Группы</button>
        <button onClick={() => setActiveTab("users")} style={{ ...styles.tab, ...(activeTab === "users" ? styles.tabActive : {}) }}><Users size={16} /> Пользователи</button>
      </div>

      {activeTab === "resources" && <ResourcesAndCategoriesManager adGroups={adGroups} usersMap={usersMap} getToken={getToken} showMessage={showMessage} />}
      {activeTab === "services" && <ServicesManager adGroups={adGroups} usersMap={usersMap} getToken={getToken} showMessage={showMessage} />}

      {activeTab === "groups" && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={{ margin: 0, fontSize: 16 }}>👥 AD группы</h3>
            <button onClick={fetchAdGroups} style={styles.buttonIcon}><RefreshCw size={16} /></button>
          </div>
          <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <h4 style={{ fontSize: 14, marginBottom: 12 }}>➕ Добавить AD группу</h4>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input type="text" placeholder="Имя группы *" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} style={{ flex: 2, ...styles.input }} />
              <input type="text" placeholder="Отображаемое имя" value={newGroupDisplay} onChange={(e) => setNewGroupDisplay(e.target.value)} style={{ flex: 2, ...styles.input }} />
              <button onClick={addAdGroup} style={styles.buttonPrimary}><UserPlus size={14} /> Добавить</button>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 14, margin: "16px 20px 12px" }}>📋 Список групп</h4>
            {adGroups.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}><Group size={48} style={{ opacity: 0.5 }} /><p>Нет групп</p></div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Имя</th>
                      <th style={styles.th}>Отображаемое имя</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {adGroups.map(g => (
                      <tr key={g.id} style={g.group_name === "!citovmt" ? { background: "#fef3c7" } : {}}>
                        <td style={styles.td}>{g.id}</td>
                        <td style={styles.td}><code>{g.group_name}</code>{g.group_name === "!citovmt" && <span style={{ marginLeft: 8, fontSize: 10, background: "#f59e0b20", color: "#d97706", padding: "2px 6px", borderRadius: 4 }}>ADMIN</span>}</td>
                        <td style={styles.td}>{g.display_name || g.group_name}</td>
                        <td style={styles.td}><button onClick={() => deleteAdGroup(g.id)} style={{ ...styles.buttonIcon, color: "#dc2626" }} disabled={g.group_name === "!citovmt"}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={{ margin: 0, fontSize: 16 }}>👥 Управление пользователями</h3>
          </div>
          <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <h4 style={{ fontSize: 14, marginBottom: 12 }}>🔍 Поиск пользователей в Active Directory</h4>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, ...styles.userSearchBox }}>
                <Search size={16} style={{ color: "#94a3b8" }} />
                <input type="text" placeholder="Введите имя или фамилию..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontSize: 13 }} autoFocus />
                {searching && <Loader size={14} />}
              </div>
              <button onClick={() => setSearchQuery("")} style={styles.buttonIcon}><X size={16} /></button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div style={{ padding: 16 }}>
              <h4 style={{ fontSize: 13, marginBottom: 12 }}>📋 Результаты поиска ({searchResults.length}):</h4>
              {searchResults.map(adUser => (
                <UserSearchResultItem 
                  key={adUser.username} 
                  user={adUser} 
                  roles={roles} 
                  getToken={getToken} 
                  onRoleChange={(username, newRole) => showMessage(`✅ Роль ${newRole} назначена пользователю ${username}`)} 
                />
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}><Search size={48} style={{ marginBottom: 16, opacity: 0.5 }} /><p>Пользователи не найдены</p></div>
          )}

          {searchQuery.length < 2 && searchResults.length === 0 && (
            <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}><Users size={48} style={{ marginBottom: 16, opacity: 0.5 }} /><p>Начните вводить имя пользователя для поиска</p></div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;