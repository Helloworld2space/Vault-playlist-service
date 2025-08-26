import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const AppContent = styled(motion.div)`
  padding-top: 80px;
`;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 확인
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <AppContainer>
        <div className="loading">
          <div>로딩 중...</div>
        </div>
      </AppContainer>
    );
  }

  return (
    <Router>
      <AppContainer>
        {user && <Navbar user={user} onLogout={logout} />}
        <AppContent
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login onLogin={login} />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/dashboard" /> : <Register onRegister={login} />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={user ? "/dashboard" : "/login"} />} 
            />
          </Routes>
        </AppContent>
      </AppContainer>
    </Router>
  );
}

export default App;


