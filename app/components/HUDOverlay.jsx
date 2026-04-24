'use client';

import { useState, useRef, useEffect } from 'react';
import VisionFeed from './VisionFeed';

const STATE_LABELS = {
  idle: 'NOMINAL',
  processing: 'PROCESSING',
  listening: 'SCANNING',
  split: 'MULTI-AGENT',
  sleeping: 'DEEP SLEEP',
};

const LAYER_STATUS = {
  idle: { perception: 'ACTIVE', cognition: 'STANDBY', action: 'READY', memory: 'SYNCED' },
  processing: { perception: 'ACTIVE', cognition: 'ACTIVE', action: 'EXECUTING', memory: 'WRITING' },
  listening: { perception: 'SCANNING', cognition: 'ACTIVE', action: 'READY', memory: 'SYNCED' },
  split: { perception: 'ACTIVE', cognition: 'FORKED ×3', action: 'PARALLEL', memory: 'WRITING' },
  sleeping: { perception: 'DORMANT', cognition: 'DORMANT', action: 'DORMANT', memory: 'SAVED' },
};

function MetadataAuditor() {
  return (
    <div style={{ padding: '0 12px 16px' }}>
      <div className="meter-header" style={{ marginBottom: '8px' }}><span>VAULT METADATA</span></div>
      <div className="status-row" style={{ marginBottom: '4px' }}>
        <span className="status-label" style={{ fontSize: '8px' }}>ALGORITHM</span>
        <span className="status-value" style={{ fontSize: '8px' }}>AES-256-GCM</span>
      </div>
      <div className="status-row">
        <span className="status-label" style={{ fontSize: '8px' }}>SOVEREIGN KEY</span>
        <span className="status-value" style={{ fontSize: '8px' }}>ACTIVE</span>
      </div>
    </div>
  );
}

function DigitalSeal({ visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)',
      width: '60px', height: '60px', border: '1px solid var(--accent-cyan)',
      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'pulse-glow 1s ease infinite', zIndex: 100
    }}>
      <span style={{ fontSize: '8px', color: 'var(--accent-cyan)', letterSpacing: '1px' }}>SEALED</span>
    </div>
  );
}

function RemoteDevices() {
  const devices = [
    { name: 'Server Cluster A', ping: '14ms', status: 'ONLINE' },
    { name: 'IoT Bridge 01', ping: '240ms', status: 'LAG' },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <div className="meter-header" style={{ marginBottom: '8px' }}><span>REMOTE INFRASTRUCTURE</span></div>
      {devices.map((d, i) => (
        <div key={i} className="status-row" style={{ marginBottom: '6px' }}>
          <span className="status-label" style={{ fontSize: '9px' }}>{d.name}</span>
          <span className={`status-value ${d.status === 'ONLINE' ? 'active' : 'standby'}`} style={{ fontSize: '8px' }}>
            {d.ping}
          </span>
        </div>
      ))}
    </div>
  );
}

function TaskQueue() {
  const [tasks, setTasks] = useState([
    { name: 'Sync Cloud Vault', status: 'COMPLETE', time: '12s ago' },
    { name: 'Hardhat Audit', status: 'RUNNING', time: 'LIVE' },
    { name: 'Backup Metadata', status: 'PENDING', time: 'T-45s' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.name === 'Backup Metadata' && t.status === 'PENDING') return { ...t, status: 'RUNNING' };
        if (t.name === 'Backup Metadata' && t.status === 'RUNNING') return { ...t, status: 'COMPLETE' };
        if (t.name === 'Hardhat Audit' && Math.random() > 0.8) return { ...t, status: 'COMPLETE' };
        return t;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '0 12px 16px' }}>
      <div className="meter-header" style={{ marginBottom: '8px' }}><span>AUTONOMOUS QUEUE</span></div>
      {tasks.map((t, i) => (
        <div key={i} className="status-row" style={{ marginBottom: '6px' }}>
          <span className="status-label" style={{ fontSize: '9px' }}>{t.name}</span>
          <span className={`status-value ${t.status === 'RUNNING' ? 'active' : t.status === 'COMPLETE' ? '' : 'standby'}`} style={{ fontSize: '8px' }}>
            {t.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function GasMonitor() {
  const [gas, setGas] = useState(24);
  useEffect(() => {
    const iv = setInterval(() => {
      setGas(prev => Math.max(10, Math.min(80, prev + (Math.random() - 0.5) * 5)));
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>
        <span>ETH GAS</span>
        <span style={{ color: gas > 50 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{gas.toFixed(1)} GWEI</span>
      </div>
      <div className="meter-bar" style={{ height: '2px' }}>
        <div className="meter-fill" style={{ 
          width: `${(gas / 80) * 100}%`, 
          background: gas > 50 ? 'var(--accent-red)' : 'var(--accent-cyan)',
          transition: 'width 1s ease'
        }} />
      </div>
    </div>
  );
}

function VaultChart() {
  const [data, setData] = useState([40, 60, 30, 80, 50, 90, 70]);
  useEffect(() => {
    const iv = setInterval(() => {
      setData(prev => [...prev.slice(1), Math.floor(Math.random() * 70) + 30]);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px', padding: '0 4px' }}>
      {data.map((h, i) => (
        <div key={i} style={{ 
          flex: 1, height: `${h}%`, background: 'var(--accent-blue)', 
          opacity: 0.3 + (h / 100) * 0.7, borderRadius: '1px',
          transition: 'height 1s ease'
        }} />
      ))}
    </div>
  );
}

function Waveform({ agentState, isSpeaking }) {
  const canvasRef = useRef();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isSpeaking ? '#ffd700' : '#00d4ff';
      
      const freq = isSpeaking ? 0.2 : agentState === 'processing' ? 0.1 : 0.04;
      const amp = isSpeaking ? 15 : agentState === 'processing' ? 10 : 5;

      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin(x * freq + offset) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      offset += isSpeaking ? 0.3 : 0.1;
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [agentState, isSpeaking]);

  return <canvas ref={canvasRef} width="200" height="40" style={{ opacity: 0.6 }} />;
}

function StatusDot({ status }) {
  const colorMap = {
    ACTIVE: 'active', SCANNING: 'active', EXECUTING: 'active', WRITING: 'active',
    'FORKED ×3': 'active', PARALLEL: 'active',
    STANDBY: 'standby', READY: 'standby', SYNCED: 'standby', SAVED: 'standby',
    DORMANT: 'error',
  };
  return <span className={`status-dot ${colorMap[status] || 'standby'}`} />;
}

function BinaryStream() {
  const [data, setData] = useState('');
  useEffect(() => {
    const iv = setInterval(() => {
      setData(prev => (prev + Math.round(Math.random()).toString()).slice(-100));
    }, 100);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ 
      position: 'absolute', inset: 0, opacity: 0.03, 
      fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', 
      overflow: 'hidden', pointerEvents: 'none', wordBreak: 'break-all' 
    }}>
      {data.repeat(20)}
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState('');
  const [uptime, setUptime] = useState('00:00:00');
  const start = useRef(Date.now());

  useEffect(() => {
    const iv = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
      const diff = Math.floor((Date.now() - start.current) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display: 'flex', gap: '40px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-muted)' }}>
      <div><span style={{ opacity: 0.5 }}>TIME:</span> <span style={{ color: 'var(--accent-cyan)' }}>{time}</span></div>
      <div><span style={{ opacity: 0.5 }}>UPTIME:</span> <span style={{ color: 'var(--accent-blue)' }}>{uptime}</span></div>
    </div>
  );
}

export default function HUDOverlay({ agentState, logs, response, isListening, isSpeaking, liveTranscript, godMode, isAlert, onCommand, onToggleVoice, onToggleVault, onToggleHelp }) {
  const [input, setInput] = useState('');
  const [metrics] = useState({ cpu: 34, mem: 52, net: 87 });
  const [showSeal, setShowSeal] = useState(false);
  const inputRef = useRef(null);
  const status = LAYER_STATUS[agentState] || LAYER_STATUS.idle;

  useEffect(() => {
    if (response?.includes('Committed to Vault')) {
      setShowSeal(true);
      setTimeout(() => setShowSeal(false), 3000);
    }
  }, [response]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input);
      setInput('');
    }
  };

  const [liveMetrics, setLiveMetrics] = useState(metrics);
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveMetrics({
        cpu: Math.min(100, Math.max(10, metrics.cpu + (Math.random() - 0.5) * 10)),
        mem: Math.min(100, Math.max(10, metrics.mem + (Math.random() - 0.5) * 5)),
        net: Math.min(100, Math.max(10, metrics.net + (Math.random() - 0.5) * 8))
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [metrics]);

  const latency = agentState === 'processing' ? '127' : agentState === 'sleeping' ? '—' : '47';

  const exportLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blue-wing-mission-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="hud-overlay">
      {/* ... Top Bar ... */}
      <div className="top-bar">
        <div className="top-bar-inner">
          <div className="logo-title">BLUE WING</div>
          <div className="logo-subtitle">sovereign agentic entity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
            <Clock />
            <button onClick={onToggleVault} className="cmd-btn" style={{ fontSize: '8px', padding: '4px 10px' }}>ACCESS VAULT</button>
            <button onClick={onToggleHelp} className="cmd-btn" style={{ fontSize: '8px', padding: '4px 10px', background: 'rgba(0, 212, 255, 0.1)' }}>PROTOCOL [HELP]</button>
            <button 
                onClick={() => onCommand('test audio')} 
                className="cmd-btn" 
                style={{ fontSize: '8px', padding: '4px 10px', background: 'rgba(255, 215, 0, 0.05)', color: '#ffd700' }}
            >
                AUDIO TEST
            </button>
          </div>
        </div>
      </div>

      {/* ... Left Sidebar ... */}
      <div className="left-sidebar glass-panel">
        <BinaryStream />
        <div className="scan-line" />
        <div className="panel-header">
          <span className="panel-title">Mission Log</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={exportLogs} className="cmd-btn" style={{ padding: '2px 6px', fontSize: '8px' }}>EXPORT</button>
            <span className="panel-badge">{logs.length} entries</span>
          </div>
        </div>
        <div className="log-list">
          {logs.map((log, i) => (
            <div key={`${log.id}-${i}`} className={`log-entry type-${log.type}`}>
              <span className="log-hash">{log.id}</span>
              <div className="log-content">
                <span className="log-message">{log.message}</span>
                <span className="log-time">{log.time}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="panel-divider" />
        <TaskQueue />
        <div className="panel-divider" />
        <MetadataAuditor />
      </div>

      {/* ... Center: Voice Transcript + Response Bubble ... */}
      <DigitalSeal visible={showSeal} />
      {isListening && liveTranscript && (
        <div className="response-box" style={{ alignItems: 'center', paddingBottom: '80px' }}>
          <div className="response-bubble" style={{ 
            borderColor: 'var(--accent-green)', 
            background: 'rgba(0, 230, 118, 0.05)',
            maxWidth: '400px'
          }}>
            <div className="response-label" style={{ color: 'var(--accent-green)' }}>🎙 HEARING</div>
            <div style={{ fontStyle: 'italic', opacity: 0.9 }}>{liveTranscript}</div>
          </div>
        </div>
      )}
      {response && (
        <div className="response-box">
          <div className="response-bubble">
            <div className="response-label">BLUE WING</div>
            {response}
          </div>
        </div>
      )}

      {/* ── Right Sidebar ── */}
      <div className="right-sidebar">
        <VisionFeed />

        {/* Multi-Agent Cluster Status */}
        {agentState === 'split' && (
          <div className="glass-panel" style={{ marginBottom: '12px', borderLeft: '2px solid var(--accent-purple)' }}>
            <div className="panel-header">
              <span className="panel-title" style={{ color: 'var(--accent-purple)' }}>Cluster [3]</span>
              <span className="panel-badge">SYNCED</span>
            </div>
            <div className="status-list" style={{ padding: '12px' }}>
              <div className="status-row">
                <span className="status-label">Worker A (Web3)</span>
                <span className="status-value">READY</span>
              </div>
              <div className="status-row">
                <span className="status-label">Worker B (Vault)</span>
                <span className="status-value">ACTIVE</span>
              </div>
              <div className="status-row">
                <span className="status-label">Worker C (Logic)</span>
                <span className="status-value">STANDBY</span>
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel">
          <div className="scan-line" />
          <div className="panel-header">
            <span className="panel-title">Automations</span>
          </div>
          <div className="status-list" style={{ padding: '8px 12px 16px' }}>
            <button onClick={() => onCommand('sync repository')} className="cmd-btn" style={{ width: '100%', marginBottom: '8px' }}>SYNC REPOSITORY</button>
            <button onClick={() => onCommand('backup vault')} className="cmd-btn" style={{ width: '100%', marginBottom: '8px' }}>BACKUP VAULT</button>
            <button onClick={() => onCommand('trigger deployment')} className="cmd-btn" style={{ width: '100%' }}>EXTERNAL DEPLOY</button>
          </div>
          <div className="panel-divider" />
          <div className="status-list" style={{ padding: '8px 12px 16px' }}>
            <RemoteDevices />
          </div>
        </div>

        <div className="glass-panel">
          <div className="scan-line" />
          <div className="panel-header">
            <span className="panel-title">Core State</span>
          </div>
          <div className="agent-state">
            <div className="state-label">CURRENT MODE</div>
            <div className={`state-value ${agentState}`}>
              {STATE_LABELS[agentState] || 'NOMINAL'}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: 1 }}>
          <div className="panel-header">
            <span className="panel-title">Systems</span>
            <span className="panel-badge">4 layers</span>
          </div>
          <div className="status-list">
            {Object.entries(status).map(([layer, val]) => (
              <div key={layer} className="status-row">
                <span className="status-label">
                  <StatusDot status={val} />
                  {layer.toUpperCase()}
                </span>
                <span className={`status-value ${val === 'DORMANT' ? 'offline' : val === 'STANDBY' || val === 'READY' || val === 'SYNCED' || val === 'SAVED' ? 'standby' : ''}`}>
                  {val}
                </span>
              </div>
            ))}
          </div>
          <div className="status-list" style={{ paddingTop: 8 }}>
            <GasMonitor />
          </div>
          <div className="panel-divider" />
          <div style={{ padding: '0 12px 12px' }}>
            <div className="meter-header" style={{ marginBottom: '8px' }}><span>VAULT ACTIVITY</span></div>
            <VaultChart />
          </div>
          <div className="panel-divider" />
          <div className="meter">
            <div className="meter-item">
              <div className="meter-header"><span>CPU</span><span>{Math.round(liveMetrics.cpu)}%</span></div>
              <div className="meter-bar"><div className="meter-fill" style={{ width: `${liveMetrics.cpu}%` }} /></div>
            </div>
            <div className="meter-item">
              <div className="meter-header"><span>MEMORY</span><span>{Math.round(liveMetrics.mem)}%</span></div>
              <div className="meter-bar"><div className="meter-fill" style={{ width: `${liveMetrics.mem}%` }} /></div>
            </div>
            <div className="meter-item">
              <div className="meter-header"><span>NETWORK</span><span>{Math.round(liveMetrics.net)}%</span></div>
              <div className="meter-bar"><div className="meter-fill" style={{ width: `${liveMetrics.net}%` }} /></div>
            </div>
          </div>
          <div className="panel-divider" />
          <div className="status-list" style={{ paddingTop: 4 }}>
            <div className="status-row">
              <span className="status-label">LATENCY</span>
              <span className="status-value">{latency}ms</span>
            </div>
            <div className="status-row">
              <span className="status-label">UPTIME</span>
              <span className="status-value">2h 47m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <form onSubmit={handleSubmit} className="command-bar glass-panel">
          <span className="cmd-icon">❯</span>
          <input
            ref={inputRef}
            className="cmd-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command Blue Wing..."
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit" className="cmd-btn">Execute</button>
          <div style={{ margin: '0 10px', display: 'flex', alignItems: 'center' }}>
            <Waveform agentState={agentState} isSpeaking={isSpeaking} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
            <button
              type="button"
              className="mic-btn"
              onClick={() => document.getElementById('file-upload').click()}
              title="Attach File for Analysis"
              style={{ padding: '0 8px' }}
            >
              📎
            </button>
            <input 
              id="file-upload" 
              type="file" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && onCommand) {
                  onCommand({ type: 'file', file });
                }
                e.target.value = ''; // Reset for next selection
              }}
            />
            <button
              type="button"
              className={`mic-btn ${isListening ? 'active' : ''}`}
              onClick={onToggleVoice}
              title={isListening ? 'Stop Listening' : 'Start Voice Control (Alt+M)'}
            >
              {isListening ? '🔴' : '🎙'}
            </button>
          </div>
          {isListening && (
            <span style={{ 
              fontSize: '8px', 
              letterSpacing: '2px', 
              color: 'var(--accent-green)', 
              animation: 'pulse-glow 1.5s ease infinite',
              marginLeft: '8px',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              LISTENING...
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
