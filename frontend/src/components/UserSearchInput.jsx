import React, { useState, useEffect, useRef } from "react";

const UserSearchInput = ({ value, onChange, placeholder, getToken }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const timerRef = useRef(null);
  const isSelectingRef = useRef(false);

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
    if (!query || query.length < 2 || isSelectingRef.current) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/users/authorized?query=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.users || []);
        setIsOpen(data.users && data.users.length > 0);
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
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (newValue === "") {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    if (newValue.length >= 2) {
      timerRef.current = setTimeout(() => {
        if (!isSelectingRef.current) {
          searchUsers(newValue);
        }
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const selectUser = (user) => {
    const displayName = user.display_name || user.username;
    
    isSelectingRef.current = true;
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    setSearchTerm(displayName);
    onChange(displayName);
    setIsOpen(false);
    setResults([]);
    
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 200);
  };

  const handleFocus = () => {
    if (searchTerm.length >= 2 && results.length > 0 && !isSelectingRef.current) {
      setIsOpen(true);
    }
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
      outline: "none",
      transition: "border-color 0.2s"
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
        onFocus={handleFocus}
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
