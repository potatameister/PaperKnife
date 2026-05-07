import React from 'react'
import ReactDOM from 'react-dom/client'
import {App as CapacitorApp} from "@capacitor/app"
import App from './App'
import './index.css'

CapacitorApp.addListener("backButton", ({canGoBack})=> canGoBack ? window.history.back() : CapacitorApp.exitApp())

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
