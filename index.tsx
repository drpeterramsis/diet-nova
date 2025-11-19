import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css'; // Tailwind directives assumed here if using standard setup, but we use CDN in index.html for this exercise

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
