import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [config, setConfig] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const cfg = window.__DPSDESK_CONFIG__;
    if (cfg) {
      setConfig(cfg);
      // Test connection
      if (cfg.backendUrl) {
        fetch(`${cfg.backendUrl}/api/health`)
          .then(r => r.ok && setConnected(true))
          .catch(() => {});
      }
    }
  }, []);

  if (!config) {
    return (
      <div className={['settings-container', theme === 'dark' ? 'dark' : ''].join(' ')}>
        <div className="settings-loading">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className={['settings-container', theme === 'dark' ? 'dark' : ''].join(' ')}>
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Atrás</button>
        <h1>Configuración</h1>
        <button className="theme-btn" onClick={toggle}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Servidor</h2>
          <div className="setting-item">
            <label>Backend URL</label>
            <div className="value">{config.backendUrl || '(no configurado)'}</div>
          </div>
          <div className="setting-item">
            <label>WebSocket URL</label>
            <div className="value">{config.wsUrl || '(no configurado)'}</div>
          </div>
          <div className="setting-item">
            <label>Estado de conexión</label>
            <div className={`status-badge ${connected ? 'connected' : 'disconnected'}`}>
              ● {connected ? 'Conectado' : 'Desconectado'}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Este dispositivo</h2>
          <div className="setting-item">
            <label>ID del dispositivo</label>
            <div className="value monospace">{config.posId}</div>
          </div>
          {config.hostname && (
            <div className="setting-item">
              <label>Hostname</label>
              <div className="value">{config.hostname}</div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <p className="version">DPS Desk v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
