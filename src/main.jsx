// src/main.jsx (أو index.jsx)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// ⬇️ تأكد أنك قمت باستيراد ملف CSS الذي يحتوي على توجيهات @tailwind
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);