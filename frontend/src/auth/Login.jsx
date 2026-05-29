import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(username, password);
    
    if (!result.success) {
      setError('Неверное имя пользователя или пароль');
    }
    
    setLoading(false);
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#ffffff',
    },
    card: {
      background: '#ffffff',
      borderRadius: '24px',
      padding: '48px 40px',
      width: '100%',
      maxWidth: '420px',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
      textAlign: 'center',
      border: '1px solid #e2e8f0',
    },
    logo: {
      height: '64px',
      marginBottom: '20px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#1e293b',
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '32px',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      marginBottom: '16px',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '14px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    error: {
      color: '#ef4444',
      fontSize: '14px',
      textAlign: 'center',
      marginBottom: '16px',
      padding: '8px',
      background: '#fef2f2',
      borderRadius: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/logo.png" alt="Гипронииавиапром" style={styles.logo} />
        <h1 style={styles.title}>Добро пожаловать</h1>
        <p style={styles.subtitle}>Войдите в корпоративный портал</p>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            disabled={loading}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={loading}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <button 
            type="submit" 
            style={styles.button} 
            disabled={loading}
            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;