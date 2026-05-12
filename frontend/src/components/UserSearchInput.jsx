import React, { useState, useEffect, useRef } from "react";

const UserSearchInput = ({ value, onChange, placeholder, getToken }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchUsers(searchTerm);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const searchUsers = async (query) => {
    setLoading(true);
    try {
      const res = await fetch(`http://192.168.7.103:8000/api/admin/ad-users?query=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.users || []);
        setIsOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const selectUser = (user) => {
    setSearchTerm(user.display_name || user.username);
    onChange(user.display_name || user.username);
    setIsOpen(false);
    setResults([]);
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
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.input}
        onFocus={() => searchTerm.length >= 2 && searchUsers(searchTerm)}
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
