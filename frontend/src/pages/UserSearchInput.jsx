import React, { useState, useEffect, useRef } from "react";

let requestCounter = 0;
let lastRequest = { query: "", time: 0 };

const UserSearchInput = ({ value, onChange, placeholder, getToken }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchUsers = async (query) => {
    if (!query || query.length < 2) return;
    
    // Защита от дублей
    const now = Date.now();
    if (lastRequest.query === query && now - lastRequest.time < 500) {
      console.log("🛑 Пропускаем дубликат запроса:", query);
      return;
    }
    
    lastRequest = { query, time: now };
    requestCounter++;
    const currentRequest = requestCounter;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/users/authorized?query=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      // Если за это время был новый запрос, игнорируем старый
      if (currentRequest !== requestCounter) {
        console.log("🛑 Игнорируем устаревший запрос");
        return;
      }
      
      const data = await res.json();
      if (res.ok && data.users) {
        setResults(data.users);
        setIsOpen(data.users.length > 0);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (newValue.length >= 2) {
      timeoutRef.current = setTimeout(() => {
        searchUsers(newValue);
      }, 400);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const selectUser = (user) => {
    const displayName = user.display_name || user.username;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setSearchTerm(displayName);
    onChange(displayName);
    setIsOpen(false);
    setResults([]);
    // Сбрасываем защиту от дублей
    lastRequest = { query: "", time: 0 };
  };

  const styles = {
    wrapper: { position: "relative", width: "100%" },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 12,
      boxSizing: "border-box",
      outline: "none"
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      maxHeight: 200,
      overflowY: "auto",
      zIndex: 100,
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
    },
    item: {
      padding: "10px 12px",
      cursor: "pointer",
      borderBottom: "1px solid #e2e8f0"
    },
    loading: { fontSize: 12, color: "#64748b", marginTop: -8, marginBottom: 8 }
  };

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        style={styles.input}
        autoComplete="off"
      />
      {isOpen && results.length > 0 && (
        <div style={styles.dropdown}>
          {results.map(user => (
            <div
              key={user.username}
              style={styles.item}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
              onClick={() => selectUser(user)}
            >
              <strong>{user.display_name || user.username}</strong>
              <div style={{ fontSize: 11, color: "#64748b" }}>{user.username}</div>
            </div>
          ))}
        </div>
      )}
      {loading && <div style={styles.loading}>Поиск...</div>}
    </div>
  );
};

export default UserSearchInput;
