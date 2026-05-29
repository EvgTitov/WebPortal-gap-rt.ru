import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import AdminPanel from "./AdminPanel";
import ITTasks from "./ITTasks";
import ITEquipment from "./ITEquipment";
import PeriodicTasks from "./PeriodicTasks";
import ITMonitoring from "./ITMonitoring";
import CalendarGroups from "./CalendarGroups";
import UserSearchInput from "../components/UserSearchInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ToastNotification from '../components/ToastNotification';
import { 
  LayoutDashboard, Newspaper, Calendar, MessageSquare, 
  LogOut, Plus, Edit2, Trash2, X, Sun, Moon,
  ExternalLink, Menu, Bell, Shield, User as UserIcon,
  Save, FolderOpen, Globe, Users, Link,
  Search, Download, Upload, UserPlus, Group, Server, Settings,
  Copy, Check, ChevronLeft, ChevronRight, Users as UsersIcon,
  Edit, ZoomIn, ChevronLeft as ArrowLeft, ChevronRight as ArrowRight,
  Wrench, ChevronDown, Clock, MapPin, Repeat, BellRing, CalendarRange
} from "lucide-react";

const MainPage = () => {
  const { user, isAuthenticated, token, userRole, isAdmin, isITEngineer, isDepartmentHead, isModerator } = useAuth();
  const [message, setMessage] = useState({ text: "", type: "success" });
  const [news, setNews] = useState([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [calendarEventNotifications, setCalendarEventNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [isHrDropdownOpen, setIsHrDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState({ title: "", content: "" });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventViewModalOpen, setIsEventViewModalOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [tooltipEvent, setTooltipEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [closeTarget, setCloseTarget] = useState(null);
  
  // Calendar view state
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarSubtab, setCalendarSubtab] = useState("view");
  const [calendarGroups, setCalendarGroups] = useState([]);
  
  const [eventForm, setEventForm] = useState({ 
    title: "", start_date: "", start_time: "10:00", end_date: "", end_time: "11:00",
    event_type: "meeting", location: "", description: "", is_all_day: false, 
    repeat: "none", remind_before: 15, participants: [] 
  });
  
  const [weather, setWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [organizationTree, setOrganizationTree] = useState([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [filteredOrgTree, setFilteredOrgTree] = useState([]);
  const [vacationReplacements, setVacationReplacements] = useState([]);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [replacementForm, setReplacementForm] = useState({ employeeName: "", position: "", department: "", substituteName: "", startDate: "", endDate: "", reason: "" });
  const [isAddNewsModalOpen, setIsAddNewsModalOpen] = useState(false);
  const [isEditNewsModalOpen, setIsEditNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [editingNewsImages, setEditingNewsImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [newsForm, setNewsForm] = useState({ title: "", content: "", category: "announcement", images: [], imagePreviews: [] });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [userServices, setUserServices] = useState([]);
  const [userNetworkCategories, setUserNetworkCategories] = useState([]);
  const [copiedPath, setCopiedPath] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [adUsersMap, setAdUsersMap] = useState({});
  const [isItSubmenuOpen, setIsItSubmenuOpen] = useState(false);
  const [activeItSubmenu, setActiveItSubmenu] = useState("tasks");
  
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantResults, setParticipantResults] = useState([]);
  const [adGroups, setAdGroups] = useState([]);
  const [participantSearchType, setParticipantSearchType] = useState("users");

  const notesEmojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  const hasAdminAccess = isAdmin;
  const hasITAccess = isITEngineer || isAdmin;
  const canManageNews = isAdmin || isModerator;
  const canManageReplacements = isAdmin || isDepartmentHead;
  const canViewAdminPanel = isAdmin || isModerator;

  const getToken = () => {
    const storedToken = localStorage.getItem("token");
    return token || storedToken;
  };

  const showMessage = (text, type = "success") => {
    const messageText = typeof text === 'string' ? text : JSON.stringify(text);
    setMessage({ text: messageText, type });
    setTimeout(() => setMessage({ text: "", type: "success" }), 3000);
  };

  const copyToClipboard = (text, name) => {
    const tempInput = document.createElement("input");
    tempInput.value = text;
    tempInput.style.position = "fixed";
    tempInput.style.top = "-1000px";
    tempInput.style.left = "-1000px";
    tempInput.style.opacity = "0";
    document.body.appendChild(tempInput);
    tempInput.select();
    tempInput.setSelectionRange(0, text.length);
    let success = false;
    try {
      success = document.execCommand("copy");
    } catch (err) {
      console.error("Copy failed:", err);
    }
    document.body.removeChild(tempInput);
    
    if (success) {
      setCopiedPath(name);
      showMessage(`✅ Путь "${name}" скопирован в буфер обмена`);
      setTimeout(() => setCopiedPath(null), 2000);
    } else {
      showMessage(`❌ Не удалось скопировать. Путь: ${text}`, "error");
    }
  };

  const getRoleDisplayName = () => {
    switch(userRole) {
      case 'admin': return '⚙️ Администратор';
      case 'department_head': return '👑 Начальник отдела';
      case 'moderator': return '🛡️ Модератор';
      case 'it_engineer': return '🔧 IT-инженер';
      default: return '👤 Сотрудник';
    }
  };

  const getEventIcon = (type) => {
    if (type === "meeting") return "👥";
    if (type === "vks") return "📹";
    if (type === "deadline") return "📌";
    if (type === "replacement") return "🔄";
    return "📌";
  };

  const getEventTypeLabel = (type) => {
    if (type === "meeting") return "Совещание";
    if (type === "vks") return "ВКС";
    if (type === "deadline") return "Задача";
    if (type === "replacement") return "Замена";
    return "Событие";
  };

  // ============ ФУНКЦИИ ДЛЯ РАБОТЫ С ДАТАМИ ============
  // Преобразование Date объекта в строку ДД.ММ.ГГГГ для отображения
  const dateToDisplayString = (date) => {
    if (!date) return "";
    if (typeof date === 'string') {
      if (date.includes('-')) {
        const parts = date.split('-');
        if (parts.length === 3) {
          return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
      }
      return date;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Преобразование строки ДД.ММ.ГГГГ в Date объект для DatePicker
  const displayStringToDate = (str) => {
    if (!str) return null;
    if (typeof str === 'object' && str instanceof Date) return str;
    if (str.includes('-')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    }
    const parts = str.split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const date = new Date(year, month, day);
    return date;
  };

  // Преобразование Date объекта в строку ГГГГ-ММ-ДД для API
  const dateToApiString = (date) => {
    if (!date) return "";
    if (typeof date === 'string') {
      if (date.includes('.')) {
        const parts = date.split('.');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      return date;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // API строку в Date объект
  const apiStringToDate = (str) => {
    if (!str) return null;
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  // Обработчик ввода даты с автоматической маской
  const handleDateKeyDown = (e, setter) => {
    const input = e.target;
    
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    if (controlKeys.includes(e.key)) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        setTimeout(() => {
          let value = input.value;
          if (value === '' && setter) {
            setter('');
          }
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

  // ============ КАЛЕНДАРЬ: ФУНКЦИИ ============
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getWeekDays = () => {
    return ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  };

  const getHours = () => {
    return Array.from({ length: 24 }, (_, i) => i);
  };

  const getWeekDates = (date) => {
    const curr = new Date(date);
    const day = curr.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d);
    }
    return weekDates;
  };

  const getEventsForDate = (date) => {
    const dateStr = dateToApiString(date);
    return calendarEvents.filter(e => e.event_date === dateStr);
  };

  const getEventsForDateTime = (date, hour) => {
    const dateStr = dateToApiString(date);
    return calendarEvents.filter(e => {
      if (e.event_date !== dateStr) return false;
      const eventHour = parseInt(e.event_time.split(':')[0]);
      return eventHour === hour;
    });
  };

  const getEventTypeColor = (type) => {
    switch(type) {
      case "meeting": return "#3b82f6";
      case "vks": return "#10b981";
      case "deadline": return "#ef4444";
      case "replacement": return "#f59e0b";
      default: return "#8b5cf6";
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const prevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const openCreateEvent = (date, hour = null) => {
    let dateObj = date;
    if (typeof date === 'string') {
      dateObj = apiStringToDate(date);
    }
    const dateStr = dateToApiString(dateObj);
    
    setEventForm({
      ...eventForm,
      start_date: dateStr,
      end_date: dateStr,
      start_time: hour ? `${String(hour).padStart(2, '0')}:00` : "10:00",
      end_time: hour ? `${String(hour + 1).padStart(2, '0')}:00` : "11:00",
      participants: []
    });
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  // ============ API ФУНКЦИИ ============
  
  const fetchUserRole = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/admin/user-role", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      console.log("User role:", data.role);
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  };

  const fetchAdGroups = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/admin/groups", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAdGroups(data.groups || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCalendarGroups = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/calendar/groups", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) setCalendarGroups(data.groups || []);
    } catch (err) {
      console.error("Error fetching calendar groups:", err);
    }
  };

  const fetchAllAdUsers = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/users/authorized?query=&limit=500", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.users) {
        const map = {};
        data.users.forEach(u => {
          map[u.username] = u.display_name || u.username;
        });
        setAdUsersMap(map);
        console.log("✅ Загружено пользователей:", Object.keys(map).length);
      }
    } catch (err) {
      console.error("Ошибка загрузки пользователей:", err);
    }
  };

  const getUserDisplayName = (username) => {
    return adUsersMap[username] || username;
  };

  const currentUsername = user?.username || "current";
  const currentUserDisplayName = user?.display_name || user?.username || "Пользователь";
  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadCalendarNotificationsCount = calendarEventNotifications.filter(n => !n.read).length;

  const loadUserServices = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/services", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserServices(data.services || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadUserNetworkResources = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/network-resources", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserNetworkCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadNews = async () => {
    setIsLoadingNews(true);
    try {
      const res = await fetch("/api/news?limit=20");
      const data = await res.json();
      if (data.news) setNews(data.news);
    } catch (err) { console.error(err); }
    finally { setIsLoadingNews(false); }
  };

  const loadVacationReplacements = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/vacation-replacements", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) setVacationReplacements(data.replacements || []);
    } catch (err) {
      console.error("Error loading vacation replacements:", err);
    }
  };

  const fetchWeather = async () => {
    setIsLoadingWeather(true);
    try {
      const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=55.7887&longitude=49.1221&current_weather=true&timezone=Europe/Moscow");
      if (response.ok) {
        const data = await response.json();
        const current = data.current_weather;
        
        let conditionIcon = "☀️";
        let conditionText = "Ясно";
        
        if (current.weathercode === 0) {
          conditionIcon = "☀️";
          conditionText = "Ясно";
        } else if (current.weathercode >= 1 && current.weathercode <= 3) {
          conditionIcon = "⛅";
          conditionText = "Облачно";
        } else if (current.weathercode === 45 || current.weathercode === 48) {
          conditionIcon = "🌫️";
          conditionText = "Туман";
        } else if ((current.weathercode >= 51 && current.weathercode <= 67) || (current.weathercode >= 80 && current.weathercode <= 82)) {
          conditionIcon = "🌧️";
          conditionText = "Дождь";
        } else if (current.weathercode >= 71 && current.weathercode <= 77) {
          conditionIcon = "❄️";
          conditionText = "Снег";
        } else if (current.weathercode >= 95 && current.weathercode <= 99) {
          conditionIcon = "⛈️";
          conditionText = "Гроза";
        }
        
        setWeather({ 
          temp: Math.round(current.temperature), 
          windSpeed: Math.round(current.windspeed), 
          conditionIcon,
          conditionText
        });
      }
    } catch (err) { console.error(err); }
    finally { setIsLoadingWeather(false); }
  };

  const loadNotifications = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const saved = localStorage.getItem(`notifications_${currentUsername}`);
        const savedNotifications = saved ? JSON.parse(saved) : [];
        const readIds = savedNotifications.filter(n => n.read).map(n => n.id);
        
        const notificationsWithReadStatus = (data.notifications || []).map(n => ({
          ...n,
          read: readIds.includes(n.id)
        }));
        setNotifications(notificationsWithReadStatus);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
      const saved = localStorage.getItem(`notifications_${currentUsername}`);
      if (saved) setNotifications(JSON.parse(saved));
    }
  };

  const sendNotification = async () => {
    if (!notificationText.trim()) {
      showMessage("❌ Введите текст", "error");
      return;
    }
    
    const authToken = getToken();
    const formData = new FormData();
    formData.append("text", notificationText);

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData
      });
      if (res.ok) {
        showMessage("✅ Оповещение добавлено");
        loadNotifications();
        closeModal();
      } else {
        const error = await res.json();
        showMessage(error.detail || "❌ Ошибка при добавлении", "error");
      }
    } catch (err) {
      showMessage("❌ Ошибка соединения", "error");
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm("Удалить оповещение?")) return;
    
    const authToken = getToken();
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        showMessage("🗑️ Оповещение удалено");
        loadNotifications();
      } else {
        const error = await res.json();
        showMessage(error.detail || "❌ Ошибка удаления", "error");
      }
    } catch (err) {
      showMessage("❌ Ошибка соединения", "error");
    }
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem(`notifications_${currentUsername}`, JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`notifications_${currentUsername}`, JSON.stringify(updated));
    showMessage("✅ Все оповещения прочитаны");
  };

  const markCalendarNotificationAsRead = (id) => {
    const updated = calendarEventNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    setCalendarEventNotifications(updated);
    localStorage.setItem(`calendarNotifications_${currentUsername}`, JSON.stringify(updated));
  };

  const markAllCalendarNotificationsAsRead = () => {
    const updated = calendarEventNotifications.map(n => ({ ...n, read: true }));
    setCalendarEventNotifications(updated);
    localStorage.setItem(`calendarNotifications_${currentUsername}`, JSON.stringify(updated));
    showMessage("✅ Все уведомления о событиях прочитаны");
  };

const loadCalendarEvents = async () => {
  try {
    const authToken = getToken();
    const res = await fetch("/api/calendar/events", {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      const allEvents = data.events || [];
      
      // ДЛЯ КАЛЕНДАРЯ - ВСЕ СОБЫТИЯ (без фильтра)
      setCalendarEvents(allEvents);
      
      // ДЛЯ РАЗДЕЛА "СОБЫТИЯ" - ТОЛЬКО ЗА ТЕКУЩУЮ НЕДЕЛЮ
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      const weekEvents = allEvents.filter(event => {
        const eventDate = new Date(event.event_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= monday && eventDate <= sunday;
      });
      
      // Сортируем по дате (новые сверху)
      const sortedWeekEvents = weekEvents.sort((a, b) => {
        const dateCompare = new Date(b.event_date) - new Date(a.event_date);
        if (dateCompare !== 0) return dateCompare;
        return (b.event_time || "00:00").localeCompare(a.event_time || "00:00");
      });
      
      // Уведомления для раздела "События" (только за неделю)
      const myEvents = sortedWeekEvents.filter(event => {
        if (event.created_by === currentUsername) return true;
        if (event.participants && event.participants.some(p => 
          (p.participant_type === 'user' && p.participant_id === currentUsername) ||
          (p.id === currentUsername)
        )) return true;
        return false;
      });
      
      const savedRead = JSON.parse(localStorage.getItem(`calendarNotifications_${currentUsername}`) || "[]");
      const readIds = savedRead.map(n => n.id);
      
      const newNotifications = myEvents.map(event => ({
        id: `event_${event.id}`,
        event_id: event.id,
        title: event.title,
        event_date: event.event_date,
        event_time: event.event_time,
        read: readIds.includes(`event_${event.id}`),
        created_at: event.created_at
      }));
      
      setCalendarEventNotifications(newNotifications);
      localStorage.setItem(`calendarNotifications_${currentUsername}`, JSON.stringify(newNotifications));
    }
  } catch (err) {
    console.error("Error loading calendar events:", err);
  }
};

  const saveEvent = async () => {
    if (!eventForm.title.trim()) {
      showMessage("❌ Введите название", "error");
      return;
    }
    if (!eventForm.start_date) {
      showMessage("❌ Выберите дату начала", "error");
      return;
    }
    
    const authToken = getToken();
    if (!authToken) {
      showMessage("❌ Ошибка авторизации", "error");
      return;
    }
    
    let startDateStr = eventForm.start_date;
    let endDateStr = eventForm.end_date || eventForm.start_date;
    
    if (startDateStr && startDateStr.includes('.')) {
      const parts = startDateStr.split('.');
      if (parts.length === 3) {
        startDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    if (endDateStr && endDateStr.includes('.')) {
      const parts = endDateStr.split('.');
      if (parts.length === 3) {
        endDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    if (startDateStr !== endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      const eventDates = [];
      const current = new Date(start);
      
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        eventDates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
      
      let successCount = 0;
      for (const singleDate of eventDates) {
        const formData = new FormData();
        formData.append("title", eventForm.title);
        formData.append("event_date", singleDate);
        formData.append("event_time", eventForm.is_all_day ? "00:00" : eventForm.start_time);
        formData.append("event_type", eventForm.event_type);
        formData.append("location", eventForm.location || "");
        formData.append("description", eventForm.description || "");
        formData.append("is_all_day", eventForm.is_all_day ? "1" : "0");
        formData.append("participants", JSON.stringify(eventForm.participants));
        if (eventForm.end_time && !eventForm.is_all_day) formData.append("end_time", eventForm.end_time);
        formData.append("repeat", "none");
        formData.append("remind_before", eventForm.remind_before);
        
        if (eventDates.length > 1) {
          const startDisplay = dateToDisplayString(new Date(startDateStr));
          const endDisplay = dateToDisplayString(new Date(endDateStr));
          const rangeInfo = ` (${startDisplay} - ${endDisplay})`;
          if (singleDate === startDateStr) {
            formData.append("title", eventForm.title + " (начало периода)");
          } else if (singleDate === endDateStr) {
            formData.append("title", eventForm.title + " (окончание периода)");
          } else {
            formData.append("title", eventForm.title + rangeInfo);
          }
        }
        
        const url = editingEvent
          ? `/api/calendar/events/${editingEvent.id}`
          : "/api/calendar/events";
        const method = editingEvent ? "PUT" : "POST";
        
        try {
          const res = await fetch(url, {
            method,
            headers: { Authorization: `Bearer ${authToken}` },
            body: formData
          });
          if (res.ok) {
            successCount++;
          }
        } catch (err) {
          console.error("Save error:", err);
        }
      }
      
      if (successCount === eventDates.length) {
        showMessage(editingEvent ? "✅ Событие обновлено" : `✅ Событие добавлено на ${eventDates.length} дней`);
        await loadCalendarEvents();
        setIsEventModalOpen(false);
        resetEventForm();
      } else {
        showMessage(`❌ Ошибка: создано только ${successCount} из ${eventDates.length} дней`, "error");
      }
    } else {
      const formData = new FormData();
      formData.append("title", eventForm.title);
      formData.append("event_date", startDateStr);
      formData.append("event_time", eventForm.is_all_day ? "00:00" : eventForm.start_time);
      formData.append("event_type", eventForm.event_type);
      formData.append("location", eventForm.location || "");
      formData.append("description", eventForm.description || "");
      formData.append("is_all_day", eventForm.is_all_day ? "1" : "0");
      formData.append("participants", JSON.stringify(eventForm.participants));
      if (eventForm.end_date && eventForm.end_date !== startDateStr) formData.append("end_date", endDateStr);
      if (eventForm.end_time && !eventForm.is_all_day) formData.append("end_time", eventForm.end_time);
      formData.append("repeat", eventForm.repeat);
      formData.append("remind_before", eventForm.remind_before);

      const url = editingEvent
        ? `/api/calendar/events/${editingEvent.id}`
        : "/api/calendar/events";
      const method = editingEvent ? "PUT" : "POST";

      try {
        const res = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData
        });
        
        if (res.ok) {
          showMessage(editingEvent ? "✅ Событие обновлено" : "✅ Событие добавлено");
          await loadCalendarEvents();
          setIsEventModalOpen(false);
          resetEventForm();
        } else {
          let errorMessage = "Ошибка при сохранении";
          try {
            const error = await res.json();
            if (error && error.detail) {
              errorMessage = error.detail;
            }
          } catch (e) {}
          showMessage(`❌ ${errorMessage}`, "error");
        }
      } catch (err) {
        console.error("Save error:", err);
        showMessage("❌ Ошибка соединения", "error");
      }
    }
  };

  const deleteEvent = async (id) => {
    if (!id) {
      showMessage("❌ ID события не указан", "error");
      return;
    }
    
    if (!confirm("Удалить событие?")) return;
    
    const authToken = getToken();
    if (!authToken) {
      showMessage("❌ Ошибка авторизации", "error");
      return;
    }
    
    try {
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      });
      
      if (res.ok) {
        showMessage("🗑️ Событие удалено");
        await loadCalendarEvents();
        setIsEventViewModalOpen(false);
        setViewingEvent(null);
      } else {
        let errorMessage = "Ошибка удаления";
        try {
          const error = await res.json();
          if (error && error.detail) {
            errorMessage = error.detail;
          }
        } catch (e) {}
        showMessage(`❌ ${errorMessage}`, "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showMessage("❌ Ошибка соединения", "error");
    }
  };

  const resetEventForm = () => {
    setEventForm({ 
      title: "", start_date: "", start_time: "10:00", end_date: "", end_time: "11:00",
      event_type: "meeting", location: "", description: "", is_all_day: false,
      repeat: "none", remind_before: 15, participants: [] 
    });
    setEditingEvent(null);
    setParticipantSearch("");
    setParticipantResults([]);
  };

  const editEvent = (event) => {
    if (!event || !event.id) {
      showMessage("❌ Ошибка: событие не найдено", "error");
      return;
    }
    
    const formattedParticipants = (event.participants || []).map(p => {
      let displayName = "";
      if (p.name) {
        displayName = p.name;
      } else if (p.participant_id) {
        displayName = adUsersMap[p.participant_id] || p.participant_id;
      } else if (p.id) {
        displayName = adUsersMap[p.id] || p.id;
      } else {
        displayName = p.participant_id || p.id || "?";
      }
      
      return {
        type: p.participant_type || p.type || "user",
        id: p.participant_id || p.id,
        name: displayName
      };
    });
    
    let title = event.title;
    title = title.replace(/\s*\(начало периода\)\s*/, '');
    title = title.replace(/\s*\(окончание периода\)\s*/, '');
    title = title.replace(/\s*\([0-9]{2}\.[0-9]{2}\.[0-9]{4} - [0-9]{2}\.[0-9]{2}\.[0-9]{4}\)\s*/, '');
    
    setEventForm({
      title: title,
      start_date: event.event_date,
      start_time: event.event_time || "10:00",
      end_date: event.end_date || event.event_date,
      end_time: event.end_time || (event.event_time ? `${parseInt(event.event_time.split(':')[0]) + 1}:00` : "11:00"),
      event_type: event.event_type || "meeting",
      location: event.location || "",
      description: event.description || "",
      is_all_day: event.is_all_day === 1,
      repeat: event.repeat || "none",
      remind_before: event.remind_before || 15,
      participants: formattedParticipants
    });
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const viewEvent = (eventItem) => {
    if (!eventItem || !eventItem.id) {
      showMessage("❌ Ошибка: событие не найдено", "error");
      return;
    }
    markCalendarNotificationAsRead(`event_${eventItem.id}`);
    
    const cleanTitle = eventItem.title.replace(/\s*\(начало периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '');
    const displayEvent = { ...eventItem, title: cleanTitle };
    
    setViewingEvent(displayEvent);
    setIsEventViewModalOpen(true);
  };

  const showEventTooltip = (event, ev) => {
    setTooltipEvent(event);
    setTooltipPosition({ x: ev.clientX + 10, y: ev.clientY + 10 });
  };

  const hideEventTooltip = () => {
    setTooltipEvent(null);
  };

  const removeParticipant = (participantId, participantType) => {
    setEventForm(prev => ({
      ...prev,
      participants: prev.participants.filter(p => !(p.id === participantId && p.type === participantType))
    }));
  };

  const addParticipant = async (type, id, name) => {
    if (!id) return;
    
    if (eventForm.participants.some(p => p.id === id && p.type === type)) {
      showMessage("❌ Этот участник уже добавлен", "error");
      return;
    }
    
    let displayName = name;
    
    if (type === "user" && adUsersMap[id]) {
      displayName = adUsersMap[id];
    } else if (type === "group") {
      const group = adGroups.find(g => String(g.id) === String(id));
      if (group) displayName = group.display_name || group.group_name;
    } else if (type === "calendar_group") {
      const group = calendarGroups.find(g => String(g.id) === id);
      if (group) displayName = `👥 ${group.name}`;
    }
    
    setEventForm({
      ...eventForm,
      participants: [...eventForm.participants, { type, id, name: displayName }]
    });
    setParticipantSearch("");
    setParticipantResults([]);
  };

  const getParticipantsNames = (participants) => {
    if (!participants || participants.length === 0) return "Нет участников";
    const names = participants.map(p => {
      if (p.name) return p.name;
      if (p.participant_id) return adUsersMap[p.participant_id] || p.participant_id;
      if (p.id && p.type === "user") return adUsersMap[p.id] || p.id;
      if (typeof p === "string") return adUsersMap[p] || p;
      return p.participant_id || p.id || "?";
    });
    return names.join(", ");
  };

  const searchParticipants = async (query) => {
    if (!query.trim() || query.length < 2) {
      if (participantSearchType === "groups" && calendarGroups.length > 0) {
        const groupsAsResults = calendarGroups.map(g => ({
          type: "calendar_group",
          id: String(g.id),
          name: `👥 ${g.name} (${g.members_count || 0} чел.)`
        }));
        setParticipantResults(groupsAsResults);
      } else {
        setParticipantResults([]);
      }
      return;
    }
    
    try {
      const authToken = getToken();
      
      if (participantSearchType === "users") {
        const res = await fetch(`/api/users/authorized?query=${encodeURIComponent(query)}&limit=10`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (res.ok) {
          const users = (data.users || []).map(u => ({
            type: "user",
            id: u.username,
            name: u.display_name || u.username
          }));
          const uniqueUsers = [...new Map(users.map(u => [u.id, u])).values()];
          
          const groups = adGroups.filter(g => 
            g.display_name?.toLowerCase().includes(query.toLowerCase()) ||
            g.group_name?.toLowerCase().includes(query.toLowerCase())
          ).map(g => ({
            type: "group",
            id: String(g.id),
            name: g.display_name || g.group_name
          }));
          const uniqueGroups = [...new Map(groups.map(g => [g.id, g])).values()];
          
          setParticipantResults([...uniqueUsers, ...uniqueGroups]);
        }
      } else {
        const matchedGroups = calendarGroups.filter(g =>
          g.name.toLowerCase().includes(query.toLowerCase())
        ).map(g => ({
          type: "calendar_group",
          id: String(g.id),
          name: `👥 ${g.name} (${g.members_count || 0} чел.)`
        }));
        setParticipantResults(matchedGroups);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (participantSearch) {
        searchParticipants(participantSearch);
      } else {
        if (participantSearchType === "groups" && calendarGroups.length > 0) {
          const groupsAsResults = calendarGroups.map(g => ({
            type: "calendar_group",
            id: String(g.id),
            name: `👥 ${g.name} (${g.members_count || 0} чел.)`
          }));
          setParticipantResults(groupsAsResults);
        } else {
          setParticipantResults([]);
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [participantSearch, participantSearchType, calendarGroups]);

  const canEditEvent = (event) => {
    return hasAdminAccess || userRole === "department_head" || event.created_by === currentUsername;
  };

  // ============ РЕНДЕР КАЛЕНДАРЯ С ПЛЮСИКОМ ============
  
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = [];
    let emptyCells = firstDay;
    for (let i = 0; i < emptyCells; i++) {
      days.push(<div key={`empty-${i}`} style={styles.calendarDayEmpty} />);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      const isToday = date.toDateString() === today.toDateString();
      const eventsForDate = getEventsForDate(date);
      const eventCount = eventsForDate.length;
      
      days.push(
        <div 
          key={d} 
          style={{ ...styles.calendarDay, ...(isToday ? styles.calendarDayToday : {}), position: "relative" }}
          onClick={() => openCreateEvent(date)}
        >
          <div 
            style={{ 
              position: "absolute", 
              top: 2, 
              right: 4, 
              opacity: 0.7, 
              cursor: "pointer", 
              zIndex: 5,
              background: "rgba(0,0,0,0.5)",
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = "rgba(0,0,0,0.7)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.background = "rgba(0,0,0,0.5)"; }}
            onClick={(e) => { e.stopPropagation(); openCreateEvent(date); }}
            title="Добавить событие"
          >
            <Plus size={12} color="white" />
          </div>
          <div style={styles.calendarDayNumber}>{d}</div>
          
          {eventCount === 1 && (
            <div 
              style={{ 
                ...styles.calendarDayFullEvent,
                background: getEventTypeColor(eventsForDate[0].event_type)
              }}
              onMouseEnter={(ev) => showEventTooltip(eventsForDate[0], ev)}
              onMouseLeave={() => hideEventTooltip()}
              onClick={(ev) => { 
                ev.stopPropagation(); 
                const cleanEvent = { ...eventsForDate[0], title: eventsForDate[0].title.replace(/\s*\(начало периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '') };
                viewEvent(cleanEvent); 
              }}
            >
              <div style={styles.calendarDayFullEventTitle}>
                {getEventIcon(eventsForDate[0].event_type)} {eventsForDate[0].title.replace(/\s*\(начало периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '')}
              </div>
              <div style={styles.calendarDayFullEventTime}>
                {eventsForDate[0].event_time}
              </div>
            </div>
          )}
          
          {eventCount > 1 && (
            <div style={styles.calendarDayEvents}>
              {eventsForDate.slice(0, 3).map((calendarEvent, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    ...styles.calendarDayEvent,
                    background: getEventTypeColor(calendarEvent.event_type)
                  }}
                  title={calendarEvent.title}
                  onMouseEnter={(ev) => showEventTooltip(calendarEvent, ev)}
                  onMouseLeave={() => hideEventTooltip()}
                  onClick={(ev) => { 
                    ev.stopPropagation(); 
                    const cleanEvent = { ...calendarEvent, title: calendarEvent.title.replace(/\s*\(начала периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '') };
                    viewEvent(cleanEvent); 
                  }}
                >
                  <span>{getEventIcon(calendarEvent.event_type)}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {calendarEvent.title.replace(/\s*\(начало периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '')}
                  </span>
                </div>
              ))}
              {eventCount > 3 && (
                <div style={{ fontSize: 11, color: "#64748b", paddingLeft: 4, marginTop: 2 }}>
                  +{eventCount - 3} ещё
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  // ============ НЕДЕЛЬНЫЙ ВИД ============
  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const hours = getHours();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekDays = getWeekDays();
    const headers = weekDates.map((date, idx) => ({
      dayName: weekDays[idx],
      dayNumber: date.getDate()
    }));
    
    return (
      <div style={styles.weekTableContainer}>
        <div style={styles.weekTableHeader}>
          <div style={styles.weekTableHeaderTimeCell}>Время</div>
          {headers.map((header, idx) => (
            <div key={idx} style={{ ...styles.weekTableHeaderDayCell, ...(weekDates[idx].toDateString() === today.toDateString() ? styles.weekTableHeaderToday : {}) }}>
              {header.dayName} {header.dayNumber}
            </div>
          ))}
        </div>
        
        <div style={styles.weekTableBody}>
          {hours.map(hour => (
            <div key={hour} style={styles.weekTableRow}>
              <div style={styles.weekTableTimeCell}>{hour}:00</div>
              {weekDates.map((date, colIdx) => {
                const eventsAtHour = getEventsForDateTime(date, hour);
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div 
                    key={colIdx} 
                    style={{ ...styles.weekTableCell, ...(isToday ? styles.weekTableCellToday : {}), position: "relative" }}
                    onClick={() => openCreateEvent(date, hour)}
                  >
                    {eventsAtHour.map((event, eventIdx) => (
                      <div
                        key={eventIdx}
                        style={{
                          ...styles.weekTableEvent,
                          background: getEventTypeColor(event.event_type)
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const cleanEvent = { ...event, title: event.title.replace(/\s*\(начало периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '') };
                          viewEvent(cleanEvent);
                        }}
                        onMouseEnter={(e) => showEventTooltip(event, e)}
                        onMouseLeave={() => hideEventTooltip()}
                      >
                        <div style={styles.weekTableEventTitle}>{event.title.replace(/\s*\(начало периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '')}</div>
                        <div style={styles.weekTableEventTime}>{event.event_time}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============ ДНЕВНОЙ ВИД ============
  const renderDayView = () => {
    const hours = getHours();
    const eventsOfDay = getEventsForDate(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = currentDate.toDateString() === today.toDateString();
    
    return (
      <div style={styles.dayViewContainer}>
        <div style={{ ...styles.dayHeader, ...(isToday ? styles.dayHeaderToday : {}) }}>
          <div style={styles.dayHeaderDate}>
            {currentDate.toLocaleDateString("ru-RU", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={styles.dayGridWrapper}>
          <div style={styles.dayGrid}>
            <div style={styles.timeColumn}>
              {hours.map(hour => (
                <div key={hour} style={styles.timeCell}>
                  {hour}:00
                </div>
              ))}
            </div>
            
            <div style={styles.dayEventsColumn}>
              {hours.map(hour => {
                const eventsAtHour = eventsOfDay.filter(e => {
                  const eventHour = parseInt(e.event_time.split(':')[0]);
                  return eventHour === hour;
                });
                return (
                  <div 
                    key={hour} 
                    style={{ 
                      ...styles.hourCell,
                      ...(hour % 2 === 0 ? styles.hourCellEven : {}),
                      position: "relative"
                    }}
                    onClick={() => openCreateEvent(currentDate, hour)}
                  >
                    {eventsAtHour.map((event, idx) => (
                      <div
                        key={idx}
                        style={{
                          ...styles.dayEventCard,
                          background: getEventTypeColor(event.event_type)
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const cleanEvent = { ...event, title: event.title.replace(/\s*\(начало периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '') };
                          viewEvent(cleanEvent);
                        }}
                        onMouseEnter={(e) => showEventTooltip(event, e)}
                        onMouseLeave={() => hideEventTooltip()}
                      >
                        <div style={styles.dayEventTitle}>{event.title.replace(/\s*\(начало периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '')}</div>
                        <div style={styles.dayEventTime}>
                          {event.event_time} {event.location ? `• ${event.location}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============ ФУНКЦИЯ ДЛЯ ЗАМЕН ============
  const addReplacement = async () => {
    if (!replacementForm.employeeName.trim() || !replacementForm.substituteName.trim()) {
      showMessage("❌ Заполните обязательные поля", "error");
      return;
    }
    
    const authToken = getToken();
    const formData = new FormData();
    formData.append("employee_name", replacementForm.employeeName);
    formData.append("position", replacementForm.position || "");
    formData.append("department", replacementForm.department || "");
    formData.append("substitute_name", replacementForm.substituteName);
    formData.append("start_date", replacementForm.startDate || "");
    formData.append("end_date", replacementForm.endDate || "");
    formData.append("reason", replacementForm.reason || "");

    try {
      const res = await fetch("/api/vacation-replacements", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData
      });
      if (res.ok) {
        showMessage("✅ Замена добавлена");
        loadVacationReplacements();
        setIsReplacementModalOpen(false);
        setReplacementForm({ employeeName: "", position: "", department: "", substituteName: "", startDate: "", endDate: "", reason: "" });
      } else {
        showMessage("❌ Ошибка при добавлении", "error");
      }
    } catch (err) {
      showMessage("❌ Ошибка соединения", "error");
    }
  };

  const deleteReplacement = async (id) => {
    if (!confirm("Удалить замену?")) return;
    
    const authToken = getToken();
    try {
      const res = await fetch(`/api/vacation-replacements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        showMessage("🗑️ Замена удалена");
        loadVacationReplacements();
      } else {
        showMessage("❌ Ошибка удаления", "error");
      }
    } catch (err) {
      showMessage("❌ Ошибка соединения", "error");
    }
  };

  const loadNotes = () => {
    const saved = localStorage.getItem(`userNotes_${currentUsername}`);
    setNotes(saved ? JSON.parse(saved) : []);
  };

  const loadOrganizationTree = async () => {
    try {
      const authToken = getToken();
      const res = await fetch("/api/admin/organization-tree", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      const tree = data.tree || [];
      setOrganizationTree(tree);
      setFilteredOrgTree(tree);
      console.log("✅ Структура загружена с сервера");
    } catch (err) {
      console.error("Error loading organization tree:", err);
      const saved = localStorage.getItem("organizationTree");
      const tree = saved ? JSON.parse(saved) : [];
      setOrganizationTree(tree);
      setFilteredOrgTree(tree);
    }
  };

  const saveOrganizationTree = async (tree) => {
    try {
      const authToken = getToken();
      const response = await fetch("/api/admin/organization-tree", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tree: tree })
      });
      
      if (response.ok) {
        console.log("✅ Структура сохранена на сервере");
        showMessage("✅ Структура организации сохранена");
      } else {
        const error = await response.text();
        console.error("❌ Ошибка сохранения:", error);
        showMessage("❌ Ошибка сохранения структуры", "error");
        localStorage.setItem("organizationTree", JSON.stringify(tree));
      }
    } catch (err) {
      console.error("❌ Ошибка:", err);
      showMessage("❌ Ошибка соединения", "error");
      localStorage.setItem("organizationTree", JSON.stringify(tree));
    }
  };

  const saveNotes = (updated) => {
    setNotes(updated);
    localStorage.setItem(`userNotes_${currentUsername}`, JSON.stringify(updated));
  };

  const openNoteModal = (note = null) => {
    if (note) {
      setCurrentNote({ title: note.title, content: note.content });
      setEditingNoteId(note.id);
    } else {
      setCurrentNote({ title: "", content: "" });
      setEditingNoteId(null);
    }
    setIsNotesModalOpen(true);
  };

  const addNote = () => {
    if (!currentNote.title.trim()) {
      showMessage("❌ Введите заголовок заметки", "error");
      return;
    }
    const newNote = { 
      id: Date.now(), 
      title: currentNote.title.trim(), 
      content: currentNote.content.trim(), 
      createdAt: new Date().toISOString(),
      folderId: null
    };
    saveNotes([newNote, ...notes]);
    setCurrentNote({ title: "", content: "" });
    setEditingNoteId(null);
    showMessage("✅ Заметка добавлена");
  };

  const updateNote = () => {
    if (!currentNote.title.trim()) {
      showMessage("❌ Введите заголовок заметки", "error");
      return;
    }
    const updatedNotes = notes.map(n => n.id === editingNoteId ? { ...n, title: currentNote.title.trim(), content: currentNote.content.trim() } : n);
    saveNotes(updatedNotes);
    setCurrentNote({ title: "", content: "" });
    setEditingNoteId(null);
    showMessage("✅ Заметка обновлена");
  };

  const deleteNote = (id) => {
    if (!confirm("Удалить заметку?")) return;
    saveNotes(notes.filter(n => n.id !== id));
    showMessage("🗑️ Заметка удалена");
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...newsForm.images, ...files];
    const newPreviews = [...newsForm.imagePreviews];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setNewsForm({ ...newsForm, images: newImages, imagePreviews: newPreviews });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = [...newsForm.images];
    const newPreviews = [...newsForm.imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setNewsForm({ ...newsForm, images: newImages, imagePreviews: newPreviews });
  };

  const removeExistingImage = (index) => {
    const imageToRemove = editingNewsImages[index];
    setEditingNewsImages(prev => prev.filter((_, i) => i !== index));
    setImagesToDelete(prev => [...prev, imageToRemove]);
  };

  const renderImageGallery = (images, darkMode) => {
    const fullUrls = images.map(img => `${img}`);
    const count = images.length;
    
    if (count === 1) {
      return (
        <div style={{ borderRadius: 12, overflow: "hidden", cursor: "pointer" }} onClick={() => openLightbox(fullUrls, 0)}>
          <img 
            src={fullUrls[0]} 
            alt="gallery" 
            style={{ width: "100%", maxHeight: 500, objectFit: "contain", background: darkMode ? "#0f172a" : "#f8fafc" }}
          />
        </div>
      );
    }
    
    if (count === 2) {
      return (
        <div style={{ display: "flex", gap: 4, borderRadius: 12, overflow: "hidden" }}>
          {images.map((img, idx) => (
            <div key={idx} style={{ flex: 1, cursor: "pointer", aspectRatio: "1/1" }} onClick={() => openLightbox(fullUrls, idx)}>
              <img 
                src={fullUrls[idx]} 
                alt={`gallery-${idx}`} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      );
    }
    
    if (count === 3) {
      return (
        <div style={{ display: "flex", gap: 4, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ flex: 1, cursor: "pointer", aspectRatio: "1/1" }} onClick={() => openLightbox(fullUrls, 0)}>
            <img src={fullUrls[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ flex: 1, cursor: "pointer" }} onClick={() => openLightbox(fullUrls, 1)}>
              <img src={fullUrls[1]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, cursor: "pointer" }} onClick={() => openLightbox(fullUrls, 2)}>
              <img src={fullUrls[2]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        </div>
      );
    }
    
    if (count >= 4) {
      const remaining = count - 4;
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, borderRadius: 12, overflow: "hidden" }}>
          {images.slice(0, 4).map((img, idx) => (
            <div key={idx} style={{ position: "relative", cursor: "pointer", aspectRatio: "1/1" }} onClick={() => openLightbox(fullUrls, idx)}>
              <img src={fullUrls[idx]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {idx === 3 && remaining > 0 && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", color: "white" }}>
                  +{remaining}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  const saveNews = async () => {
    if (!newsForm.title.trim() || !newsForm.content.trim()) {
      showMessage("❌ Заполните заголовок и текст", "error");
      return;
    }
    const authToken = getToken();
    const formData = new FormData();
    formData.append("title", newsForm.title);
    formData.append("content", newsForm.content);
    formData.append("category", newsForm.category);
    newsForm.images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData
      });
      if (res.ok) { 
        showMessage("✅ Новость добавлена");
        loadNews(); 
        setIsAddNewsModalOpen(false); 
        setNewsForm({ title: "", content: "", category: "announcement", images: [], imagePreviews: [] }); 
      } else {
        const error = await res.json();
        showMessage(error.detail || "❌ Ошибка при сохранении", "error");
      }
    } catch (err) { 
      showMessage("❌ Ошибка соединения с сервером", "error"); 
    }
  };

  const updateNews = async () => {
    if (!newsForm.title.trim() || !newsForm.content.trim()) {
      showMessage("❌ Заполните заголовок и текст", "error");
      return;
    }
    
    const authToken = getToken();
    const formData = new FormData();
    formData.append("title", newsForm.title);
    formData.append("content", newsForm.content);
    formData.append("category", newsForm.category);
    
    if (imagesToDelete.length > 0) {
      formData.append("delete_images", JSON.stringify(imagesToDelete));
    }
    
    newsForm.images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const res = await fetch(`/api/news/${editingNews.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData
      });
      if (res.ok) {
        showMessage("✅ Новость обновлена");
        loadNews();
        setIsEditNewsModalOpen(false);
        setEditingNews(null);
        setEditingNewsImages([]);
        setImagesToDelete([]);
        setNewsForm({ title: "", content: "", category: "announcement", images: [], imagePreviews: [] });
      } else {
        const error = await res.json();
        showMessage(error.detail || "❌ Ошибка при обновлении", "error");
      }
    } catch (err) {
      showMessage("❌ Ошибка соединения", "error");
    }
  };

  const openEditNewsModal = (newsItem) => {
    setEditingNews(newsItem);
    setEditingNewsImages(newsItem.images || []);
    setImagesToDelete([]);
    setNewsForm({
      title: newsItem.title,
      content: newsItem.content,
      category: newsItem.category || "announcement",
      images: [],
      imagePreviews: []
    });
    setIsEditNewsModalOpen(true);
  };

  const deleteNews = async (id) => {
    if (!confirm("Удалить новость?")) return;
    const authToken = getToken();
    try {
      const res = await fetch(`/api/news/${id}`, { 
        method: "DELETE", 
        headers: { Authorization: `Bearer ${authToken}` } 
      });
      if (res.ok) { showMessage("🗑️ Новость удалена"); loadNews(); }
    } catch (err) { showMessage("❌ Ошибка", "error"); }
  };

  const openLightbox = (images, index) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxImage(images[index]);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  const nextImage = () => {
    if (lightboxIndex < lightboxImages.length - 1) {
      const newIndex = lightboxIndex + 1;
      setLightboxIndex(newIndex);
      setLightboxImage(lightboxImages[newIndex]);
    }
  };

  const prevImage = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1;
      setLightboxIndex(newIndex);
      setLightboxImage(lightboxImages[newIndex]);
    }
  };

  const openNetworkModal = (category) => {
    setSelectedCategory(category);
    setIsNetworkModalOpen(true);
    setIsNetworkDropdownOpen(false);
  };

  const addDepartment = async () => {
    const newDept = { id: Date.now(), name: "Новый отдел", type: "department", employee: "", children: [] };
    const newTree = [...organizationTree, newDept];
    setOrganizationTree(newTree);
    setFilteredOrgTree(newTree);
    await saveOrganizationTree(newTree);
    showMessage("✅ Отдел добавлен");
  };

  const addPosition = async (parentId) => {
    const addRec = (items) => items.map(item => {
      if (item.id === parentId) {
        const newPosition = { id: Date.now(), name: "Новая должность", type: "position", employee: "", children: [] };
        return { ...item, children: [...item.children, newPosition] };
      }
      if (item.children) return { ...item, children: addRec(item.children) };
      return item;
    });
    const updated = addRec(organizationTree);
    setOrganizationTree(updated);
    setFilteredOrgTree(updated);
    await saveOrganizationTree(updated);
    showMessage("✅ Должность добавлена");
  };

  const editItemName = async (id, newName) => {
    const editRec = (items) => items.map(item => {
      if (item.id === id) return { ...item, name: newName };
      if (item.children) return { ...item, children: editRec(item.children) };
      return item;
    });
    const updated = editRec(organizationTree);
    setOrganizationTree(updated);
    setFilteredOrgTree(updated);
    await saveOrganizationTree(updated);
  };

  const editEmployee = async (id, empName) => {
    const editRec = (items) => items.map(item => {
      if (item.id === id) return { ...item, employee: empName };
      if (item.children) return { ...item, children: editRec(item.children) };
      return item;
    });
    const updated = editRec(organizationTree);
    setOrganizationTree(updated);
    setFilteredOrgTree(updated);
    await saveOrganizationTree(updated);
  };

  const deleteItem = async (id) => {
    if (!confirm("Удалить элемент?")) return;
    const delRec = (items) => items.filter(item => {
      if (item.id === id) return false;
      if (item.children) item.children = delRec(item.children);
      return true;
    });
    const updated = delRec(organizationTree);
    setOrganizationTree(updated);
    setFilteredOrgTree(updated);
    await saveOrganizationTree(updated);
    showMessage("✅ Элемент удален");
  };

  const searchOrganization = (query) => {
    setOrgSearchQuery(query);
    if (!query.trim()) {
      setFilteredOrgTree(organizationTree);
      return;
    }
    
    const searchLower = query.toLowerCase();
    const filterTree = (items) => {
      const result = [];
      for (const item of items) {
        let matches = false;
        if (item.name && item.name.toLowerCase().includes(searchLower)) matches = true;
        if (item.employee && item.employee.toLowerCase().includes(searchLower)) matches = true;
        
        let filteredChildren = [];
        if (item.children && item.children.length > 0) {
          filteredChildren = filterTree(item.children);
        }
        
        if (matches || filteredChildren.length > 0) {
          result.push({
            ...item,
            children: filteredChildren
          });
        }
      }
      return result;
    };
    
    setFilteredOrgTree(filterTree(organizationTree));
  };

  const renderOrgTree = (items, level = 0) => {
    const uniqueItems = [...new Map(items.map(item => [item.id, item])).values()];
    return uniqueItems.map(item => (
      <div key={item.id} style={{ marginLeft: Math.min(level * 20, 80), marginBottom: 12 }}>
        <div style={{ 
          display: "flex", 
          alignItems: "flex-start", 
          justifyContent: "space-between", 
          flexWrap: "wrap",
          gap: 10,
          padding: "12px 16px", 
          background: level === 0 ? "#3b82f6" : (darkMode ? "#334155" : "#f1f5f9"), 
          color: level === 0 ? "white" : (darkMode ? "#f1f5f9" : "#1e293b"), 
          borderRadius: 10, 
          fontSize: 13,
          minWidth: 0
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: "1 1 auto", minWidth: 0, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.type === "department" ? "🏢" : "👤"}</span>
            {hasAdminAccess ? (
              <input 
                type="text" 
                value={item.name} 
                onChange={(e) => editItemName(item.id, e.target.value)} 
                style={{ 
                  background: level === 0 ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                  border: "none", 
                  color: "inherit", 
                  fontWeight: 600, 
                  minWidth: "150px",
                  maxWidth: "100%",
                  width: "auto",
                  padding: "6px 12px",
                  borderRadius: 8,
                  outline: "none",
                  fontSize: 14,
                  flex: "1 1 auto"
                }} 
              />
            ) : (
              <strong style={{ wordBreak: "break-word", whiteSpace: "normal", fontSize: 14, flex: "1 1 auto" }}>{item.name}</strong>
            )}
            {item.type === "position" && hasAdminAccess && (
              <input 
                type="text" 
                placeholder="Сотрудник" 
                value={item.employee || ""} 
                onChange={(e) => editEmployee(item.id, e.target.value)} 
                style={{ 
                  background: "rgba(0,0,0,0.15)", 
                  border: "none", 
                  fontSize: 13, 
                  fontStyle: "italic", 
                  minWidth: "180px",
                  maxWidth: "100%",
                  width: "auto",
                  padding: "6px 14px",
                  borderRadius: 20,
                  color: "inherit",
                  flex: "1 1 auto"
                }} 
              />
            )}
            {item.type === "position" && item.employee && !hasAdminAccess && (
              <span style={{ 
                fontSize: 13, 
                background: "rgba(0,0,0,0.15)", 
                padding: "4px 14px", 
                borderRadius: 20,
                wordBreak: "break-word",
                whiteSpace: "normal",
                flex: "1 1 auto"
              }}>
                👤 {item.employee}
              </span>
            )}
          </div>
          {hasAdminAccess && (
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {item.type === "department" && (
                <button 
                  onClick={() => addPosition(item.id)} 
                  style={{ 
                    background: "#10b981", 
                    color: "white", 
                    border: "none", 
                    padding: "6px 14px", 
                    borderRadius: 8, 
                    cursor: "pointer", 
                    fontSize: 12,
                    whiteSpace: "nowrap"
                  }}
                >
                  + Должность
                </button>
              )}
              <button 
                onClick={() => deleteItem(item.id)} 
                style={{ 
                  background: "#ef4444", 
                  color: "white", 
                  border: "none", 
                  padding: "6px 14px", 
                  borderRadius: 8, 
                  cursor: "pointer", 
                  fontSize: 12,
                  whiteSpace: "nowrap"
                }}
              >
                🗑️
              </button>
            </div>
          )}
        </div>
        {item.children && item.children.length > 0 && renderOrgTree(item.children, level + 1)}
      </div>
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const closeAllDropdowns = () => {
    setIsServicesDropdownOpen(false);
    setIsHrDropdownOpen(false);
    setIsNetworkDropdownOpen(false);
    setIsToolsDropdownOpen(false);
    setIsNotificationsOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem("darkMode", !darkMode);
    document.body.classList.toggle("dark");
  };

  const openModal = () => { setNotificationText(""); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setNotificationText(""); };
  const openManageModal = () => setIsManageModalOpen(true);
  const closeManageModal = () => setIsManageModalOpen(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") {
      setDarkMode(true);
      document.body.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) closeAllDropdowns();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserRole();
      fetchAdGroups();
      fetchCalendarGroups();
      fetchAllAdUsers();
      loadNews();
      loadNotifications();
      loadCalendarEvents();
      fetchWeather();
      loadNotes();
      loadOrganizationTree();
      loadVacationReplacements();
      loadUserServices();
      loadUserNetworkResources();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Загрузка...</div>;

  // ============ СТИЛИ ============
  const styles = {
    container: { height: "100vh", display: "flex", flexDirection: "column", background: darkMode ? "#0f172a" : "#f0f2f5", overflow: "hidden" },
    sidebar: { 
      position: "fixed", left: 0, top: 0, height: "100%", width: sidebarOpen ? 280 : 80, 
      background: darkMode ? "#1e293b" : "white", 
      borderRight: darkMode ? "2px solid #334155" : "2px solid #cbd5e1", 
      transition: "width 0.3s ease", zIndex: 40, overflowY: "auto", overflowX: "hidden"
    },
    mainContent: { marginLeft: sidebarOpen ? 280 : 80, transition: "margin-left 0.3s ease", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" },
    scrollArea: { flex: 1, overflowY: "auto", padding: "20px 24px" },
    header: { 
      background: darkMode ? "#1e293b" : "white", 
      borderBottom: darkMode ? "2px solid #334155" : "2px solid #cbd5e1", 
      padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 30
    },
    headerLeft: { display: "flex", gap: 8, flexWrap: "wrap" },
    headerRight: { display: "flex", gap: 12, alignItems: "center" },
    banner: { 
      background: "linear-gradient(135deg, #3b82f6, #4f46e5, #7c3aed)", 
      borderRadius: 20, padding: 28, color: "white", marginBottom: 24,
      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
      position: "relative", overflow: "hidden"
    },
    dropdownBtn: { 
      background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", 
      padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, 
      display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    },
    dropdownMenu: { 
      position: "absolute", top: "100%", left: 0, marginTop: 8, 
      background: darkMode ? "#1e293b" : "white", 
      border: darkMode ? "2px solid #334155" : "2px solid #cbd5e1", 
      borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", 
      zIndex: 50, width: 280, overflow: "hidden"
    },
    dropdownItem: { 
      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
      border: "none", background: "transparent", cursor: "pointer", textAlign: "left", 
      fontSize: 13, color: darkMode ? "#f1f5f9" : "#1e293b",
      transition: "all 0.15s"
    },
    mainGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 },
    newsCard: { 
      background: darkMode ? "#1e293b" : "white", 
      borderRadius: 20, overflow: "hidden", 
      border: darkMode ? "2px solid #334155" : "2px solid #cbd5e1",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    },
    newsItem: { padding: "20px 24px", borderBottom: darkMode ? "2px solid #334155" : "2px solid #e2e8f0", transition: "all 0.2s ease", wordBreak: "break-word" },
    newsTitle: { fontSize: 20, fontWeight: 700, marginBottom: 12, color: darkMode ? "#f1f5f9" : "#1e293b", lineHeight: 1.3 },
    newsContent: { fontSize: 15, lineHeight: 1.6, color: darkMode ? "#cbd5e1" : "#334155", wordBreak: "break-word", marginBottom: 12 },
    sectionHeader: { 
      display: "flex", justifyContent: "space-between", alignItems: "center", 
      padding: "16px 20px", borderBottom: darkMode ? "2px solid #334155" : "2px solid #e2e8f0" 
    },
    btnPrimary: { 
      background: "linear-gradient(135deg, #3b82f6, #2563eb)", 
      color: "white", border: "none", padding: "6px 14px", 
      borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 500,
      transition: "all 0.2s"
    },
    modalOverlay: { 
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", 
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      pointerEvents: "auto"
    },
    modalContent: { 
      background: darkMode ? "#1e293b" : "white", 
      borderRadius: 20, padding: 24, width: 650, 
      maxWidth: "95%", maxHeight: "85vh", overflowY: "auto", overflowX: "hidden",
      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
      pointerEvents: "auto"
    },
    
    // Calendar styles with sticky headers
    calendarContainer: {
      background: darkMode ? "#1e293b" : "white",
      borderRadius: 20,
      border: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
    },
    calendarHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderBottom: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
      background: darkMode ? "#0f172a" : "#f8fafc",
      flexWrap: "wrap",
      gap: 12,
      position: "sticky",
      top: 0,
      zIndex: 20
    },
    calendarNavGroup: {
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    calendarViewSwitcher: {
      display: "flex",
      gap: 4,
      background: darkMode ? "#1e293b" : "#f1f5f9",
      borderRadius: 10,
      padding: 4
    },
    calendarViewBtn: {
      padding: "6px 16px",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 500,
      background: "transparent",
      color: darkMode ? "#94a3b8" : "#64748b",
      transition: "all 0.2s"
    },
    calendarViewBtnActive: {
      background: "#3b82f6",
      color: "white"
    },
    calendarMonth: {
      fontSize: 18,
      fontWeight: 600,
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    calendarNavBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 8,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      color: darkMode ? "#94a3b8" : "#64748b"
    },
    calendarWeekdays: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      borderBottom: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
      background: darkMode ? "#0f172a" : "#f8fafc",
      position: "sticky",
      top: 73,
      zIndex: 15
    },
    calendarWeekday: {
      padding: "12px 8px",
      textAlign: "center",
      fontSize: 13,
      fontWeight: 600,
      color: darkMode ? "#cbd5e1" : "#475569",
      borderRight: darkMode ? "1px solid #334155" : "1px solid #e2e8f0"
    },
    calendarDays: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      minHeight: 550
    },
    calendarDay: {
      borderRight: darkMode ? "2px solid #334155" : "2px solid #d1d5db",
      borderBottom: darkMode ? "2px solid #334155" : "2px solid #d1d5db",
      padding: "4px",
      minHeight: 120,
      cursor: "pointer",
      transition: "all 0.2s",
      background: darkMode ? "#1e293b" : "white",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden"
    },
    calendarDayEmpty: {
      borderRight: darkMode ? "2px solid #334155" : "2px solid #d1d5db",
      borderBottom: darkMode ? "2px solid #334155" : "2px solid #d1d5db",
      padding: "10px",
      minHeight: 120,
      background: darkMode ? "#0f172a" : "#f8fafc"
    },
    calendarDayToday: {
      background: darkMode ? "rgba(59,130,246,0.2)" : "#eff6ff",
      border: darkMode ? "2px solid #3b82f6" : "2px solid #3b82f6"
    },
    calendarDayNumber: {
      fontSize: 15,
      fontWeight: 600,
      marginBottom: 4,
      color: darkMode ? "#f1f5f9" : "#1e293b",
      position: "relative",
      zIndex: 2,
      padding: "2px 4px"
    },
    calendarDayEvents: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      flex: 1,
      position: "relative",
      zIndex: 2
    },
    calendarDayEvent: {
      fontSize: 11,
      fontWeight: 500,
      padding: "4px 6px",
      borderRadius: 4,
      color: "white",
      cursor: "pointer",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      width: "100%",
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      display: "flex",
      alignItems: "center",
      gap: 4
    },
    calendarDayFullEvent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 0,
      margin: 0,
      padding: "8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      zIndex: 1
    },
    calendarDayFullEventTitle: {
      fontWeight: 600,
      fontSize: 12,
      marginBottom: 4,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      width: "100%"
    },
    calendarDayFullEventTime: {
      fontSize: 10,
      opacity: 0.85
    },
    
    // Week view styles
    weekTableContainer: {
      width: "100%",
      overflowX: "auto",
      overflowY: "auto",
      maxHeight: "calc(100vh - 200px)",
      position: "relative"
    },
    weekTableHeader: {
      display: "grid",
      gridTemplateColumns: "80px repeat(7, 1fr)",
      borderBottom: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
      background: darkMode ? "#0f172a" : "#f8fafc",
      position: "sticky",
      top: 0,
      zIndex: 10
    },
    weekTableHeaderTimeCell: {
      padding: "12px 8px",
      fontSize: 13,
      fontWeight: 600,
      color: darkMode ? "#cbd5e1" : "#475569",
      textAlign: "center",
      borderRight: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
      background: darkMode ? "#0f172a" : "#f8fafc"
    },
    weekTableHeaderDayCell: {
      padding: "12px 8px",
      fontSize: 13,
      fontWeight: 600,
      color: darkMode ? "#f1f5f9" : "#1e293b",
      textAlign: "center",
      borderRight: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      background: darkMode ? "#0f172a" : "#f8fafc"
    },
    weekTableHeaderToday: {
      background: darkMode ? "rgba(59,130,246,0.2)" : "#eff6ff"
    },
    weekTableBody: {
      display: "flex",
      flexDirection: "column"
    },
    weekTableRow: {
      display: "grid",
      gridTemplateColumns: "80px repeat(7, 1fr)",
      minHeight: 60,
      borderBottom: darkMode ? "1px solid #334155" : "1px solid #d1d5db"
    },
    weekTableTimeCell: {
      padding: "8px 8px",
      fontSize: 12,
      fontWeight: 500,
      color: darkMode ? "#cbd5e1" : "#475569",
      textAlign: "center",
      borderRight: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: darkMode ? "#0f172a" : "#f8fafc"
    },
    weekTableCell: {
      padding: "0",
      position: "relative",
      cursor: "pointer",
      minHeight: 60,
      transition: "background 0.2s",
      borderRight: darkMode ? "1px solid #334155" : "1px solid #d1d5db"
    },
    weekTableCellToday: {
      background: darkMode ? "rgba(59,130,246,0.1)" : "#f0f9ff"
    },
    weekTableEvent: {
      position: "absolute",
      top: 2,
      left: 2,
      right: 2,
      bottom: 2,
      borderRadius: 6,
      padding: "6px 8px",
      color: "white",
      fontSize: 11,
      cursor: "pointer",
      overflow: "hidden",
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    },
    weekTableEventTitle: {
      fontWeight: 600,
      fontSize: 11,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    weekTableEventTime: {
      fontSize: 10,
      opacity: 0.85
    },
    
    // Day view styles
    dayViewContainer: {
      display: "flex",
      flexDirection: "column",
      maxHeight: "calc(100vh - 200px)",
      overflowY: "auto",
      position: "relative"
    },
    dayHeader: {
      padding: "16px 20px",
      borderBottom: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
      background: darkMode ? "#0f172a" : "#f8fafc",
      position: "sticky",
      top: 0,
      zIndex: 10
    },
    dayHeaderToday: {
      background: darkMode ? "rgba(59,130,246,0.15)" : "#eff6ff"
    },
    dayHeaderDate: {
      fontSize: 18,
      fontWeight: 600,
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    dayGridWrapper: {
      display: "flex",
      flexDirection: "column"
    },
    dayGrid: {
      display: "flex",
      width: "100%"
    },
    timeColumn: {
      width: 70,
      flexShrink: 0,
      borderRight: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
      background: darkMode ? "#0f172a" : "#f8fafc"
    },
    timeCell: {
      height: 60,
      minHeight: 60,
      maxHeight: 60,
      padding: "0 12px",
      fontSize: 13,
      fontWeight: 500,
      color: darkMode ? "#cbd5e1" : "#475569",
      borderBottom: darkMode ? "1px solid #334155" : "1px solid #d1d5db",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      boxSizing: "border-box"
    },
    dayEventsColumn: {
      flex: 1,
      minWidth: 0
    },
    hourCell: {
      height: 60,
      minHeight: 60,
      maxHeight: 60,
      borderBottom: darkMode ? "1px solid #334155" : "1px solid #d1d5db",
      position: "relative",
      cursor: "pointer",
      padding: "0",
      boxSizing: "border-box",
      backgroundColor: darkMode ? "transparent" : "white"
    },
    hourCellEven: {
      backgroundColor: darkMode ? "rgba(255,255,255,0.02)" : "#fafafa"
    },
    dayEventCard: {
      position: "absolute",
      top: 2,
      left: 2,
      right: 2,
      bottom: 2,
      borderRadius: 6,
      padding: "6px 8px",
      color: "white",
      cursor: "pointer",
      fontSize: 12,
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    },
    dayEventTitle: {
      fontWeight: 600,
      fontSize: 12,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    dayEventTime: {
      fontSize: 10,
      opacity: 0.85
    },
    
    participantsList: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
      marginBottom: 16
    },
    participantBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 13,
      background: darkMode ? "#334155" : "#e2e8f0",
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    searchResultsBox: {
      border: darkMode ? "2px solid #334155" : "2px solid #cbd5e1",
      borderRadius: 8,
      maxHeight: 150,
      overflow: "auto",
      marginTop: 8,
      background: darkMode ? "#0f172a" : "white"
    },
    searchResultItem: {
      padding: "10px 12px",
      borderBottom: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    tooltip: {
      position: "fixed",
      background: darkMode ? "#1e293b" : "white",
      border: darkMode ? "2px solid #334155" : "2px solid #cbd5e1",
      borderRadius: 12,
      padding: "12px 16px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      zIndex: 1001,
      maxWidth: 320,
      fontSize: 13,
      pointerEvents: "none"
    },
    unreadBadge: {
      background: "#ef4444",
      color: "white",
      borderRadius: "50%",
      padding: "2px 6px",
      fontSize: 10,
      fontWeight: "bold",
      marginLeft: 8
    },
    lightboxOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.95)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    },
    lightboxContent: {
      position: "relative",
      maxWidth: "90vw",
      maxHeight: "90vh"
    },
    lightboxImage: {
      maxWidth: "90vw",
      maxHeight: "90vh",
      objectFit: "contain"
    },
    lightboxNav: {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      background: "rgba(0,0,0,0.5)",
      border: "none",
      borderRadius: "50%",
      width: 48,
      height: 48,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "white"
    },
    lightboxPrev: { left: 20 },
    lightboxNext: { right: 20 },
    lightboxClose: {
      position: "absolute",
      top: 20,
      right: 20,
      background: "rgba(0,0,0,0.5)",
      border: "none",
      borderRadius: "50%",
      width: 40,
      height: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "white"
    },
    lightboxCounter: {
      position: "absolute",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.5)",
      padding: "4px 12px",
      borderRadius: 20,
      color: "white",
      fontSize: 13
    },
    weatherCard: {
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      position: "relative",
      overflow: "hidden",
      minHeight: 180
    },
    searchInput: {
      width: "100%",
      padding: "12px 16px",
      border: darkMode ? "2px solid #334155" : "2px solid #cbd5e1",
      borderRadius: 10,
      background: darkMode ? "#0f172a" : "white",
      color: darkMode ? "#f1f5f9" : "#1e293b",
      fontSize: 14,
      marginBottom: 16
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: darkMode ? "2px solid #334155" : "2px solid #cbd5e1",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 12,
      boxSizing: "border-box",
      background: darkMode ? "#0f172a" : "white",
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      border: darkMode ? "2px solid #334155" : "2px solid #cbd5e1",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 12,
      background: darkMode ? "#0f172a" : "white",
      color: darkMode ? "#f1f5f9" : "#1e293b"
    },
    radioGroup: { display: "flex", gap: 20, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }
  };

  const getWeatherBackground = () => {
    if (!weather) return "#1e293b";
    if (weather.conditionText === "Ясно") return "linear-gradient(135deg, #3b82f6, #60a5fa)";
    if (weather.conditionText === "Облачно") return "linear-gradient(135deg, #64748b, #94a3b8)";
    if (weather.conditionText === "Дождь") return "linear-gradient(135deg, #475569, #64748b)";
    if (weather.conditionText === "Снег") return "linear-gradient(135deg, #1e293b, #475569)";
    return "linear-gradient(135deg, #1e293b, #0f172a)";
  };

  return (
    <div style={styles.container}>
      {message.text && (
        <div style={{ 
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", 
          background: message.type === "error" ? "#ef4444" : "#10b981", 
          color: "white", padding: "10px 20px", borderRadius: 30, zIndex: 2000,
          fontSize: 13, fontWeight: 500, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
        }}>
          {message.text}
        </div>
      )}

      {tooltipEvent && (
        <div style={{ ...styles.tooltip, top: tooltipPosition.y, left: tooltipPosition.x }}>
          <strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>{tooltipEvent.title}</strong>
          <div style={{ marginBottom: 4 }}>📅 {tooltipEvent.event_date} {!tooltipEvent.is_all_day && tooltipEvent.event_time}</div>
          <div style={{ marginBottom: 4 }}>🏷️ {getEventTypeLabel(tooltipEvent.event_type)}</div>
          {tooltipEvent.location && <div style={{ marginBottom: 4 }}>📍 {tooltipEvent.location}</div>}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
            <strong>👥 Участники:</strong>
            <div style={{ fontSize: 12, marginTop: 4 }}>{getParticipantsNames(tooltipEvent.participants)}</div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div style={styles.lightboxOverlay} onClick={closeLightbox}>
          <button style={{ ...styles.lightboxNav, ...styles.lightboxPrev }} onClick={(e) => { e.stopPropagation(); prevImage(); }}><ArrowLeft size={24} /></button>
          <div style={styles.lightboxContent} onClick={e => e.stopPropagation()}><img src={lightboxImage} alt="Просмотр" style={styles.lightboxImage} /></div>
          <button style={{ ...styles.lightboxNav, ...styles.lightboxNext }} onClick={(e) => { e.stopPropagation(); nextImage(); }}><ArrowRight size={24} /></button>
          <button style={styles.lightboxClose} onClick={closeLightbox}><X size={20} /></button>
          {lightboxImages.length > 1 && <div style={styles.lightboxCounter}>{lightboxIndex + 1} / {lightboxImages.length}</div>}
        </div>
      )}

            <ToastNotification getToken={getToken} darkMode={darkMode} />
      

      <div style={styles.sidebar}>
        <div style={{ padding: 20, borderBottom: darkMode ? "2px solid #334155" : "2px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: darkMode ? "white" : "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                <img src="/logo.png" alt="Гипронииавиапром" style={{ height: 32 }} />
                <span>Гипронииавиапром</span>
              </div>
              <div style={{ fontSize: 11, color: darkMode ? "#94a3b8" : "#64748b", marginTop: 4 }}>Корпоративный портал</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: darkMode ? "#94a3b8" : "#64748b" }}>☰</button>
        </div>
        
        <nav style={{ padding: 16 }}>
          {[
            { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Главная" },
            { id: "events", icon: <Calendar size={20} />, label: "События", badge: unreadCalendarNotificationsCount },
            { id: "calendar", icon: <Calendar size={20} />, label: "Календарь" },
            { id: "chat", icon: <MessageSquare size={20} />, label: "Чат" },
            { id: "replacements", icon: <Users size={20} />, label: "Замещение" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", 
                padding: "10px 14px", marginBottom: 6, border: "none", 
                background: activeTab === item.id ? "linear-gradient(135deg, #3b82f6, #4f46e5)" : "transparent",
                color: activeTab === item.id ? "white" : (darkMode ? "#94a3b8" : "#475569"),
                borderRadius: 12, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              {item.icon}
              {sidebarOpen && (
                <>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                  {item.badge > 0 && <span style={styles.unreadBadge}>{item.badge}</span>}
                </>
              )}
            </button>
          ))}
          
          {hasITAccess && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setIsItSubmenuOpen(!isItSubmenuOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%", 
                  padding: "10px 14px", marginBottom: 6, border: "none", 
                  background: (activeTab === "it_tasks" || activeTab === "it_equipment") ? "linear-gradient(135deg, #3b82f6, #4f46e5)" : "transparent",
                  color: (activeTab === "it_tasks" || activeTab === "it_equipment") ? "white" : (darkMode ? "#94a3b8" : "#475569"),
                  borderRadius: 12, cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <Wrench size={20} />
                {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 500 }}>IT Задачи</span>}
                {sidebarOpen && <ChevronDown size={14} style={{ marginLeft: "auto" }} />}
              </button>
              
              {sidebarOpen && isItSubmenuOpen && (
                <div style={{ marginLeft: 32, marginBottom: 6 }}>
                  <button
                    onClick={() => { setActiveTab("it_tasks"); setActiveItSubmenu("tasks"); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%", 
                      padding: "8px 14px", marginBottom: 4, border: "none", 
                      background: activeTab === "it_tasks" && activeItSubmenu === "tasks" ? "linear-gradient(135deg, #3b82f6, #4f46e5)" : "transparent",
                      color: activeTab === "it_tasks" && activeItSubmenu === "tasks" ? "white" : (darkMode ? "#94a3b8" : "#475569"),
                      borderRadius: 10, cursor: "pointer", transition: "all 0.2s", fontSize: 13
                    }}
                  >
                    📋 Задачи
                  </button>
                  <button
                    onClick={() => { setActiveTab("it_tasks"); setActiveItSubmenu("periodic"); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%", 
                      padding: "8px 14px", marginBottom: 4, border: "none", 
                      background: activeTab === "it_tasks" && activeItSubmenu === "periodic" ? "linear-gradient(135deg, #3b82f6, #4f46e5)" : "transparent",
                      color: activeTab === "it_tasks" && activeItSubmenu === "periodic" ? "white" : (darkMode ? "#94a3b8" : "#475569"),
                      borderRadius: 10, cursor: "pointer", transition: "all 0.2s", fontSize: 13
                    }}
                  >
                    🔄 Периодические
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { setActiveTab("it_tasks"); setActiveItSubmenu("monitoring"); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, width: "100%", 
                        padding: "8px 14px", marginBottom: 4, border: "none", 
                        background: activeTab === "it_tasks" && activeItSubmenu === "monitoring" ? "linear-gradient(135deg, #3b82f6, #4f46e5)" : "transparent",
                        color: activeTab === "it_tasks" && activeItSubmenu === "monitoring" ? "white" : (darkMode ? "#94a3b8" : "#475569"),
                        borderRadius: 10, cursor: "pointer", transition: "all 0.2s", fontSize: 13
                      }}
                    >
                      📊 Мониторинг
                    </button>
                  )}
                  <button
                    onClick={() => { setActiveTab("it_equipment"); setActiveItSubmenu("equipment"); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%", 
                      padding: "8px 14px", marginBottom: 4, border: "none", 
                      background: activeTab === "it_equipment" ? "linear-gradient(135deg, #3b82f6, #4f46e5)" : "transparent",
                      color: activeTab === "it_equipment" ? "white" : (darkMode ? "#94a3b8" : "#475569"),
                      borderRadius: 10, cursor: "pointer", transition: "all 0.2s", fontSize: 13
                    }}
                  >
                    🔧 Комплектующие
                  </button>
                </div>
              )}
            </div>
          )}
          
          {(hasAdminAccess || isModerator) && (
            <button
              onClick={() => setActiveTab("admin")}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", 
                padding: "10px 14px", marginBottom: 6, border: "none", 
                background: activeTab === "admin" ? "linear-gradient(135deg, #3b82f6, #4f46e5)" : "transparent",
                color: activeTab === "admin" ? "white" : (darkMode ? "#94a3b8" : "#475569"),
                borderRadius: 12, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <Shield size={20} />
              {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 500 }}>Администрирование</span>}
            </button>
          )}
        </nav>
        
        <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, padding: 16 }}>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px", border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", borderRadius: 12, transition: "all 0.2s", fontWeight: 500, fontSize: 14 }}>
            <LogOut size={20} />
            {sidebarOpen && <span>Выйти</span>}
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div style={styles.headerLeft} className="dropdown-container">
            <div style={{ position: "relative" }}>
              <button onClick={() => { closeAllDropdowns(); setIsServicesDropdownOpen(!isServicesDropdownOpen); }} style={styles.dropdownBtn}>📎 Сервисы ▼</button>
              {isServicesDropdownOpen && (
                <div style={styles.dropdownMenu}>
                  {userServices.length === 0 ? <div style={{ padding: "10px 14px", color: "#64748b" }}>Нет доступных сервисов</div> : userServices.map((service, idx) => (
                    <a key={idx} href={service.service_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", textDecoration: "none", color: "inherit", borderBottom: idx < userServices.length - 1 ? (darkMode ? "1px solid #334155" : "1px solid #e2e8f0") : "none", fontSize: 13 }}>
                      <span style={{ fontSize: 18 }}>{service.service_icon || "🔗"}</span> {service.service_name}
                    </a>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ position: "relative" }}>
              <button onClick={() => { closeAllDropdowns(); setIsHrDropdownOpen(!isHrDropdownOpen); }} style={styles.dropdownBtn}>🏢 Организация ▼</button>
              {isHrDropdownOpen && (
                <div style={styles.dropdownMenu}>
                  <button onClick={() => { setIsOrgModalOpen(true); setIsHrDropdownOpen(false); }} style={styles.dropdownItem}>🏢 Структура организации</button>
                  <button onClick={() => { setIsReplacementModalOpen(true); setIsHrDropdownOpen(false); }} style={{ ...styles.dropdownItem, borderBottom: "none" }}>🔄 Замены на отпуск</button>
                </div>
              )}
            </div>
            
            <div style={{ position: "relative" }}>
              <button onClick={() => { closeAllDropdowns(); setIsNetworkDropdownOpen(!isNetworkDropdownOpen); }} style={styles.dropdownBtn}>📁 Сетевые ресурсы ▼</button>
              {isNetworkDropdownOpen && (
                <div style={styles.dropdownMenu}>
                  {userNetworkCategories.length === 0 ? <div style={{ padding: "10px 14px", color: "#64748b" }}>Нет доступных категорий</div> : userNetworkCategories.map(category => (
                    <button key={category.id} onClick={() => openNetworkModal(category)} style={styles.dropdownItem}>
                      <span style={{ fontSize: 16 }}>{category.icon}</span>
                      {category.name}
                      <span style={{ color: "#64748b", marginLeft: "auto", fontSize: 11 }}>{category.resources.length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ position: "relative" }}>
              <button onClick={() => { closeAllDropdowns(); setIsToolsDropdownOpen(!isToolsDropdownOpen); }} style={styles.dropdownBtn}>🛠️ Инструменты ▼</button>
              {isToolsDropdownOpen && (
                <div style={styles.dropdownMenu}>
                  <button onClick={() => { setIsNotesModalOpen(true); setIsToolsDropdownOpen(false); }} style={{ ...styles.dropdownItem, borderBottom: "none" }}>📝 Заметки</button>
                </div>
              )}
            </div>
          </div>
          
          <div style={styles.headerRight}>
            <button onClick={toggleDarkMode} style={{ background: darkMode ? "#334155" : "#f1f5f9", border: "none", padding: 8, borderRadius: 10, cursor: "pointer", color: darkMode ? "#f1f5f9" : "#475569" }}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div style={{ position: "relative" }} className="dropdown-container">
              <button onClick={() => { closeAllDropdowns(); setIsNotificationsOpen(!isNotificationsOpen); }} style={{ background: darkMode ? "#334155" : "#f1f5f9", border: "none", padding: 8, borderRadius: 10, cursor: "pointer", position: "relative" }}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{ 
                    position: "absolute", 
                    top: -2, 
                    right: -2, 
                    background: "#ef4444", 
                    color: "white", 
                    fontSize: 9, 
                    fontWeight: "bold", 
                    padding: "2px 6px", 
                    borderRadius: 20,
                    minWidth: 18,
                    textAlign: "center"
                  }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {isNotificationsOpen && (
                <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 8, width: 360, background: darkMode ? "#1e293b" : "white", borderRadius: 16, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden", maxHeight: 500, overflowY: "auto" }}>
                  <div style={{ position: "sticky", top: 0, background: darkMode ? "#1e293b" : "white", zIndex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: 14, borderBottom: darkMode ? "2px solid #334155" : "2px solid #e2e8f0" }}>
                      <strong>📢 Оповещения ({unreadCount})</strong>
                      <button onClick={markAllAsRead} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 12 }}>Все прочитаны</button>
                    </div>
                  </div>
                  
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => markAsRead(n.id)} style={{ padding: 12, borderBottom: darkMode ? "1px solid #334155" : "1px solid #f1f5f9", background: n.read ? "transparent" : (darkMode ? "rgba(59,130,246,0.2)" : "#eff6ff"), cursor: "pointer" }}>
                        <div style={{ fontSize: 13, fontWeight: n.read ? "normal" : "bold" }}>{n.text}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                      <Bell size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                      <div>Нет оповещений</div>
                    </div>
                  )}
                  
                  {hasAdminAccess && (
                    <div style={{ padding: 12, borderTop: darkMode ? "2px solid #334155" : "2px solid #e2e8f0", display: "flex", gap: 8, position: "sticky", bottom: 0, background: darkMode ? "#1e293b" : "white" }}>
                      <button onClick={openModal} style={{ flex: 1, background: "#3b82f6", color: "white", border: "none", padding: 8, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>+ Добавить</button>
                      <button onClick={openManageModal} style={{ flex: 1, background: darkMode ? "#334155" : "#f1f5f9", border: "none", padding: 8, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>⚙️ Управление</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #4f46e5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 15, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              {currentUserDisplayName.charAt(0)}
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                  {currentUserDisplayName}
                </div>
                <div style={{ fontSize: 11, color: darkMode ? "#94a3b8" : "#64748b" }}>
                  {getRoleDisplayName()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.scrollArea}>
          {activeTab === "dashboard" && (
            <>
              <div style={styles.banner}>
                <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
                <div style={{ position: "absolute", bottom: -40, left: -40, width: 150, height: 150, background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)", borderRadius: "50%" }} />
                <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10, position: "relative", zIndex: 1 }}>Добро пожаловать, {currentUserDisplayName}!</h1>
                <p style={{ fontSize: 14, opacity: 0.9, position: "relative", zIndex: 1 }}>Корпоративный портал АО «Казанский Гипронииавиапром»</p>
              </div>
              <div style={styles.mainGrid}>
                <div style={styles.newsCard}>
                  <div style={styles.sectionHeader}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: darkMode ? "#f1f5f9" : "#1e293b" }}>📰 Новости предприятия</h3>
                    {canManageNews && <button onClick={() => setIsAddNewsModalOpen(true)} style={styles.btnPrimary}>+ Добавить</button>}
                  </div>
                  {isLoadingNews ? (
                    <div style={{ padding: 40, textAlign: "center" }}>
                      <div style={{ width: 36, height: 36, border: `3px solid ${darkMode ? "#334155" : "#e2e8f0"}`, borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                      <p style={{ color: "#64748b" }}>Загрузка новостей...</p>
                    </div>
                  ) : news.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center" }}><span style={{ fontSize: 48 }}>📭</span><p style={{ color: "#64748b", marginTop: 12 }}>Нет новостей</p></div>
                  ) : (
                    news.map(item => (
                      <div key={item.id} style={styles.newsItem} onMouseEnter={e => e.currentTarget.style.background = darkMode ? "#334155" : "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{new Date(item.pub_date).toLocaleDateString()}</div>
                        <h4 style={styles.newsTitle}>{item.title}</h4>
                        <p style={styles.newsContent}>{item.content}</p>
                        {item.images && item.images.length > 0 && renderImageGallery(item.images, darkMode)}
                        {canManageNews && (
                          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button onClick={() => openEditNewsModal(item)} style={{ background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                              ✏️ Редактировать
                            </button>
                            <button onClick={() => deleteNews(item.id)} style={{ background: "#fee2e2", border: "none", padding: "6px 12px", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontSize: 12 }}>
                              🗑️ Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div>
                  {weather && (
                    <div style={{ ...styles.weatherCard, background: getWeatherBackground(), color: "white" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <span style={{ fontSize: 14, opacity: 0.9 }}>Казань</span>
                        <span style={{ fontSize: 48 }}>{weather.conditionIcon}</span>
                      </div>
                      <div style={{ fontSize: 42, fontWeight: 700, marginBottom: 8 }}>{weather.temp}°C</div>
                      <div style={{ fontSize: 14, marginBottom: 4, opacity: 0.9 }}>{weather.conditionText}</div>
                      <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 13, opacity: 0.8 }}><span>💨 {weather.windSpeed} км/ч</span></div>
                    </div>
                  )}
                  <div style={{ background: darkMode ? "#1e293b" : "white", borderRadius: 20, padding: 20, border: darkMode ? "2px solid #334155" : "2px solid #cbd5e1" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: darkMode ? "#f1f5f9" : "#1e293b", marginBottom: 16 }}>🔗 Быстрые ссылки</h3>
                    {userServices.slice(0, 5).map((service, idx) => (
                      <a key={idx} href={service.service_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: darkMode ? "1px solid #334155" : "1px solid #e2e8f0", textDecoration: "none", color: darkMode ? "#94a3b8" : "#475569", fontSize: 14, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#3b82f6"} onMouseLeave={e => e.currentTarget.style.color = darkMode ? "#94a3b8" : "#475569"}>
                        <span><span style={{ marginRight: 8, fontSize: 18 }}>{service.service_icon || "🔗"}</span>{service.service_name}</span>
                        <ExternalLink size={14} style={{ opacity: 0.5 }} />
                      </a>
                    ))}
                    {userServices.length === 0 && <div style={{ color: "#64748b", textAlign: "center", padding: 20 }}>Нет доступных сервисов</div>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "events" && (
            <div style={styles.newsCard}>
              <div style={styles.sectionHeader}>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: darkMode ? "#f1f5f9" : "#1e293b"}}>Все события календаря</h2>
              </div>
              {calendarEventNotifications.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}><Calendar size={48} style={{ marginBottom: 16, opacity: 0.5 }} /><p>Нет событий, где вы указаны как участник</p></div>
              ) : (
                calendarEventNotifications.map(notif => {
                  const event = calendarEvents.find(e => e.id === notif.event_id);
                  if (!event) return null;
                  return (
                    <div key={notif.id} style={{ ...styles.newsItem, background: notif.read ? "transparent" : (darkMode ? "rgba(59,130,246,0.15)" : "#eff6ff"), cursor: "pointer" }} onClick={() => viewEvent(event)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 28 }}>{getEventIcon(event.event_type)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: notif.read ? "normal" : "bold", fontSize: 16 }}>{event.title.replace(/\s*\(начало периода\)\s*/, '').replace(/\s*\(окончание периода\)\s*/, '')}</div>
                          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{getEventTypeLabel(event.event_type)} • {new Date(event.event_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })} {!event.is_all_day && ` в ${event.event_time}`}</div>
                          {event.location && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>📍 {event.location}</div>}
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                            👥 {getParticipantsNames(event.participants)}
                          </div>
                        </div>
                        {!notif.read && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "calendar" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
                <button 
                  onClick={() => setCalendarSubtab("view")}
                  style={{ 
                    padding: "8px 20px", 
                    border: "none", 
                    background: calendarSubtab === "view" ? "#3b82f6" : "transparent",
                    color: calendarSubtab === "view" ? "white" : "#64748b",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 500
                  }}
                >
                  📅 Просмотр
                </button>
                <button 
                  onClick={() => setCalendarSubtab("groups")}
                  style={{ 
                    padding: "8px 20px", 
                    border: "none", 
                    background: calendarSubtab === "groups" ? "#3b82f6" : "transparent",
                    color: calendarSubtab === "groups" ? "white" : "#64748b",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 500
                  }}
                >
                  👥 Группы
                </button>
              </div>
              
              {calendarSubtab === "view" && (
                <div style={styles.calendarContainer}>
                  <div style={styles.calendarHeader}>
                    <div style={styles.calendarNavGroup}>
                      <button onClick={() => {
                        if (calendarView === 'month') prevMonth();
                        else if (calendarView === 'week') prevWeek();
                        else prevDay();
                      }} style={styles.calendarNavBtn}>
                        <ChevronLeft size={20} />
                      </button>
                      <button onClick={goToToday} style={styles.calendarNavBtn}>
                        Сегодня
                      </button>
                      <button onClick={() => {
                        if (calendarView === 'month') nextMonth();
                        else if (calendarView === 'week') nextWeek();
                        else nextDay();
                      }} style={styles.calendarNavBtn}>
                        <ChevronRight size={20} />
                      </button>
                    </div>
                    <span style={styles.calendarMonth}>
                      {calendarView === 'month' && currentDate.toLocaleString("ru-RU", { month: "long", year: "numeric" })}
                      {calendarView === 'week' && `Неделя ${Math.ceil((currentDate.getDate() - currentDate.getDay() + 1) / 7)} • ${currentDate.toLocaleString("ru-RU", { month: "long", year: "numeric" })}`}
                      {calendarView === 'day' && currentDate.toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <div style={styles.calendarViewSwitcher}>
                      <button onClick={() => setCalendarView('month')} style={{ ...styles.calendarViewBtn, ...(calendarView === 'month' ? styles.calendarViewBtnActive : {}) }}>Месяц</button>
                      <button onClick={() => setCalendarView('week')} style={{ ...styles.calendarViewBtn, ...(calendarView === 'week' ? styles.calendarViewBtnActive : {}) }}>Неделя</button>
                      <button onClick={() => setCalendarView('day')} style={{ ...styles.calendarViewBtn, ...(calendarView === 'day' ? styles.calendarViewBtnActive : {}) }}>День</button>
                    </div>
                  </div>
                  <div style={styles.calendarWeekdays}>
                    {calendarView === 'month' && getWeekDays().map(day => <div key={day} style={styles.calendarWeekday}>{day}</div>)}
                  </div>
                  <div>
                    {calendarView === 'month' && <div style={styles.calendarDays}>{renderMonthView()}</div>}
                    {calendarView === 'week' && renderWeekView()}
                    {calendarView === 'day' && renderDayView()}
                  </div>
                  <div style={{ padding: 16, borderTop: "1px solid #e2e8f0", fontSize: 13, color: "#64748b" }}>
                    💡 Кликните по дате или времени для добавления события, по событию для просмотра
                  </div>
                </div>
              )}
              
              {calendarSubtab === "groups" && (
                <CalendarGroups showMessage={showMessage} />
              )}
            </div>
          )}

          {activeTab === "chat" && (
            <div style={{ ...styles.newsCard, padding: 60, textAlign: "center" }}>
              <MessageSquare size={64} style={{ marginBottom: 20, opacity: 0.5, color: "#3b82f6" }} />
              <h3 style={{ marginBottom: 16, fontSize: 24 }}>Корпоративный чат</h3>
              <p style={{ marginBottom: 32, color: "#64748b", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                Rocket.Chat — корпоративный мессенджер для общения
              </p>
              <button
                onClick={() => window.open("http://192.168.7.103:3000/home", "_blank")}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white",
                  border: "none",
                  padding: "14px 36px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.3)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.02)";
                  e.target.style.boxShadow = "0 6px 16px rgba(59,130,246,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)";
                }}
              >
                <MessageSquare size={20} /> Открыть чат
              </button>
              <p style={{ marginTop: 24, fontSize: 12, color: "#94a3b8" }}>
                Чат откроется в новом окне
              </p>
            </div>
          )}

          {activeTab === "replacements" && (
            <div style={styles.newsCard}>
              <div style={styles.sectionHeader}>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                  🔄 Замены на отпуск
                </h2>
                {canManageReplacements && (
                  <button onClick={() => setIsReplacementModalOpen(true)} style={styles.btnPrimary}>
                    <Plus size={14} /> Добавить замену
                  </button>
                )}
              </div>
              {vacationReplacements.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
                  <Users size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                  <p>Нет данных о заменах</p>
                </div>
              ) : (
                <div style={{ padding: "20px 24px" }}>
                  {vacationReplacements.map((replacement, idx) => (
                    <div 
                      key={replacement.id || idx} 
                      style={{ 
                        padding: "16px 20px", 
                        marginBottom: 12, 
                        background: darkMode ? "#0f172a" : "#f8fafc", 
                        borderRadius: 12,
                        borderLeft: `4px solid #f59e0b`,
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 28 }}>🔄</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                            {replacement.employee_name} → {replacement.substitute_name}
                          </div>
                          {(replacement.department || replacement.position) && (
                            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
                              {replacement.department} {replacement.position && `• ${replacement.position}`}
                            </div>
                          )}
                          {(replacement.start_date || replacement.end_date) && (
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>
                              📅 {replacement.start_date || "—"} → {replacement.end_date || "—"}
                            </div>
                          )}
                          {replacement.reason && (
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                              📝 {replacement.reason}
                            </div>
                          )}
                        </div>
                        {canManageReplacements && (
                          <button 
                            onClick={() => deleteReplacement(replacement.id)} 
                            style={{ background: "#fee2e2", border: "none", padding: "6px 12px", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontSize: 12 }}
                          >
                            🗑️ Удалить
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "it_tasks" && (
            <>
              {activeItSubmenu === "tasks" && (
                <ITTasks 
                  getToken={getToken} 
                  showMessage={showMessage} 
                  userRole={userRole}
                  isAdminByGroup={false}
                  darkMode={darkMode}
                />
              )}
              {activeItSubmenu === "periodic" && (
                <PeriodicTasks
                showMessage={showMessage} 
                darkMode={darkMode}
                />
                
              )}
              {activeItSubmenu === "monitoring" && isAdmin && (
                <ITMonitoring 
                showMessage={showMessage}
                darkMode={darkMode}
                />
              )}
            </>
          )}

          {activeTab === "it_equipment" && (
            <ITEquipment 
              getToken={getToken} 
              showMessage={showMessage} 
              userRole={userRole}
              isAdminByGroup={false}
              darkMode={darkMode}
            />
          )}

          {activeTab === "admin" && hasAdminAccess &&
           <AdminPanel
           darkMode={darkMode}
           />}
        </div>
      </div>

      {/* Модальное окно: Добавление новости */}
      {isAddNewsModalOpen && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) setIsAddNewsModalOpen(false); }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>➕ Добавить новость</h3>
              <button onClick={() => setIsAddNewsModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: darkMode ? "#94a3b8" : "#64748b" }}>✕</button>
            </div>
            <input type="text" placeholder="Заголовок" value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} style={styles.input} />
            <select value={newsForm.category} onChange={e => setNewsForm({ ...newsForm, category: e.target.value })} style={styles.select}>
              <option value="announcement">📢 Объявление</option>
              <option value="technical">⚙️ Техническое</option>
              <option value="event">🎉 Мероприятие</option>
              <option value="important">⚠️ Важно</option>
            </select>
            <textarea placeholder="Текст" value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} rows={6} style={styles.input} />
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: darkMode ? "#94a3b8" : "#475569" }}>📷 Изображения (можно несколько)</label>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} ref={fileInputRef} style={{ width: "100%" }} />
              {newsForm.imagePreviews.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                  {newsForm.imagePreviews.map((preview, idx) => (
                    <div key={idx} style={{ position: "relative", width: 120 }}>
                      <img src={preview} alt={`Preview ${idx}`} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />
                      <button onClick={() => removeImage(idx)} style={{ position: "absolute", top: 4, right: 4, background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setIsAddNewsModalOpen(false)} style={{ padding: "8px 20px", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, background: "transparent", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Отмена</button>
              <button onClick={saveNews} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Опубликовать</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Редактирование новости */}
      {isEditNewsModalOpen && editingNews && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) setIsEditNewsModalOpen(false); }}>
          <div style={{ ...styles.modalContent, width: 700 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>✏️ Редактировать новость</h3>
              <button onClick={() => setIsEditNewsModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: darkMode ? "#94a3b8" : "#64748b" }}>✕</button>
            </div>
            
            <input type="text" placeholder="Заголовок" value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} style={styles.input} />
            
            <select value={newsForm.category} onChange={e => setNewsForm({ ...newsForm, category: e.target.value })} style={styles.select}>
              <option value="announcement">📢 Объявление</option>
              <option value="technical">⚙️ Техническое</option>
              <option value="event">🎉 Мероприятие</option>
              <option value="important">⚠️ Важно</option>
            </select>
            
            <textarea placeholder="Текст" value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} rows={6} style={styles.input} />
            
            {editingNewsImages.length > 0 && (
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: darkMode ? "#f1f5f9" : "#1e293b" }}>📷 Текущие изображения</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {editingNewsImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative", width: 120 }}>
                      <img 
                        src={`${img}`} 
                        alt={`Текущее ${idx + 1}`} 
                        style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, background: "#f1f5f9" }} 
                      />
                      <button 
                        onClick={() => removeExistingImage(idx)} 
                        style={{ 
                          position: "absolute", top: 4, right: 4, 
                          background: "#ef4444", color: "white", border: "none", 
                          borderRadius: "50%", width: 24, height: 24, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: darkMode ? "#f1f5f9" : "#1e293b" }}>➕ Добавить новые изображения</label>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
              {newsForm.imagePreviews.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                  {newsForm.imagePreviews.map((preview, idx) => (
                    <div key={idx} style={{ position: "relative", width: 120 }}>
                      <img src={preview} alt={`Новое ${idx + 1}`} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />
                      <button 
                        onClick={() => removeImage(idx)} 
                        style={{ 
                          position: "absolute", top: 4, right: 4, 
                          background: "#ef4444", color: "white", border: "none", 
                          borderRadius: "50%", width: 24, height: 24, cursor: "pointer"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setIsEditNewsModalOpen(false)} style={{ padding: "8px 20px", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, background: "transparent", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Отмена</button>
              <button onClick={updateNews} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Добавление оповещения */}
      {isModalOpen && hasAdminAccess && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) closeModal(); }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>✏️ Добавить оповещение</h3>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <textarea value={notificationText} onChange={e => setNotificationText(e.target.value)} rows={4} style={styles.input} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={closeModal} style={{ padding: "8px 20px", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, background: "transparent", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Отмена</button>
              <button onClick={sendNotification} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Отправить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Управление оповещениями */}
      {isManageModalOpen && hasAdminAccess && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) closeManageModal(); }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>⚙️ Управление оповещениями</h3>
              <button onClick={closeManageModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {notifications.map(n => (
              <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, marginBottom: 8, background: darkMode ? "#0f172a" : "#f1f5f9", borderRadius: 10 }}>
                <div><strong>{n.text}</strong><br /><small style={{ color: "#64748b" }}>{new Date(n.created_at).toLocaleString()}</small></div>
                <button onClick={() => deleteNotification(n.id)} style={{ background: "#fee2e2", border: "none", padding: "6px 12px", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontSize: 12 }}>Удалить</button>
              </div>
            ))}
            <button onClick={closeManageModal} style={{ width: "100%", marginTop: 10, background: "#3b82f6", color: "white", border: "none", padding: 10, borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Закрыть</button>
          </div>
        </div>
      )}

      {/* Модальное окно: Заметки */}
      {isNotesModalOpen && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) { setIsNotesModalOpen(false); setCurrentNote({ title: "", content: "" }); setEditingNoteId(null); } }}>
          <div style={{ ...styles.modalContent, width: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>📝 {editingNoteId ? "Редактировать заметку" : "Новая заметка"}</h3>
              <button onClick={() => { setIsNotesModalOpen(false); setCurrentNote({ title: "", content: "" }); setEditingNoteId(null); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <input type="text" placeholder="Заголовок заметки" value={currentNote.title} onChange={e => setCurrentNote({ ...currentNote, title: e.target.value })} style={{ ...styles.input, fontSize: 16, fontWeight: "bold" }} />
            <textarea value={currentNote.content} onChange={e => setCurrentNote({ ...currentNote, content: e.target.value })} placeholder="Текст заметки..." rows={5} style={{ ...styles.input, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 20 }}>
              <button onClick={() => { setIsNotesModalOpen(false); setCurrentNote({ title: "", content: "" }); setEditingNoteId(null); }} style={{ padding: "8px 20px", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, background: "transparent", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Отмена</button>
              {editingNoteId ? <button onClick={updateNote} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Сохранить</button> : <button onClick={addNote} style={{ background: "#10b981", color: "white", border: "none", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>+ Добавить</button>}
            </div>
            <div style={{ maxHeight: 300, overflow: "auto" }}>
              <h4 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: "#64748b" }}>Мои заметки:</h4>
              {notes.length === 0 ? <div style={{ textAlign: "center", padding: 20, color: "#64748b", fontSize: 14 }}>Нет заметок. Создайте первую!</div> : notes.map(note => (
                <div key={note.id} style={{ background: darkMode ? "#0f172a" : "#f1f5f9", padding: 12, marginBottom: 10, borderRadius: 10, cursor: "pointer" }} onClick={() => openNoteModal(note)}>
                  <strong style={{ fontSize: 14 }}>{note.title || "Без заголовка"}</strong>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{note.content.substring(0, 60)}...</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{new Date(note.createdAt).toLocaleDateString()}</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => deleteNote(note.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>🗑️ Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Структура организации */}
      {isOrgModalOpen && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) setIsOrgModalOpen(false); }}>
          <div style={{ ...styles.modalContent, width: 850, maxWidth: "95%" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>🏢 Структура организации</h3>
              <button onClick={() => setIsOrgModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="🔍 Поиск по отделам, должностям или ФИО..."
                  value={orgSearchQuery}
                  onChange={(e) => searchOrganization(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    border: darkMode ? "2px solid #334155" : "2px solid #cbd5e1",
                    borderRadius: 10,
                    background: darkMode ? "#0f172a" : "white",
                    color: darkMode ? "#f1f5f9" : "#1e293b",
                    fontSize: 14,
                    outline: "none"
                  }}
                />
              </div>
              {orgSearchQuery && filteredOrgTree.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  🔍 Ничего не найдено по запросу "{orgSearchQuery}"
                </div>
              )}
            </div>
            
            {hasAdminAccess && <button onClick={addDepartment} style={{ background: "#10b981", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, marginBottom: 15, cursor: "pointer", fontSize: 13 }}>+ Добавить отдел</button>}
            
            <div style={{ maxHeight: "55vh", overflowY: "auto", padding: "4px 8px" }}>
              {filteredOrgTree.length > 0 ? renderOrgTree(filteredOrgTree) : !orgSearchQuery && renderOrgTree(organizationTree)}
              {!orgSearchQuery && filteredOrgTree.length === 0 && organizationTree.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Нет данных. Добавьте отдел или должность</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Замены на отпуск (добавление) */}
      {isReplacementModalOpen && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) setIsReplacementModalOpen(false); }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>🔄 Добавить замену</h3>
              <button onClick={() => setIsReplacementModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <input type="text" placeholder="Отдел" value={replacementForm.department} onChange={e => setReplacementForm({ ...replacementForm, department: e.target.value })} style={styles.input} />
            <input type="text" placeholder="Должность" value={replacementForm.position} onChange={e => setReplacementForm({ ...replacementForm, position: e.target.value })} style={styles.input} />
            
            <UserSearchInput
              value={replacementForm.employeeName}
              onChange={(val) => setReplacementForm({ ...replacementForm, employeeName: val })}
              placeholder="Кто уходит *"
              getToken={getToken}
            />
            
            <UserSearchInput
              value={replacementForm.substituteName}
              onChange={(val) => setReplacementForm({ ...replacementForm, substituteName: val })}
              placeholder="Кто заменяет *"
              getToken={getToken}
            />
            
            <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <DatePicker
                  selected={displayStringToDate(replacementForm.startDate)}
                  onChange={(date) => {
                    if (date) {
                      setReplacementForm({ ...replacementForm, startDate: dateToDisplayString(date) });
                    } else {
                      setReplacementForm({ ...replacementForm, startDate: "" });
                    }
                  }}
                  dateFormat="dd.MM.yyyy"
                  placeholderText="ДД.ММ.ГГГГ"
                  className="custom-datepicker"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  onKeyDown={(e) => handleDateKeyDown(e, (val) => setReplacementForm({ ...replacementForm, startDate: val }))}
                />
              </div>
              {replacementForm.startDate && (
                <button
                  type="button"
                  onClick={() => setReplacementForm({ ...replacementForm, startDate: "" })}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "10px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                  title="Очистить дату"
                >
                  <X size={14} /> Очистить
                </button>
              )}
            </div>
            
            <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <DatePicker
                  selected={displayStringToDate(replacementForm.endDate)}
                  onChange={(date) => {
                    if (date) {
                      setReplacementForm({ ...replacementForm, endDate: dateToDisplayString(date) });
                    } else {
                      setReplacementForm({ ...replacementForm, endDate: "" });
                    }
                  }}
                  dateFormat="dd.MM.yyyy"
                  placeholderText="ДД.ММ.ГГГГ"
                  className="custom-datepicker"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  onKeyDown={(e) => handleDateKeyDown(e, (val) => setReplacementForm({ ...replacementForm, endDate: val }))}
                />
              </div>
              {replacementForm.endDate && (
                <button
                  type="button"
                  onClick={() => setReplacementForm({ ...replacementForm, endDate: "" })}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "10px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                  title="Очистить дату"
                >
                  <X size={14} /> Очистить
                </button>
              )}
            </div>
            
            <input type="text" placeholder="Причина" value={replacementForm.reason} onChange={e => setReplacementForm({ ...replacementForm, reason: e.target.value })} style={styles.input} />
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setIsReplacementModalOpen(false)} style={{ padding: "8px 20px", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, background: "transparent", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>Отмена</button>
              <button onClick={addReplacement} style={{ background: "#10b981", color: "white", border: "none", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>+ Добавить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Добавление/редактирование события календаря */}
      {isEventModalOpen && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) { setIsEventModalOpen(false); resetEventForm(); } }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>{editingEvent ? "✏️ Редактировать" : "➕ Добавить"} событие</h3>
              <button onClick={() => { setIsEventModalOpen(false); resetEventForm(); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            
            <input 
              type="text" 
              placeholder="Название *" 
              value={eventForm.title} 
              onChange={e => setEventForm({ ...eventForm, title: e.target.value })} 
              style={styles.input}
            />
            
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <DatePicker
                    selected={displayStringToDate(eventForm.start_date)}
                    onChange={(date) => {
                      if (date) {
                        const formatted = dateToApiString(date);
                        setEventForm({ ...eventForm, start_date: formatted, end_date: formatted });
                      } else {
                        setEventForm({ ...eventForm, start_date: "", end_date: "" });
                      }
                    }}
                    dateFormat="dd.MM.yyyy"
                    placeholderText="ДД.ММ.ГГГГ"
                    className="custom-datepicker"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    onKeyDown={(e) => handleDateKeyDown(e, (val) => {
                      if (val && val.length === 10) {
                        const dateObj = displayStringToDate(val);
                        if (dateObj) {
                          setEventForm({ ...eventForm, start_date: dateToApiString(dateObj), end_date: dateToApiString(dateObj) });
                        }
                      }
                    })}
                  />
                </div>
                {eventForm.start_date && (
                  <button
                    type="button"
                    onClick={() => setEventForm({ ...eventForm, start_date: "", end_date: "" })}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                    title="Очистить дату"
                  >
                    <X size={14} /> Очистить
                  </button>
                )}
              </div>
              {!eventForm.is_all_day && (
                <input 
                  type="time" 
                  value={eventForm.start_time} 
                  onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })}
                  onBlur={() => setParticipantSearch("")}
                  style={{ flex: 1, ...styles.input }}
                />
              )}
            </div>
            
            {!eventForm.is_all_day && (
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <DatePicker                      selected={displayStringToDate(eventForm.end_date)}
                      onChange={(date) => {
                        if (date) {
                          setEventForm({ ...eventForm, end_date: dateToApiString(date) });
                        } else {
                          setEventForm({ ...eventForm, end_date: "" });
                        }
                      }}
                      dateFormat="dd.MM.yyyy"
                      placeholderText="ДД.ММ.ГГГГ"
                      className="custom-datepicker"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      onKeyDown={(e) => handleDateKeyDown(e, (val) => {
                        if (val && val.length === 10) {
                          const dateObj = displayStringToDate(val);
                          if (dateObj) {
                            setEventForm({ ...eventForm, end_date: dateToApiString(dateObj) });
                          }
                        }
                      })}
                    />
                  </div>
                  {eventForm.end_date && eventForm.end_date !== eventForm.start_date && (
                    <button
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, end_date: "" })}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        padding: "10px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                      title="Очистить дату"
                    >
                      <X size={14} /> Очистить
                    </button>
                  )}
                </div>
                <input 
                  type="time" 
                  value={eventForm.end_time} 
                  onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })}
                  onBlur={() => setParticipantSearch("")}
                  style={{ flex: 1, ...styles.input }}
                />
              </div>
            )}
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={eventForm.is_all_day} onChange={e => setEventForm({ ...eventForm, is_all_day: e.target.checked })} />
                <span>Весь день</span>
              </label>
            </div>
            
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <select 
                value={eventForm.event_type} 
                onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })} 
                style={{ flex: 1, ...styles.select }}
              >
                <option value="meeting">👥 Совещание</option>
                <option value="vks">📹 ВКС</option>
                <option value="deadline">📌 Задача</option>
              </select>
              
              <select 
                value={eventForm.remind_before} 
                onChange={e => setEventForm({ ...eventForm, remind_before: parseInt(e.target.value) })} 
                style={{ flex: 1, ...styles.select }}
              >
                <option value="0">Не напоминать</option>
                <option value="15">За 15 минут</option>
                <option value="30">За 30 минут</option>
                <option value="60">За 1 час</option>
                <option value="1440">За 1 день</option>
              </select>
            </div>
            
            <select 
              value={eventForm.repeat} 
              onChange={e => setEventForm({ ...eventForm, repeat: e.target.value })} 
              style={{ width: "100%", ...styles.select }}
            >
              <option value="none">Не повторять</option>
              <option value="daily">Ежедневно</option>
              <option value="weekly">Еженедельно</option>
              <option value="monthly">Ежемесячно</option>
            </select>
            
            <input 
              type="text" 
              placeholder="Место" 
              value={eventForm.location} 
              onChange={e => setEventForm({ ...eventForm, location: e.target.value })} 
              style={styles.input}
            />
            
            <textarea 
              placeholder="Описание" 
              value={eventForm.description} 
              onChange={e => setEventForm({ ...eventForm, description: e.target.value })} 
              rows={3} 
              style={styles.input}
            />
            
            <div style={{ marginBottom: 16 }} onClick={e => e.stopPropagation()}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>👥 Участники</label>
              
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => { setParticipantSearchType("users"); setParticipantSearch(""); setParticipantResults([]); }}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: "none",
                    background: participantSearchType === "users" ? "#3b82f6" : "#e2e8f0",
                    color: participantSearchType === "users" ? "white" : "#64748b",
                    cursor: "pointer",
                    fontSize: 13
                  }}
                >
                  👤 Пользователи
                </button>
                <button
                  type="button"
                  onClick={() => { setParticipantSearchType("groups"); setParticipantSearch(""); setParticipantResults([]); }}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: "none",
                    background: participantSearchType === "groups" ? "#3b82f6" : "#e2e8f0",
                    color: participantSearchType === "groups" ? "white" : "#64748b",
                    cursor: "pointer",
                    fontSize: 13
                  }}
                >
                  👥 Группы
                </button>
              </div>
              
              <div style={styles.participantsList}>
                {eventForm.participants && eventForm.participants.length > 0 ? (
                  eventForm.participants.map((p, idx) => {
                    const uniqueKey = `${p.type}_${p.id}_${idx}`;
                    let displayName = p.name;
                    if (p.type === "user" && adUsersMap[p.id]) {
                      displayName = adUsersMap[p.id];
                    } else if (p.type === "group") {
                      const group = adGroups.find(g => String(g.id) === String(p.id));
                      if (group) displayName = group.display_name || group.group_name;
                    } else if (p.type === "calendar_group") {
                      const group = calendarGroups.find(g => String(g.id) === p.id);
                      if (group) displayName = `👥 ${group.name}`;
                    }
                    return (
                      <div key={uniqueKey} style={styles.participantBadge}>
                        {p.type === "group" ? "👥" : "👤"} {displayName}
                        <button 
                          onClick={() => removeParticipant(p.id, p.type)} 
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", marginLeft: 6 }}
                          title="Удалить участника"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: "#64748b", fontSize: 13, marginBottom: 8 }}>Нет добавленных участников</div>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input 
                  type="text" 
                  placeholder="🔍 Поиск..." 
                  value={participantSearch}
                  onChange={e => setParticipantSearch(e.target.value)}
                  style={styles.input}
                />
                {participantResults.length > 0 && (
                  <div style={styles.searchResultsBox}>
                    {participantResults.map((r, idx) => (
                      <div key={idx} style={styles.searchResultItem} onClick={() => addParticipant(r.type, r.id, r.name)}>
                        <span>{r.type === "group" ? "👥" : "👤"} {r.name}</span>
                        <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Добавить</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => { setIsEventModalOpen(false); resetEventForm(); }} style={{ padding: "10px 24px", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, background: "transparent", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>Отмена</button>
              <button onClick={saveEvent} style={{ background: "#3b82f6", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}><Save size={14} /> Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Просмотр события календаря */}
      {isEventViewModalOpen && viewingEvent && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) setIsEventViewModalOpen(false); }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>
                <span style={{ fontSize: 24, marginRight: 8 }}>{getEventIcon(viewingEvent.event_type)}</span>
                {viewingEvent.title}
              </h3>
              <button onClick={() => setIsEventViewModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: 8, background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>📅</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>Дата и время</div>
                  <div style={{ fontSize: 13, color: darkMode ? "#94a3b8" : "#64748b" }}>
                    {viewingEvent.event_date} {!viewingEvent.is_all_day && viewingEvent.event_time}
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: 8, background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>🏷️</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>Тип</div>
                  <div style={{ fontSize: 13, color: darkMode ? "#94a3b8" : "#64748b" }}>{getEventTypeLabel(viewingEvent.event_type)}</div>
                </div>
              </div>
              
              {viewingEvent.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: 8, background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: 8 }}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>Место</div>
                    <div style={{ fontSize: 13, color: darkMode ? "#94a3b8" : "#64748b" }}>{viewingEvent.location}</div>
                  </div>
                </div>
              )}
              
              {viewingEvent.description && (
                <div style={{ marginBottom: 12, padding: 8, background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: 8 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>📝 Описание</div>
                  <div style={{ fontSize: 13, color: darkMode ? "#94a3b8" : "#64748b" }}>{viewingEvent.description}</div>
                </div>
              )}
              
              <div style={{ marginBottom: 12, padding: 8, background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <UsersIcon size={16} /> <span style={{ fontWeight: 500, fontSize: 14 }}>Список участников</span>
                </div>
                {viewingEvent.participants && viewingEvent.participants.length > 0 ? (
                  <div style={styles.participantsList}>
                    {viewingEvent.participants.map((p, idx) => {
                      let displayName = "";
                      if (p.name) {
                        displayName = p.name;
                      } else if (p.participant_id) {
                        displayName = adUsersMap[p.participant_id] || p.participant_id;
                      } else if (p.id) {
                        displayName = adUsersMap[p.id] || p.id;
                      } else {
                        displayName = p.participant_id || p.id || "?";
                      }
                      return (
                        <div key={idx} style={styles.participantBadge}>
                          {p.participant_type === "group" ? "👥" : "👤"} {displayName}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: darkMode ? "#94a3b8" : "#64748b" }}>Нет участников</div>
                )}
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", borderTop: darkMode ? "2px solid #334155" : "2px solid #cbd5e1", paddingTop: 16 }}>
              {canEditEvent(viewingEvent) && (
                <>
                  <button onClick={() => { setIsEventViewModalOpen(false); editEvent(viewingEvent); }} style={{ padding: "10px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>✏️ Редактировать</button>
                  <button onClick={() => deleteEvent(viewingEvent.id)} style={{ padding: "10px 24px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>🗑️ Удалить</button>
                </>
              )}
              <button onClick={() => setIsEventViewModalOpen(false)} style={{ padding: "10px 24px", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, background: "transparent", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Сетевые ресурсы */}
      {isNetworkModalOpen && selectedCategory && (
        <div style={styles.modalOverlay} onMouseDown={(e) => setCloseTarget(e.target)} onMouseUp={(e) => { if (closeTarget === e.currentTarget && e.target === e.currentTarget) setIsNetworkModalOpen(false); }}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>
                <span style={{ fontSize: 24, marginRight: 8 }}>{selectedCategory.icon}</span>
                {selectedCategory.name}
              </h3>
              <button onClick={() => setIsNetworkModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            
            {selectedCategory.resources.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                <FolderOpen size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p>Нет ресурсов в этой категории</p>
              </div>
            ) : (
              selectedCategory.resources.map((item, idx) => (
                <div key={idx} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: 12, 
                  marginBottom: 8, 
                  background: darkMode ? "#0f172a" : "#f1f5f9", 
                  borderRadius: 10,
                  flexWrap: "wrap",
                  gap: 10
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 20 }}>{item.resource_type === "folder" ? "📁" : "📄"}</span>
                      <strong style={{ fontSize: 14 }}>{item.resource_name}</strong>
                      {copiedPath === item.resource_name && (
                        <span style={{ fontSize: 11, color: "#10b981", background: "#10b98120", padding: "2px 8px", borderRadius: 20 }}>
                          <Check size={12} style={{ display: "inline", marginRight: 2 }} /> Скопировано!
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: "#64748b", 
                      marginTop: 4,
                      fontFamily: "monospace",
                      wordBreak: "break-all"
                    }}>
                      {item.resource_path}
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(item.resource_path, item.resource_name)}
                    style={{ 
                      background: "#3b82f6", 
                      color: "white", 
                      border: "none", 
                      padding: "8px 16px", 
                      borderRadius: 8, 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
                  >
                    <Copy size={14} />
                    Копировать
                  </button>
                </div>
              ))
            )}
            
            <div style={{ 
              marginTop: 20, 
              padding: 12, 
              background: darkMode ? "#0f172a" : "#e0f2fe", 
              borderRadius: 10, 
              fontSize: 13,
              border: darkMode ? "2px solid #334155" : "2px solid #bae6fd"
            }}>
              💡 <strong>Как использовать:</strong> Нажмите "Копировать", затем в Проводнике Windows (Win+E) 
              вставьте путь (Ctrl+V) в адресную строку и нажмите Enter
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;