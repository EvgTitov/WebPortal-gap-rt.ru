import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  Users, Link, Shield, Plus, X, Trash2, Edit2,
  FolderOpen, RefreshCw, Search, Loader, Globe,
  UserPlus, UserCheck, Group, Save, Layers, FolderTree,
  ChevronDown, ChevronRight, Settings, Target, Copy, Wrench
} from "lucide-react";

const UserSearchResultItem = ({ user, roles, getToken, onRoleChange, darkMode }) => {
  const [userRole, setUserRole] = useState("user");
  const [loading, setLoading] = useState(true);

  const bgColor = darkMode ? "#1e293b" : "white";
  const borderColor = darkMode ? "#475569" : "#e2e8f0";
  const textColor = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch(`/api/admin/users`, {
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
    const oldRole = userRole;
    setUserRole(newRole);
    const formData = new FormData();
    formData.append("role_name", newRole);

    try {
      const res = await fetch(`/api/admin/users/${user.username}/role`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok && onRoleChange) {
        onRoleChange(user.username, newRole);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const currentUser = JSON.parse(storedUser);
          if (currentUser.username === user.username) {
            currentUser.role = newRole;
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
        }
      } else {
        setUserRole(oldRole);
        alert("Ошибка при сохранении роли");
      }
    } catch (err) {
      console.error(err);
      setUserRole(oldRole);
      alert("Ошибка соединения");
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
      borderBottom: `1px solid ${borderColor}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
      background: bgColor,
      color: textColor
    },
    select: {
      padding: "6px 12px",
      border: `1px solid ${borderColor}`,
      borderRadius: 6,
      fontSize: 12,
      background: bgColor,
      color: textColor,
      minWidth: 160
    },
    loader: {
      width: 20,
      height: 20,
      border: `2px solid ${borderColor}`,
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
          <div style={{ fontSize: 11, color: textMuted }}>{user.username}</div>
        </div>
        <div style={styles.loader} />
      </div>
    );
  }

  return (
    <div style={styles.searchResultItem}>
      <div>
        <strong>{user.display_name || user.username}</strong>
        <div style={{ fontSize: 11, color: textMuted }}>{user.username}</div>
        {user.email && <div style={{ fontSize: 11, color: textMuted }}>{user.email}</div>}
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

const TargetsList = ({ targets, onRemove, getTargetName, title = "🎯 Получатели", darkMode }) => {
  const uniqueTargets = [...new Map(
    (targets || []).map(t => [`${t.target_type}_${t.target_id}`, t])
  ).values()];

  const bgColor = darkMode ? "#334155" : "#f1f5f9";
  const textColor = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";

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
      background: bgColor,
      color: textColor
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
      <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: textMuted }}>{title}</div>
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

const ResourcesAndCategoriesManager = ({ adGroups, usersMap, getToken, showMessage, canEdit, darkMode }) => {
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
  const [pendingCategoryTargets, setPendingCategoryTargets] = useState([]);
  
  const [resourceForm, setResourceForm] = useState({
    resource_name: "", resource_path: "", resource_type: "folder",
    category_id: "", is_global: 0, sort_order: 0, inherit_from_category: 0
  });
  const [resourceTargets, setResourceTargets] = useState({});
  const [resourceTargetSearch, setResourceTargetSearch] = useState("");
  const [resourceTargetResults, setResourceTargetResults] = useState([]);
  const [resourceTargetType, setResourceTargetType] = useState("group");
  const [pendingResourceTargets, setPendingResourceTargets] = useState([]);

  // Базовые цвета для тёмной/светлой темы
  const bgColor = darkMode ? "#1e293b" : "white";
  const headerBg = darkMode ? "#0f172a" : "#f8fafc";
  const borderColor = darkMode ? "#475569" : "#e2e8f0";
  const borderLight = darkMode ? "#334155" : "#e2e8f0";
  const textColor = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "#0f172a" : "white";
  const categoryHeaderBg = darkMode ? "#1e293b" : "#f1f5f9";

  const styles = {
    container: { marginBottom: 24 },
    card: { background: bgColor, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden", marginBottom: 24 },
    cardHeader: {
      padding: "16px 20px", borderBottom: `1px solid ${borderColor}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: headerBg, flexWrap: "wrap", gap: 10, color: textColor
    },
    categoryHeader: {
      padding: "12px 16px",
      background: categoryHeaderBg,
      borderBottom: `1px solid ${borderColor}`,
      display: "flex",
      alignItems: "center",
      gap: 8,
      cursor: "pointer",
      color: textColor
    },
    resourceRow: {
      padding: "12px 16px",
      borderBottom: `1px solid ${borderColor}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
      marginLeft: 32,
      color: textColor
    },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 },
    buttonIcon: { background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center", color: textMuted },
    input: { width: "100%", padding: "8px 12px", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: inputBg, color: textColor },
    select: { width: "100%", padding: "8px 12px", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 13, background: inputBg, color: textColor },
    modal: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    },
    modalContent: { background: bgColor, borderRadius: 20, padding: 24, width: 650, maxWidth: "90%", maxHeight: "85vh", overflowY: "auto", overflowX: "hidden", color: textColor },
    radioGroup: { display: "flex", gap: 20, marginBottom: 16, alignItems: "center", color: textColor },
    targetsSection: { marginTop: 16, padding: 12, background: headerBg, borderRadius: 8, border: `1px solid ${borderColor}` },
    searchResultsBox: { border: `1px solid ${borderColor}`, borderRadius: 8, maxHeight: 150, overflow: "auto", marginTop: 8, background: bgColor },
    searchResultItem: { padding: "10px 12px", borderBottom: `1px solid ${borderColor}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: textColor },
    badge: { display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 },
    badgeGlobal: { background: "#10b98120", color: "#10b981" },
    badgeGroup: { background: "#3b82f620", color: "#3b82f6" },
    badgeInherit: { background: "#8b5cf620", color: "#8b5cf6" },
    badgeCustom: { background: "#f59e0b20", color: "#f59e0b" }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resource-categories", {
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
      const res = await fetch("/api/admin/network-resources", {
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

  const addCategoryTarget = async (categoryId, targetType, targetId, targetName) => {
    if (!targetId) return;
    try {
      const res = await fetch(`/api/admin/resource-categories/${categoryId}/targets`, {
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
      const res = await fetch(`/api/admin/resource-categories/${categoryId}/targets/${targetDbId}`, {
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

  const addResourceTarget = async (resourceId, targetType, targetId, targetName) => {
    if (!targetId) return;
    try {
      const res = await fetch(`/api/admin/network-resources/${resourceId}/targets`, {
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
      const res = await fetch(`/api/admin/network-resources/${resourceId}/targets/${targetDbId}`, {
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

  const addCategoryTargetTemp = (targetType, targetId, targetName) => {
    if (pendingCategoryTargets.some(t => t.id === targetId && t.type === targetType)) {
      showMessage("❌ Этот получатель уже добавлен", "error");
      return;
    }
    setPendingCategoryTargets([...pendingCategoryTargets, { type: targetType, id: targetId, name: targetName }]);
    showMessage(`✅ Получатель "${targetName}" добавлен (будет сохранён после создания категории)`);
    setCategoryTargetSearch("");
    setCategoryTargetResults([]);
  };

  const removeCategoryTargetTemp = (targetId, targetType) => {
    setPendingCategoryTargets(pendingCategoryTargets.filter(t => !(t.id === targetId && t.type === targetType)));
    showMessage("🗑️ Получатель удалён из очереди");
  };

  const addResourceTargetTemp = (targetType, targetId, targetName) => {
    if (pendingResourceTargets.some(t => t.id === targetId && t.type === targetType)) {
      showMessage("❌ Этот получатель уже добавлен", "error");
      return;
    }
    setPendingResourceTargets([...pendingResourceTargets, { type: targetType, id: targetId, name: targetName }]);
    showMessage(`✅ Получатель "${targetName}" добавлен (будет сохранён после создания ресурса)`);
    setResourceTargetSearch("");
    setResourceTargetResults([]);
  };

  const removeResourceTargetTemp = (targetId, targetType) => {
    setPendingResourceTargets(pendingResourceTargets.filter(t => !(t.id === targetId && t.type === targetType)));
    showMessage("🗑️ Получатель удалён из очереди");
  };

  const saveCategory = async () => {
    if (!canEdit) {
      showMessage("У вас нет прав на создание категорий", "error");
      return;
    }
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
      ? `/api/admin/resource-categories/${editingCategory.id}`
      : "/api/admin/resource-categories";
    const method = editingCategory ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        let categoryId = editingCategory ? editingCategory.id : null;
        
        if (!editingCategory) {
          const result = await res.json();
          categoryId = result.id;
        }
        
        if (categoryForm.is_global === 0 && pendingCategoryTargets.length > 0 && categoryId) {
          if (editingCategory) {
            const oldTargets = categoryTargets[editingCategory.id] || [];
            for (const oldTarget of oldTargets) {
              await fetch(`/api/admin/resource-categories/${categoryId}/targets/${oldTarget.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` }
              });
            }
          }
          for (const target of pendingCategoryTargets) {
            await fetch(`/api/admin/resource-categories/${categoryId}/targets`, {
              method: "POST",
              headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ target_type: target.type, target_id: target.id })
            });
          }
          showMessage(editingCategory ? "✅ Категория обновлена с получателями" : "✅ Категория добавлена с получателями");
        } else {
          showMessage(editingCategory ? "✅ Категория обновлена" : "✅ Категория добавлена");
        }
        
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

  const saveResource = async () => {
    if (!canEdit) {
      showMessage("У вас нет прав на создание ресурсов", "error");
      return;
    }
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
      ? `/api/admin/network-resources/${editingResource.id}`
      : "/api/admin/network-resources";
    const method = editingResource ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        let resourceId = editingResource ? editingResource.id : null;
        
        if (!editingResource) {
          const result = await res.json();
          resourceId = result.id;
        }
        
        if (resourceForm.is_global === 0 && resourceForm.inherit_from_category !== 1 && pendingResourceTargets.length > 0 && resourceId) {
          if (editingResource) {
            const oldTargets = resourceTargets[editingResource.id] || [];
            for (const oldTarget of oldTargets) {
              await fetch(`/api/admin/network-resources/${resourceId}/targets/${oldTarget.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` }
              });
            }
          }
          for (const target of pendingResourceTargets) {
            await fetch(`/api/admin/network-resources/${resourceId}/targets`, {
              method: "POST",
              headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ target_type: target.type, target_id: target.id })
            });
          }
          showMessage(editingResource ? "✅ Ресурс обновлён с получателями" : "✅ Ресурс добавлен с получателями");
        } else {
          showMessage(editingResource ? "✅ Ресурс обновлён" : "✅ Ресурс добавлен");
        }
        
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

  const deleteCategory = async (categoryId) => {
    if (!canEdit) {
      showMessage("У вас нет прав на удаление категорий", "error");
      return;
    }
    const category = categories.find(c => c.id === categoryId);
    if (!confirm(`Удалить категорию "${category?.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/resource-categories/${categoryId}`, {
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

  const deleteResource = async (id) => {
    if (!canEdit) {
      showMessage("У вас нет прав на удаление ресурсов", "error");
      return;
    }
    if (!confirm("Удалить ресурс?")) return;
    try {
      const res = await fetch(`/api/admin/network-resources/${id}`, {
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

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "", icon: "📁", is_global: 0, sort_order: 0 });
    setEditingCategory(null);
    setShowCategoryForm(false);
    setCategoryTargetSearch("");
    setCategoryTargetResults([]);
    setPendingCategoryTargets([]);
  };

  const resetResourceForm = () => {
    setResourceForm({ resource_name: "", resource_path: "", resource_type: "folder", category_id: "", is_global: 0, sort_order: 0, inherit_from_category: 0 });
    setEditingResource(null);
    setShowResourceForm(false);
    setResourceTargetSearch("");
    setResourceTargetResults([]);
    setPendingResourceTargets([]);
  };

  const editCategory = (category) => {
    if (!canEdit) {
      showMessage("У вас нет прав на редактирование категорий", "error");
      return;
    }
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "📁",
      is_global: category.is_global || 0,
      sort_order: category.sort_order || 0
    });
    setEditingCategory(category);
    const existingTargets = (category.targets || []).map(t => ({
      type: t.target_type,
      id: t.target_id,
      name: getTargetDisplayName(t)
    }));
    setPendingCategoryTargets(existingTargets);
    setShowCategoryForm(true);
  };

  const editResource = (resource) => {
    if (!canEdit) {
      showMessage("У вас нет прав на редактирование ресурсов", "error");
      return;
    }
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
    const existingTargets = (resource.targets || []).map(t => ({
      type: t.target_type,
      id: t.target_id,
      name: getTargetDisplayName(t)
    }));
    setPendingResourceTargets(existingTargets);
    setShowResourceForm(true);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const getTargetDisplayName = (target) => {
    if (target.target_type === "group") {
      const group = adGroups.find(g => g.id == target.target_id);
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
      const res = await fetch(`/api/users/authorized?query=${encodeURIComponent(query)}&limit=10`, {
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

  const renderCategoryTargetsSection = () => {
    const displayTargets = editingCategory 
      ? (categoryTargets[editingCategory.id] || [])
      : pendingCategoryTargets.map(t => ({ target_type: t.type, target_id: t.id }));
    
    const onRemove = editingCategory
      ? (target) => removeCategoryTarget(editingCategory.id, target)
      : (target) => removeCategoryTargetTemp(target.target_id, target.target_type);
    
    const addTarget = editingCategory
      ? (type, id, name) => addCategoryTarget(editingCategory.id, type, id, name)
      : (type, id, name) => addCategoryTargetTemp(type, id, name);

    if (displayTargets.length === 0 && !editingCategory) {
      return (
        <div style={styles.targetsSection}>
          <div style={{ marginBottom: 12, fontSize: 13, color: textMuted }}>🎯 Получатели (будут добавлены после сохранения):</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <button onClick={() => setCategoryTargetType("group")} style={{ padding: "6px 12px", borderRadius: 6, background: categoryTargetType === "group" ? "#3b82f6" : borderColor, color: categoryTargetType === "group" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
              👥 AD Группа
            </button>
            <button onClick={() => setCategoryTargetType("user")} style={{ padding: "6px 12px", borderRadius: 6, background: categoryTargetType === "user" ? "#3b82f6" : borderColor, color: categoryTargetType === "user" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
              👤 Пользователь
            </button>
          </div>
          
          {categoryTargetType === "group" ? (
            <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addTarget("group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={styles.select}>
              <option value="">-- Выберите группу --</option>
              {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
            </select>
          ) : (
            <div>
              <input type="text" placeholder="Поиск пользователя..." value={categoryTargetSearch} onChange={e => setCategoryTargetSearch(e.target.value)} style={styles.input} />
              {categoryTargetResults.length > 0 && (
                <div style={styles.searchResultsBox}>
                  {categoryTargetResults.map(u => (
                    <div key={u.username} style={styles.searchResultItem} onClick={() => { addTarget("user", u.username, u.display_name || u.username); setCategoryTargetSearch(""); setCategoryTargetResults([]); }}>
                      <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11, color: textMuted }}>{u.username}</div></div>
                      <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={styles.targetsSection}>
        <TargetsList
          targets={displayTargets}
          onRemove={onRemove}
          getTargetName={getTargetDisplayName}
          title={editingCategory ? "🎯 Текущие получатели:" : "🎯 Получатели (будут добавлены после сохранения):"}
          darkMode={darkMode}
        />
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <button onClick={() => setCategoryTargetType("group")} style={{ padding: "6px 12px", borderRadius: 6, background: categoryTargetType === "group" ? "#3b82f6" : borderColor, color: categoryTargetType === "group" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
            👥 AD Группа
          </button>
          <button onClick={() => setCategoryTargetType("user")} style={{ padding: "6px 12px", borderRadius: 6, background: categoryTargetType === "user" ? "#3b82f6" : borderColor, color: categoryTargetType === "user" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
            👤 Пользователь
          </button>
        </div>
        
        {categoryTargetType === "group" ? (
          <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addTarget("group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={styles.select}>
            <option value="">-- Выберите группу --</option>
            {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
          </select>
        ) : (
          <div>
            <input type="text" placeholder="Поиск пользователя..." value={categoryTargetSearch} onChange={e => setCategoryTargetSearch(e.target.value)} style={styles.input} />
            {categoryTargetResults.length > 0 && (
              <div style={styles.searchResultsBox}>
                {categoryTargetResults.map(u => (
                  <div key={u.username} style={styles.searchResultItem} onClick={() => { addTarget("user", u.username, u.display_name || u.username); setCategoryTargetSearch(""); setCategoryTargetResults([]); }}>
                    <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11, color: textMuted }}>{u.username}</div></div>
                    <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderResourceTargetsSection = () => {
    const displayTargets = editingResource 
      ? (resourceTargets[editingResource.id] || [])
      : pendingResourceTargets.map(t => ({ target_type: t.type, target_id: t.id }));
    
    const onRemove = editingResource
      ? (target) => removeResourceTarget(editingResource.id, target)
      : (target) => removeResourceTargetTemp(target.target_id, target.target_type);
    
    const addTarget = editingResource
      ? (type, id, name) => addResourceTarget(editingResource.id, type, id, name)
      : (type, id, name) => addResourceTargetTemp(type, id, name);

    if (displayTargets.length === 0 && !editingResource) {
      return (
        <div style={styles.targetsSection}>
          <div style={{ marginBottom: 12, fontSize: 13, color: textMuted }}>🎯 Получатели (будут добавлены после сохранения):</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <button onClick={() => setResourceTargetType("group")} style={{ padding: "6px 12px", borderRadius: 6, background: resourceTargetType === "group" ? "#3b82f6" : borderColor, color: resourceTargetType === "group" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
              👥 AD Группа
            </button>
            <button onClick={() => setResourceTargetType("user")} style={{ padding: "6px 12px", borderRadius: 6, background: resourceTargetType === "user" ? "#3b82f6" : borderColor, color: resourceTargetType === "user" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
              👤 Пользователь
            </button>
          </div>
          
          {resourceTargetType === "group" ? (
            <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addTarget("group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={styles.select}>
              <option value="">-- Выберите группу --</option>
              {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
            </select>
          ) : (
            <div>
              <input type="text" placeholder="Поиск пользователя..." value={resourceTargetSearch} onChange={e => setResourceTargetSearch(e.target.value)} style={styles.input} />
              {resourceTargetResults.length > 0 && (
                <div style={styles.searchResultsBox}>
                  {resourceTargetResults.map(u => (
                    <div key={u.username} style={styles.searchResultItem} onClick={() => { addTarget("user", u.username, u.display_name || u.username); setResourceTargetSearch(""); setResourceTargetResults([]); }}>
                      <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11, color: textMuted }}>{u.username}</div></div>
                      <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={styles.targetsSection}>
        <TargetsList
          targets={displayTargets}
          onRemove={onRemove}
          getTargetName={getTargetDisplayName}
          title={editingResource ? "🎯 Свои получатели ресурса:" : "🎯 Получатели (будут добавлены после сохранения):"}
          darkMode={darkMode}
        />
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <button onClick={() => setResourceTargetType("group")} style={{ padding: "6px 12px", borderRadius: 6, background: resourceTargetType === "group" ? "#3b82f6" : borderColor, color: resourceTargetType === "group" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
            👥 AD Группа
          </button>
          <button onClick={() => setResourceTargetType("user")} style={{ padding: "6px 12px", borderRadius: 6, background: resourceTargetType === "user" ? "#3b82f6" : borderColor, color: resourceTargetType === "user" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
            👤 Пользователь
          </button>
        </div>
        
        {resourceTargetType === "group" ? (
          <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addTarget("group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={styles.select}>
            <option value="">-- Выберите группу --</option>
            {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
          </select>
        ) : (
          <div>
            <input type="text" placeholder="Поиск пользователя..." value={resourceTargetSearch} onChange={e => setResourceTargetSearch(e.target.value)} style={styles.input} />
            {resourceTargetResults.length > 0 && (
              <div style={styles.searchResultsBox}>
                {resourceTargetResults.map(u => (
                  <div key={u.username} style={styles.searchResultItem} onClick={() => { addTarget("user", u.username, u.display_name || u.username); setResourceTargetSearch(""); setResourceTargetResults([]); }}>
                    <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11, color: textMuted }}>{u.username}</div></div>
                    <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={{ margin: 0, fontSize: 16, color: textColor }}>📂 Управление ресурсами и категориями</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { fetchCategories(); fetchResources(); }} style={styles.buttonIcon} title="Обновить">
              <RefreshCw size={16} />
            </button>
            {canEdit && (
              <>
                <button onClick={() => { resetCategoryForm(); setShowCategoryForm(true); }} style={styles.buttonPrimary}>
                  <Plus size={14} /> Добавить категорию
                </button>
                <button onClick={() => { resetResourceForm(); setShowResourceForm(true); }} style={styles.buttonPrimary}>
                  <Plus size={14} /> Добавить ресурс
                </button>
              </>
            )}
          </div>
        </div>

        {categories.length === 0 && resources.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: textMuted }}>
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
                <div key={category.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <div style={styles.categoryHeader} onClick={() => toggleCategory(category.id)}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span style={{ fontSize: 20 }}>{category.icon || "📁"}</span>
                    <strong>{category.name}</strong>
                    <span style={{ ...styles.badge, ...(category.is_global ? styles.badgeGlobal : styles.badgeGroup) }}>
                      {category.is_global ? "🌍 Для всех" : "👥 Ограниченный доступ"}
                    </span>
                    <span style={{ fontSize: 12, color: textMuted }}>({categoryResources.length})</span>
                    {canEdit && (
                      <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); editCategory(category); }} style={styles.buttonIcon}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteCategory(category.id); }} style={{ ...styles.buttonIcon, color: "#dc2626" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div>
                      {category.description && (
                        <div style={{ padding: "8px 16px", fontSize: 12, color: textMuted, background: headerBg, marginLeft: 32 }}>
                          {category.description}
                        </div>
                      )}
                      
                      {!category.is_global && targets.length > 0 && (
                        <div style={{ padding: "8px 16px", marginLeft: 32, borderBottom: `1px solid ${borderColor}`, background: headerBg }}>
                          <TargetsList
                            targets={targets}
                            onRemove={(target) => removeCategoryTarget(category.id, target)}
                            getTargetName={getTargetDisplayName}
                            title="🎯 Кто имеет доступ к категории:"
                            darkMode={darkMode}
                          />
                        </div>
                      )}
                      
                      {!category.is_global && canEdit && (
                        <div style={{ padding: "8px 16px", marginLeft: 32, borderBottom: `1px solid ${borderColor}` }}>
                          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                            <button onClick={() => setCategoryTargetType("group")} style={{ padding: "4px 10px", borderRadius: 6, background: categoryTargetType === "group" ? "#3b82f6" : borderColor, color: categoryTargetType === "group" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 11 }}>👥 Группа</button>
                            <button onClick={() => setCategoryTargetType("user")} style={{ padding: "4px 10px", borderRadius: 6, background: categoryTargetType === "user" ? "#3b82f6" : borderColor, color: categoryTargetType === "user" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 11 }}>👤 Пользователь</button>
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
                                      <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11, color: textMuted }}>{u.username}</div></div>
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
                        <div style={{ padding: "20px 16px", color: textMuted, fontSize: 13, textAlign: "center", marginLeft: 32 }}>
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
                                  <div style={{ fontSize: 11, color: textMuted, fontFamily: "monospace", marginTop: 4, wordBreak: "break-all" }}>
                                    {resource.resource_path}
                                  </div>
                                </div>
                                {canEdit && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => editResource(resource)} style={styles.buttonIcon}>
                                      <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => deleteResource(resource.id)} style={{ ...styles.buttonIcon, color: "#dc2626" }}>
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              {isExpandedResource && !resource.is_global && canEdit && (
                                <div style={{ padding: "8px 16px", marginLeft: 64, borderBottom: `1px solid ${borderColor}`, background: headerBg }}>
                                  {resourceTargetsList.length > 0 && (
                                    <TargetsList
                                      targets={resourceTargetsList}
                                      onRemove={(target) => removeResourceTarget(resource.id, target)}
                                      getTargetName={getTargetDisplayName}
                                      title="🎯 Кто имеет доступ к ресурсу (свои права):"
                                      darkMode={darkMode}
                                    />
                                  )}
                                  
                                  {resource.inherits_from_category && resource.category_id && (
                                    <div style={{ marginBottom: 16, padding: 8, background: darkMode ? "#1e3a5f" : "#e0f2fe", borderRadius: 8, fontSize: 12, color: textColor }}>
                                      <strong>📋 Наследование:</strong> Ресурс наследует права от категории "{categories.find(c => c.id === resource.category_id)?.name}"
                                    </div>
                                  )}
                                  
                                  <div>
                                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                                      <button onClick={() => setResourceTargetType("group")} style={{ padding: "4px 10px", borderRadius: 6, background: resourceTargetType === "group" ? "#3b82f6" : borderColor, color: resourceTargetType === "group" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 11 }}>👥 Группа</button>
                                      <button onClick={() => setResourceTargetType("user")} style={{ padding: "4px 10px", borderRadius: 6, background: resourceTargetType === "user" ? "#3b82f6" : borderColor, color: resourceTargetType === "user" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 11 }}>👤 Пользователь</button>
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
                                                <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11, color: textMuted }}>{u.username}</div></div>
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
                  <span style={{ fontSize: 12, color: textMuted }}>({resources.filter(r => !r.category_id).length})</span>
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
                      <div style={{ fontSize: 11, color: textMuted, fontFamily: "monospace", marginTop: 4 }}>
                        {resource.resource_path}
                      </div>
                    </div>
                    {canEdit && (
                      <div>
                        <button onClick={() => editResource(resource)} style={styles.buttonIcon}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteResource(resource.id)} style={{ ...styles.buttonIcon, color: "#dc2626" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCategoryForm && (
        <div 
          style={styles.modal} 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowCategoryForm(false);
            }
          }}
        >
          <div style={styles.modalContent} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: textColor }}>{editingCategory ? "✏️ Редактировать" : "➕ Новая"} категория</h3>
              <button onClick={() => setShowCategoryForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: textMuted }}>✕</button>
            </div>
            
            <input type="text" placeholder="Название *" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} style={styles.input} />
            <input type="text" placeholder="Описание" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} style={{ ...styles.input, marginTop: 12 }} />
            <input type="text" placeholder="Иконка" value={categoryForm.icon} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })} style={{ ...styles.input, marginTop: 12 }} />
            <input type="number" placeholder="Порядок" value={categoryForm.sort_order} onChange={e => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })} style={{ ...styles.input, marginTop: 12 }} />

            <div style={styles.radioGroup}>
              <label><input type="radio" checked={categoryForm.is_global === 1} onChange={() => setCategoryForm({ ...categoryForm, is_global: 1 })} /> 🌍 Для всех</label>
              <label><input type="radio" checked={categoryForm.is_global === 0} onChange={() => setCategoryForm({ ...categoryForm, is_global: 0 })} /> 👥 Для конкретных</label>
            </div>

            {categoryForm.is_global === 0 && renderCategoryTargetsSection()}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowCategoryForm(false)} style={{ padding: "8px 20px", border: `1px solid ${borderColor}`, borderRadius: 8, background: inputBg, cursor: "pointer", color: textColor }}>Отмена</button>
              {canEdit && (
                <button onClick={saveCategory} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>
                  <Save size={14} /> Сохранить
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showResourceForm && (
        <div 
          style={styles.modal} 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowResourceForm(false);
            }
          }}
        >
          <div style={styles.modalContent} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: textColor }}>{editingResource ? "✏️ Редактировать" : "➕ Новый"} ресурс</h3>
              <button onClick={() => setShowResourceForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: textMuted }}>✕</button>
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
              <div style={{ marginBottom: 16, padding: 12, background: headerBg, borderRadius: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: textColor }}>
                  <input 
                    type="checkbox" 
                    checked={resourceForm.inherit_from_category === 1}
                    onChange={(e) => setResourceForm({ ...resourceForm, inherit_from_category: e.target.checked ? 1 : 0 })}
                  />
                  <span>📋 Наследовать права от категории (при включении все свои настройки доступа будут удалены)</span>
                </label>
              </div>
            )}

            {resourceForm.is_global === 0 && (!editingResource || (editingResource && resourceForm.inherit_from_category !== 1)) && renderResourceTargetsSection()}

            {resourceForm.is_global === 0 && editingResource && resourceForm.inherit_from_category === 1 && resourceForm.category_id && (
              <div style={{ ...styles.targetsSection, background: darkMode ? "#1e3a5f" : "#e0f2fe" }}>
                <div style={{ fontSize: 13, color: textColor }}>
                  <strong>📋 Ресурс наследует права от категории</strong>
                  <div style={{ marginTop: 8, fontSize: 12, color: textMuted }}>
                    Чтобы настроить свои права для этого ресурса, снимите галочку "Наследовать права от категории"
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowResourceForm(false)} style={{ padding: "8px 20px", border: `1px solid ${borderColor}`, borderRadius: 8, background: inputBg, cursor: "pointer", color: textColor }}>Отмена</button>
              {canEdit && (
                <button onClick={saveResource} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>
                  <Save size={14} /> Сохранить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ServicesManager = ({ adGroups, usersMap, getToken, showMessage, canEdit, darkMode }) => {
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
  const [pendingServiceTargets, setPendingServiceTargets] = useState([]);

  // Базовые цвета для тёмной/светлой темы
  const bgColor = darkMode ? "#1e293b" : "white";
  const headerBg = darkMode ? "#0f172a" : "#f8fafc";
  const borderColor = darkMode ? "#475569" : "#e2e8f0";
  const borderLight = darkMode ? "#334155" : "#e2e8f0";
  const textColor = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "#0f172a" : "white";

  const styles = {
    card: { background: bgColor, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden", marginBottom: 24 },
    cardHeader: {
      padding: "16px 20px", borderBottom: `1px solid ${borderColor}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: headerBg, flexWrap: "wrap", gap: 10, color: textColor
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "12px 16px", borderBottom: `1px solid ${borderColor}`, fontWeight: 600, fontSize: 13, color: textColor },
    td: { padding: "12px 16px", borderBottom: `1px solid ${borderLight}`, fontSize: 13, color: textColor },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 },
    buttonIcon: { background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center", color: textMuted },
    input: { width: "100%", padding: "8px 12px", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: inputBg, color: textColor },
    select: { width: "100%", padding: "8px 12px", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 13, background: inputBg, color: textColor },
    modal: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    },
    modalContent: { background: bgColor, borderRadius: 20, padding: 24, width: 650, maxWidth: "90%", maxHeight: "85vh", overflowY: "auto", overflowX: "hidden", color: textColor },
    radioGroup: { display: "flex", gap: 20, marginBottom: 16, alignItems: "center", color: textColor },
    targetsSection: { marginTop: 16, padding: 12, background: headerBg, borderRadius: 8, border: `1px solid ${borderColor}` },
    searchResultsBox: { border: `1px solid ${borderColor}`, borderRadius: 8, maxHeight: 150, overflow: "auto", marginTop: 8, background: bgColor },
    searchResultItem: { padding: "10px 12px", borderBottom: `1px solid ${borderColor}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: textColor },
    badge: { display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 },
    badgeGlobal: { background: "#10b98120", color: "#10b981" },
    badgeGroup: { background: "#3b82f620", color: "#3b82f6" }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services", {
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

  const addServiceTarget = async (serviceId, targetType, targetId, targetName) => {
    if (!targetId) return;
    try {
      const res = await fetch(`/api/admin/services/${serviceId}/targets`, {
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
      const res = await fetch(`/api/admin/services/${serviceId}/targets/${targetDbId}`, {
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

  const addServiceTargetTemp = (targetType, targetId, targetName) => {
    if (pendingServiceTargets.some(t => t.id === targetId && t.type === targetType)) {
      showMessage("❌ Этот получатель уже добавлен", "error");
      return;
    }
    setPendingServiceTargets([...pendingServiceTargets, { type: targetType, id: targetId, name: targetName }]);
    showMessage(`✅ Получатель "${targetName}" добавлен (будет сохранён после создания сервиса)`);
    setServiceTargetSearch("");
    setServiceTargetResults([]);
  };

  const removeServiceTargetTemp = (targetId, targetType) => {
    setPendingServiceTargets(pendingServiceTargets.filter(t => !(t.id === targetId && t.type === targetType)));
    showMessage("🗑️ Получатель удален из списка");
  };

  const saveService = async () => {
    if (!canEdit) {
      showMessage("У вас нет прав на создание сервисов", "error");
      return;
    }
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
      ? `/api/admin/services/${editingService.id}`
      : "/api/admin/services";
    const method = editingService ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const serviceId = editingService ? editingService.id : data.id;
        
        if (!editingService && pendingServiceTargets.length > 0) {
          for (const target of pendingServiceTargets) {
            await fetch(`/api/admin/services/${serviceId}/targets`, {
              method: "POST",
              headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ target_type: target.type, target_id: target.id })
            });
          }
          setPendingServiceTargets([]);
        }
        
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
    if (!canEdit) {
      showMessage("У вас нет прав на удаление сервисов", "error");
      return;
    }
    if (!confirm("Удалить сервис?")) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
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

  const resetForm = () => {
    setServiceForm({ service_name: "", service_url: "", service_icon: "🔗", is_global: 0, sort_order: 0 });
    setEditingService(null);
    setShowForm(false);
    setServiceTargetSearch("");
    setServiceTargetResults([]);
    setPendingServiceTargets([]);
  };

  const editService = (service) => {
    if (!canEdit) {
      showMessage("У вас нет прав на редактирование сервисов", "error");
      return;
    }
    setServiceForm({
      service_name: service.service_name,
      service_url: service.service_url,
      service_icon: service.service_icon || "🔗",
      is_global: service.is_global || 0,
      sort_order: service.sort_order || 0
    });
    setEditingService(service);
    const existingTargets = (service.targets || []).map(t => ({
      type: t.target_type,
      id: t.target_id,
      name: getTargetDisplayName(t)
    }));
    setPendingServiceTargets(existingTargets);
    setShowForm(true);
  };

  const getTargetDisplayName = (target) => {
    if (target.target_type === "group") {
      const group = adGroups.find(g => g.id == target.target_id);
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
      const res = await fetch(`/api/users/authorized?query=${encodeURIComponent(query)}&limit=10`, {
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

  const renderServiceTargetsSection = () => {
    const displayTargets = editingService 
      ? (serviceTargets[editingService.id] || [])
      : pendingServiceTargets.map(t => ({ target_type: t.type, target_id: t.id }));
    
    const onRemove = editingService
      ? (target) => removeServiceTarget(editingService.id, target)
      : (target) => removeServiceTargetTemp(target.target_id, target.target_type);
    
    const addTarget = editingService
      ? (type, id, name) => addServiceTarget(editingService.id, type, id, name)
      : (type, id, name) => addServiceTargetTemp(type, id, name);

    if (displayTargets.length === 0 && !editingService) {
      return (
        <div style={styles.targetsSection}>
          <div style={{ marginBottom: 12, fontSize: 13, color: textMuted }}>🎯 Получатели (будут добавлены после сохранения):</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <button onClick={() => setServiceTargetType("group")} style={{ padding: "6px 12px", borderRadius: 6, background: serviceTargetType === "group" ? "#3b82f6" : borderColor, color: serviceTargetType === "group" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
              👥 AD Группа
            </button>
            <button onClick={() => setServiceTargetType("user")} style={{ padding: "6px 12px", borderRadius: 6, background: serviceTargetType === "user" ? "#3b82f6" : borderColor, color: serviceTargetType === "user" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
              👤 Пользователь
            </button>
          </div>
          
          {serviceTargetType === "group" ? (
            <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addTarget("group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={styles.select}>
              <option value="">-- Выберите группу --</option>
              {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
            </select>
          ) : (
            <div>
              <input type="text" placeholder="Поиск пользователя..." value={serviceTargetSearch} onChange={e => setServiceTargetSearch(e.target.value)} style={styles.input} />
              {serviceTargetResults.length > 0 && (
                <div style={styles.searchResultsBox}>
                  {serviceTargetResults.map(u => (
                    <div key={u.username} style={styles.searchResultItem} onClick={() => { addTarget("user", u.username, u.display_name || u.username); setServiceTargetSearch(""); setServiceTargetResults([]); }}>
                      <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11, color: textMuted }}>{u.username}</div></div>
                      <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={styles.targetsSection}>
        <TargetsList
          targets={displayTargets}
          onRemove={onRemove}
          getTargetName={getTargetDisplayName}
          title={editingService ? "🎯 Получатели:" : "🎯 Получатели (будут добавлены после сохранения):"}
          darkMode={darkMode}
        />
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <button onClick={() => setServiceTargetType("group")} style={{ padding: "6px 12px", borderRadius: 6, background: serviceTargetType === "group" ? "#3b82f6" : borderColor, color: serviceTargetType === "group" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
            👥 AD Группа
          </button>
          <button onClick={() => setServiceTargetType("user")} style={{ padding: "6px 12px", borderRadius: 6, background: serviceTargetType === "user" ? "#3b82f6" : borderColor, color: serviceTargetType === "user" ? "white" : textColor, border: "none", cursor: "pointer", fontSize: 12 }}>
            👤 Пользователь
          </button>
        </div>
        
        {serviceTargetType === "group" ? (
          <select onChange={(e) => { if (e.target.value) { const group = adGroups.find(g => g.id == e.target.value); addTarget("group", e.target.value, group?.display_name || group?.group_name); e.target.value = ""; } }} style={styles.select}>
            <option value="">-- Выберите группу --</option>
            {adGroups.map(g => <option key={g.id} value={g.id}>{g.display_name || g.group_name}</option>)}
          </select>
        ) : (
          <div>
            <input type="text" placeholder="Поиск пользователя..." value={serviceTargetSearch} onChange={e => setServiceTargetSearch(e.target.value)} style={styles.input} />
            {serviceTargetResults.length > 0 && (
              <div style={styles.searchResultsBox}>
                {serviceTargetResults.map(u => (
                  <div key={u.username} style={styles.searchResultItem} onClick={() => { addTarget("user", u.username, u.display_name || u.username); setServiceTargetSearch(""); setServiceTargetResults([]); }}>
                    <div><strong>{u.display_name || u.username}</strong><div style={{ fontSize: 11, color: textMuted }}>{u.username}</div></div>
                    <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Выбрать</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={{ margin: 0, fontSize: 16, color: textColor }}>🔗 Управление сервисами</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchServices} style={styles.buttonIcon} title="Обновить">
              <RefreshCw size={16} />
            </button>
            {canEdit && (
              <button onClick={() => { resetForm(); setShowForm(true); }} style={styles.buttonPrimary}>
                <Plus size={14} /> Добавить сервис
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}><Loader size={32} /></div>
        ) : services.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: textMuted }}>
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
                  {canEdit && <th style={styles.th}>Действия</th>}
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td style={styles.td}>{s.id}</td>
                    <td style={styles.td}>{s.service_icon}</td>
                    <td style={styles.td}><strong>{s.service_name}</strong></td>
                    <td style={styles.td}><code style={{ fontSize: 11, color: textMuted }}>{s.service_url}</code></td>
                    <td style={styles.td}>
                      {s.is_global ? (
                        <span style={{ ...styles.badge, ...styles.badgeGlobal }}>🌍 Для всех</span>
                      ) : (
                        <span style={{ ...styles.badge, ...styles.badgeGroup }}>👥 Ограниченный доступ</span>
                      )}
                    </td>
                    <td style={styles.td}>{s.sort_order || 0}</td>
                    {canEdit && (
                      <td style={styles.td}>
                        <button onClick={() => editService(s)} style={styles.buttonIcon}><Edit2 size={14} /></button>
                        <button onClick={() => deleteService(s.id)} style={{ ...styles.buttonIcon, color: "#dc2626" }}><Trash2 size={14} /></button>
                      </td>
                    )}
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
              <h3 style={{ color: textColor }}>{editingService ? "✏️ Редактировать" : "➕ Новый"} сервис</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: textMuted }}>✕</button>
            </div>
            
            <input type="text" placeholder="Название *" value={serviceForm.service_name} onChange={e => setServiceForm({ ...serviceForm, service_name: e.target.value })} style={styles.input} />
            <input type="text" placeholder="URL *" value={serviceForm.service_url} onChange={e => setServiceForm({ ...serviceForm, service_url: e.target.value })} style={{ ...styles.input, marginTop: 12 }} />
            <input type="text" placeholder="Иконка" value={serviceForm.service_icon} onChange={e => setServiceForm({ ...serviceForm, service_icon: e.target.value })} style={{ ...styles.input, marginTop: 12 }} />
            <input type="number" placeholder="Порядок" value={serviceForm.sort_order} onChange={e => setServiceForm({ ...serviceForm, sort_order: parseInt(e.target.value) || 0 })} style={{ ...styles.input, marginTop: 12 }} />

            <div style={styles.radioGroup}>
              <label><input type="radio" checked={serviceForm.is_global === 1} onChange={() => setServiceForm({ ...serviceForm, is_global: 1 })} /> 🌍 Для всех</label>
              <label><input type="radio" checked={serviceForm.is_global === 0} onChange={() => setServiceForm({ ...serviceForm, is_global: 0 })} /> 👥 Для конкретных</label>
            </div>

            {serviceForm.is_global === 0 && renderServiceTargetsSection()}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 20px", border: `1px solid ${borderColor}`, borderRadius: 8, background: inputBg, cursor: "pointer", color: textColor }}>Отмена</button>
              {canEdit && (
                <button onClick={saveService} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>
                  <Save size={14} /> Сохранить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UsersManager = ({ roles, getToken, showMessage, canEdit, darkMode }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userRolesMap, setUserRolesMap] = useState({});
  const [updating, setUpdating] = useState(null);

  // Базовые цвета для тёмной/светлой темы
  const bgColor = darkMode ? "#1e293b" : "white";
  const headerBg = darkMode ? "#0f172a" : "#f8fafc";
  const borderColor = darkMode ? "#475569" : "#e2e8f0";
  const borderLight = darkMode ? "#334155" : "#e2e8f0";
  const textColor = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "#0f172a" : "white";

  const styles = {
    card: { background: bgColor, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden", marginBottom: 24 },
    cardHeader: { padding: "16px 20px", borderBottom: `1px solid ${borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: headerBg, flexWrap: "wrap", gap: 10, color: textColor },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "12px 16px", borderBottom: `1px solid ${borderColor}`, fontWeight: 600, fontSize: 13, color: textColor },
    td: { padding: "12px 16px", borderBottom: `1px solid ${borderLight}`, fontSize: 13, color: textColor },
    select: { padding: "6px 12px", border: `1px solid ${borderColor}`, borderRadius: 6, fontSize: 12, background: inputBg, color: textColor, minWidth: 160 },
    input: { width: "100%", padding: "8px 12px", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: inputBg, color: textColor },
    userSearchBox: { display: "flex", gap: 8, alignItems: "center", background: inputBg, border: `1px solid ${borderColor}`, borderRadius: 8, padding: "6px 12px", flex: 1 },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 },
    buttonIcon: { background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center", color: textMuted },
    badge: { display: "inline-block", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 },
    searchResultItem: { padding: "10px 12px", borderBottom: `1px solid ${borderColor}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.2s", color: textColor },
    searchResultsBox: { border: `1px solid ${borderColor}`, borderRadius: 8, maxHeight: 200, overflow: "auto", marginTop: 8, background: bgColor, position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }
  };

  const fetchUserRoles = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok && data.users) {
        const rolesMap = {};
        data.users.forEach(u => {
          rolesMap[u.username] = u.role;
        });
        setUserRolesMap(rolesMap);
        return rolesMap;
      }
    } catch (err) {
      console.error("Ошибка загрузки ролей:", err);
      return {};
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const rolesMap = await fetchUserRoles();
      const res = await fetch("/api/users/authorized?query=&limit=1000", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok && data.users) {
        const usersWithRoles = data.users.map(u => ({
          ...u,
          role: rolesMap[u.username] || "user"
        }));
        setUsers(usersWithRoles);
        setFilteredUsers(usersWithRoles);
      }
    } catch (err) {
      console.error(err);
      showMessage("Ошибка загрузки пользователей", "error");
    }
    setLoading(false);
  };

  const updateUserRole = async (username, newRole) => {
    if (!canEdit) {
      showMessage("У вас нет прав на изменение ролей", "error");
      return;
    }
    setUpdating(username);
    const formData = new FormData();
    formData.append("role_name", newRole);

    try {
      const res = await fetch(`/api/admin/users/${username}/role`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        showMessage(`✅ Роль "${getRoleDisplayName(newRole)}" назначена пользователю ${username}`);
        await fetchAllUsers();
      } else {
        const error = await res.json();
        showMessage(error.detail || "Ошибка при назначении роли", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    } finally {
      setUpdating(null);
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

  const getRoleBadgeStyle = (role) => {
    switch(role) {
      case "admin": return { background: "#ef444420", color: "#ef4444" };
      case "it_engineer": return { background: "#8b5cf620", color: "#8b5cf6" };
      case "department_head": return { background: "#f59e0b20", color: "#f59e0b" };
      case "moderator": return { background: "#10b98120", color: "#10b981" };
      default: return { background: "#64748b20", color: "#64748b" };
    }
  };

  const searchAdUsers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/users/authorized?query=${encodeURIComponent(query)}&limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        const existingUsernames = new Set(users.map(u => u.username));
        const newUsers = (data.users || []).filter(u => !existingUsernames.has(u.username));
        setSearchResults(newUsers);
      }
    } catch (err) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const addNewUser = async (user) => {
    if (!canEdit) {
      showMessage("У вас нет прав на добавление пользователей", "error");
      return;
    }
    if (users.some(u => u.username === user.username)) {
      showMessage(`❌ Пользователь ${user.display_name || user.username} уже есть в списке`, "error");
      setSearchResults([]);
      setSearchQuery("");
      return;
    }
    
    const formData = new FormData();
    formData.append("role_name", "user");
    
    try {
      const res = await fetch(`/api/admin/users/${user.username}/role`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        showMessage(`✅ Пользователь ${user.display_name || user.username} добавлен в портал`);
        await fetchAllUsers();
        setSearchResults([]);
        setSearchQuery("");
      } else {
        showMessage("Ошибка при добавлении пользователя", "error");
      }
    } catch (err) {
      showMessage("Ошибка соединения", "error");
    }
  };

  const filterLocalUsers = (query) => {
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = users.filter(u => 
      u.username.toLowerCase().includes(lowerQuery) ||
      (u.display_name && u.display_name.toLowerCase().includes(lowerQuery))
    );
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) {
        searchAdUsers(searchQuery);
        filterLocalUsers("");
      } else if (searchQuery.length > 0 && searchQuery.length < 2) {
        setSearchResults([]);
        filterLocalUsers(searchQuery);
      } else if (searchQuery.length === 0) {
        setSearchResults([]);
        filterLocalUsers("");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading && users.length === 0) {
    return (
      <div style={styles.card}>
        <div style={{ padding: 60, textAlign: "center" }}>
          <Loader size={32} />
          <p style={{ marginTop: 12, color: textMuted }}>Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={{ margin: 0, fontSize: 16, color: textColor }}>👥 Зарегистрированные пользователи</h3>
          <button onClick={fetchAllUsers} style={styles.buttonIcon} title="Обновить">
            <RefreshCw size={16} />
          </button>
        </div>
        
        <div style={{ padding: 20, borderBottom: `1px solid ${borderColor}`, background: headerBg }}>
          <h4 style={{ fontSize: 14, marginBottom: 12, color: textColor }}>🔍 Поиск и добавление пользователей</h4>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={styles.userSearchBox}>
                <Search size={16} style={{ color: textMuted }} />
                <input 
                  type="text" 
                  placeholder="Поиск по имени пользователя (минимум 2 символа)..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: textColor }} 
                />
                {searching && <Loader size={14} />}
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={styles.buttonIcon}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            
            {searchResults.length > 0 && (
              <div style={styles.searchResultsBox}>
                {searchResults.map(user => (
                  <div 
                    key={user.username} 
                    style={styles.searchResultItem}
                    onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? "#334155" : "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = bgColor}
                    onClick={() => canEdit && addNewUser(user)}
                  >
                    <div>
                      <strong>{user.display_name || user.username}</strong>
                      <div style={{ fontSize: 11, color: textMuted }}>{user.username}</div>
                    </div>
                    {canEdit && (
                      <button style={styles.buttonPrimary}>
                        <UserPlus size={14} /> Добавить
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: 14, margin: "16px 20px 12px", color: textColor }}>
            📋 Список пользователей ({filteredUsers.length})
          </h4>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: textMuted }}>
              <Users size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>Нет пользователей</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Имя пользователя</th>
                    <th style={styles.th}>Логин</th>
                    <th style={styles.th}>Роль</th>
                    {canEdit && <th style={styles.th}>Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.username}>
                      <td style={styles.td}>
                        <strong>{user.display_name || user.username}</strong>
                      </td>
                      <td style={styles.td}>
                        <code style={{ fontSize: 12, color: textMuted }}>{user.username}</code>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...getRoleBadgeStyle(user.role) }}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      {canEdit && (
                        <td style={styles.td}>
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.username, e.target.value)}
                            style={styles.select}
                            disabled={updating === user.username}
                          >
                            {roles.map(r => (
                              <option key={r.id} value={r.role_name}>
                                {getRoleDisplayName(r.role_name)}
                              </option>
                            ))}
                          </select>
                          {updating === user.username && <Loader size={14} style={{ marginLeft: 8 }} />}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ darkMode }) => {
  const { user, token, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState("resources");
  const [message, setMessage] = useState({ text: "", type: "" });

  const [adGroups, setAdGroups] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDisplay, setNewGroupDisplay] = useState("");
  const [roles, setRoles] = useState([]);

  const isAdmin = userRole === "admin" || user?.groups?.includes("!citovmt") || user?.group === "!citovmt";
  const isModerator = userRole === "moderator";
  const canViewAdmin = isAdmin || isModerator;
  const canEdit = isAdmin;

  // Базовые цвета для тёмной/светлой темы
  const bgColor = darkMode ? "#1e293b" : "white";
  const headerBg = darkMode ? "#0f172a" : "#f8fafc";
  const borderColor = darkMode ? "#475569" : "#e2e8f0";
  const textColor = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "#0f172a" : "white";

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const getToken = () => localStorage.getItem("token") || token;

  const styles = {
    container: { padding: 24 },
    tabs: { display: "flex", gap: 8, borderBottom: `1px solid ${borderColor}`, marginBottom: 24, flexWrap: "wrap" },
    tab: { padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, borderRadius: 8, display: "flex", alignItems: "center", gap: 8, color: textMuted },
    tabActive: { background: "#3b82f6", color: "white" },
    card: { background: bgColor, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden", marginBottom: 24 },
    cardHeader: { padding: "16px 20px", borderBottom: `1px solid ${borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: headerBg, color: textColor },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "12px 16px", borderBottom: `1px solid ${borderColor}`, fontWeight: 600, fontSize: 13, color: textColor },
    td: { padding: "12px 16px", borderBottom: `1px solid ${borderColor}`, fontSize: 13, color: textColor },
    buttonPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 },
    buttonIcon: { background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center", color: textMuted },
    input: { width: "100%", padding: "8px 12px", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: inputBg, color: textColor },
    userSearchBox: { display: "flex", gap: 8, alignItems: "center", background: inputBg, border: `1px solid ${borderColor}`, borderRadius: 8, padding: "6px 12px" }
  };

  const fetchAdGroups = async () => {
    if (!canViewAdmin) return;
    try {
      const res = await fetch("/api/admin/groups", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setAdGroups(data.groups || []);
    } catch (err) { console.error(err); }
  };

  const fetchUsersMap = async () => {
    if (!canViewAdmin) return;
    try {
      const res = await fetch("/api/users/authorized?query=&limit=100000", {
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

  const fetchRoles = async () => {
    if (!canViewAdmin) return;
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) setRoles(data.roles || []);
    } catch (err) { console.error(err); }
  };

  const addAdGroup = async () => {
    if (!canEdit) {
      showMessage("У вас нет прав на добавление групп", "error");
      return;
    }
    if (!newGroupName.trim()) {
      showMessage("Введите имя группы", "error");
      return;
    }
    const formData = new FormData();
    formData.append("group_name", newGroupName);
    formData.append("display_name", newGroupDisplay || newGroupName);

    try {
      const res = await fetch("/api/admin/groups", {
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
    if (!canEdit) {
      showMessage("У вас нет прав на удаление групп", "error");
      return;
    }
    const group = adGroups.find(g => g.id === groupId);
    if (!confirm(`Удалить группу "${group?.display_name || group?.group_name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
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

  useEffect(() => {
    if (canViewAdmin) {
      fetchAdGroups();
      fetchRoles();
      fetchUsersMap();
    }
  }, [canViewAdmin]);

  if (!canViewAdmin) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Shield size={48} style={{ color: "#ef4444", marginBottom: 16 }} />
        <h2 style={{ color: textColor }}>Доступ запрещен</h2>
        <p style={{ color: textMuted }}>У вас нет прав для просмотра этого раздела</p>
      </div>
    );
  }

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

      {activeTab === "resources" && <ResourcesAndCategoriesManager adGroups={adGroups} usersMap={usersMap} getToken={getToken} showMessage={showMessage} canEdit={canEdit} darkMode={darkMode} />}
      {activeTab === "services" && <ServicesManager adGroups={adGroups} usersMap={usersMap} getToken={getToken} showMessage={showMessage} canEdit={canEdit} darkMode={darkMode} />}

      {activeTab === "groups" && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={{ margin: 0, fontSize: 16, color: textColor }}>👥 AD группы</h3>
            <button onClick={fetchAdGroups} style={styles.buttonIcon}><RefreshCw size={16} /></button>
          </div>
          {canEdit && (
            <div style={{ padding: 20, borderBottom: `1px solid ${borderColor}`, background: headerBg }}>
              <h4 style={{ fontSize: 14, marginBottom: 12, color: textColor }}>➕ Добавить AD группу</h4>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <input type="text" placeholder="Имя группы *" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} style={{ flex: 2, ...styles.input }} />
                <input type="text" placeholder="Отображаемое имя" value={newGroupDisplay} onChange={(e) => setNewGroupDisplay(e.target.value)} style={{ flex: 2, ...styles.input }} />
                <button onClick={addAdGroup} style={styles.buttonPrimary}><UserPlus size={14} /> Добавить</button>
              </div>
            </div>
          )}
          <div>
            <h4 style={{ fontSize: 14, margin: "16px 20px 12px", color: textColor }}>📋 Список групп</h4>
            {adGroups.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: textMuted }}><Group size={48} style={{ opacity: 0.5 }} /><p>Нет групп</p></div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Имя</th>
                      <th style={styles.th}>Отображаемое имя</th>
                      {canEdit && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {adGroups.map(g => (
                      <tr key={g.id} style={g.group_name === "!citovmt" ? { background: darkMode ? "#3e2a1f" : "#fef3c7" } : {}}>
                        <td style={styles.td}>{g.id}</td>
                        <td style={styles.td}>
                          <code style={{ color: textColor }}>{g.group_name}</code>
                          {g.group_name === "!citovmt" && <span style={{ marginLeft: 8, fontSize: 10, background: "#f59e0b20", color: "#d97706", padding: "2px 6px", borderRadius: 4 }}>ADMIN</span>}
                        </td>
                        <td style={styles.td}>{g.display_name || g.group_name}</td>
                        {canEdit && (
                          <td style={styles.td}>
                            <button onClick={() => deleteAdGroup(g.id)} style={{ ...styles.buttonIcon, color: "#dc2626" }} disabled={g.group_name === "!citovmt"}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && <UsersManager roles={roles} getToken={getToken} showMessage={showMessage} canEdit={canEdit} darkMode={darkMode} />}
    </div>
  );
};

export default AdminPanel;