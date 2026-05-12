import React from 'react';
import { useAuth } from './auth/AuthContext';
import Login from './auth/Login';
import MainPage from './pages/MainPage';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка...</div>;
  }
  
  return isAuthenticated ? <MainPage /> : <Login />;
}

export default App;
