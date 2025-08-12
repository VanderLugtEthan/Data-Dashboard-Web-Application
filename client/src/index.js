/**
 * The main area where the react.js frontend runs. This script generates a root page, and collect routes from app.js and the .jsx files
 * 
 * @author Ethan VanderLugt
 * @rev 2025-08-05
 */

// Class imports are here, mainly from the root pages, and routes provided by app.js. Some dev tools are also provided
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Root page generated here
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();