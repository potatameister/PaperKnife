import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Bug Sniffer: Show errors on Android screen
window.onerror = function(msg, _url, line, _col, error) {
  alert("ERROR: " + msg + "\nLine: " + line + "\n" + error);
  return false;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
