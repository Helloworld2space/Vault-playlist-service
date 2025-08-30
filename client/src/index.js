import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// Vercel 환경에서 API 기본 URL 설정
if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = window.location.origin;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


