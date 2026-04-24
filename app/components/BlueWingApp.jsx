'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene3D from './Scene3D';
import HUDOverlay from './HUDOverlay';
import NotificationCenter from './NotificationCenter';
import LoginOverlay from './LoginOverlay';
import VaultBrowser from './VaultBrowser';
import DiagnosticsOverlay from './DiagnosticsOverlay';
import HelpModal from './HelpModal';
import { commitToVault, getRecentHashes } from '../lib/appwrite';
import { startVapiSession, stopVapiSession } from '../lib/vapi';

function generateHash() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let h = 'BW-';
  for (let i = 0; i < 4; i++) h += chars[Math.floor(Math.random() * chars.length)];
  return h;
}

const INITIAL_LOGS = [
  { id: 'BW-7F2A', type: 'system', message: 'Core initialized. All systems nominal.', time: '14:52:01' },
  { id: 'BW-3D8E', type: 'hash', message: 'State committed to Vault.', time: '14:51:58' },
  { id: 'BW-9C1B', type: 'system', message: 'Perception layer: ACTIVE', time: '14:51:55' },
  { id: 'BW-4A7F', type: 'system', message: 'Cognition engine: STANDBY', time: '14:51:52' },
  { id: 'BW-2E5D', type: 'system', message: 'Action layer: READY', time: '14:51:49' },
  { id: 'BW-8B3C', type: 'response', message: 'Welcome back, Commander.', time: '14:51:45' },
];

const COMMAND_RESPONSES = {
  status: { message: 'System nominal. All layers green.', type: 'response' },
  split: { message: 'Multi-agent processing engaged. 3 workers spawned.', type: 'response' },
  'deep sleep': { message: 'Environment state saved. Entering low-power mode.', type: 'system' },
  'eyes on': { message: 'Vision feed activated. Scanning workspace.', type: 'response' },
  'wake up': { message: 'Systems restored. Full power.', type: 'response' },
};

export default function BlueWingApp() {
  const [agentState, setAgentState] = useState('idle');
  const [godMode, setGodMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAlert, setIsAlert] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [persona, setPersona] = useState('caveman');
  const [language, setLanguage] = useState('en-US');
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [response, setResponse] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef(null);
  const notifyRef = useRef(null);

  const now = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // System Boot Sequence — Local auth, no cloud dependency
  useEffect(() => {
    if (!isAuthenticated) return;
    const boot = async () => {
      setAgentState('processing');
      const bootMsg = `Blue Wing Online. System Nominal. Mission readiness: 100%.`;
      setResponse(bootMsg);
      speak(bootMsg);
      setLogs(prev => [{ id: 'BW-BOOT', type: 'system', message: bootMsg, time: now() }, ...prev]);
      setAgentState('idle');
      notifyRef.current?.add('System Boot', 'Blue Wing is online.', 'info');
      setTimeout(() => setResponse(null), 5000);
    };
    boot();
  }, [isAuthenticated]);

  // Track user interaction for audio autoplay policy
  const hasInteractedRef = useRef(false);
  const pendingSpeechRef = useRef(null);

  useEffect(() => {
    const markInteracted = () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        // Speak any queued message from boot
        if (pendingSpeechRef.current) {
          speak(pendingSpeechRef.current);
          pendingSpeechRef.current = null;
        }
      }
    };
    window.addEventListener('click', markInteracted, { once: true });
    window.addEventListener('keydown', markInteracted, { once: true });
    return () => {
      window.removeEventListener('click', markInteracted);
      window.removeEventListener('keydown', markInteracted);
    };
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;

    // If user hasn't interacted yet, queue the speech for later
    if (!hasInteractedRef.current) {
      pendingSpeechRef.current = text;
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(text);
    // Persist reference to prevent garbage collection
    window._currentUtterance = utterance;

    utterance.lang = language;
    utterance.pitch = 0.85;
    utterance.rate = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      window._currentUtterance = null;
    };
    utterance.onerror = (e) => {
      // 'interrupted' and 'not-allowed' are expected browser behaviors, not real errors
      if (e.error !== 'interrupted' && e.error !== 'not-allowed') {
        console.warn('Audio Notice:', e.error || 'Unknown');
      }
      setIsSpeaking(false);
      window._currentUtterance = null;
    };
    
    const startSpeaking = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      
      const preferredVoice = voices.find(v => v.lang === language || v.lang.startsWith(language.split('-')[0])) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        // Silently fail — audio is non-critical
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      startSpeaking();
    } else {
      const checkVoices = setInterval(() => {
        if (window.speechSynthesis.getVoices().length > 0) {
          clearInterval(checkVoices);
          startSpeaking();
        }
      }, 200);
      setTimeout(() => clearInterval(checkVoices), 5000);
    }
  };

  const handleCommand = useCallback(async (cmd) => {
    if (!cmd) return;

    // ── File Analysis ──
    if (typeof cmd === 'object' && cmd.type === 'file') {
      const file = cmd.file;
      setAgentState('processing');
      setResponse(`Analyzing ${file.name}...`);
      speak(`Analyzing your file, Sir.`);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(',')[1];
        const mimeType = file.type;
        
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: `Please analyze this file: ${file.name}`, 
              persona,
              file: {
                data: base64Data,
                mimeType: mimeType
              }
            }),
          });
          const data = await res.json();
          setResponse(data.text);
          speak(data.text);
          setLogs(prev => [{ id: data.hash || generateHash(), type: 'response', message: data.text, time: now() }, ...prev]);
        } catch (err) {
          console.error("File processing failed:", err);
          setResponse("File analysis failed.");
          speak("Cognition layer failed to process the file.");
        }
        setAgentState('idle');
      };
      reader.onerror = () => {
        setResponse("Failed to read file.");
        setAgentState('idle');
      };
      reader.readAsDataURL(file);
      return;
    }

    const trimmed = cmd.trim().toLowerCase();
    if (trimmed.includes('god mode')) {
      const newGodMode = !godMode;
      setGodMode(newGodMode);
      const msg = newGodMode ? "GOD-MODE ACTIVATED. Authority override granted." : "GOD-MODE DEACTIVATED. Returning to standard protocol.";
      setLogs(prev => [{ id: 'BW-AUTH', type: 'system', message: msg, time: now() }, ...prev].slice(0, 30));
      setResponse(msg);
      speak(msg);
      notifyRef.current?.add('Authority Override', msg, 'info');
      return;
    }

    if (trimmed.includes('test audio')) {
      const msg = "Audio check. Sovereign system perception is functional.";
      setResponse(msg);
      speak(msg);
      return;
    }

    if (trimmed === 'help' || trimmed === 'protocol') {
      setShowHelp(true);
      return;
    }

    if (trimmed.includes('alert') || trimmed.includes('battle')) {
      const newAlert = !isAlert;
      setIsAlert(newAlert);
      const msg = newAlert ? "RED ALERT. Battle stations active. Threat detection online." : "Returning to condition green.";
      setLogs(prev => [{ id: 'BW-ALRT', type: 'system', message: msg, time: now() }, ...prev].slice(0, 30));
      setResponse(msg);
      speak(msg);
      notifyRef.current?.add('System Alert', msg, newAlert ? 'error' : 'info');
      return;
    }

    const languages = { english: 'en-US', spanish: 'es-ES', french: 'fr-FR', japanese: 'ja-JP' };
    const targetLangKey = Object.keys(languages).find(l => trimmed.includes(l));
    if (targetLangKey) {
      setLanguage(languages[targetLangKey]);
      const msg = `System language set to ${targetLangKey.toUpperCase()}. Protocol updated.`;
      setLogs(prev => [{ id: 'BW-LANG', type: 'system', message: msg, time: now() }, ...prev]);
      setResponse(msg);
      speak(msg);
      return;
    }

    const personas = ['caveman', 'scribe', 'analyst', 'oracle'];
    const targetPersona = personas.find(p => trimmed.includes(p));
    if (targetPersona) {
      setPersona(targetPersona);
      const msg = `Switching to ${targetPersona.toUpperCase()} profile. Cognition adjusted.`;
      setLogs(prev => [{ id: 'BW-PERS', type: 'system', message: msg, time: now() }, ...prev]);
      setResponse(msg);
      speak(msg);
      return;
    }

    if (trimmed.includes('summarize') || trimmed.includes('report')) {
      const recentLogs = logs.slice(0, 10).map(l => `[${l.type}] ${l.message}`).join('\n');
      const summaryPrompt = `Based on these logs, give a 1-sentence mission status report: \n${recentLogs}`;
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: summaryPrompt }),
      });
      const data = await res.json();
      
      setResponse(data.text);
      speak(data.text);
      setLogs(prev => [{ id: data.hash, type: 'response', message: `REPORT: ${data.text}`, time: now() }, ...prev]);
      return;
    }

    if (trimmed.includes('diagnostics') || trimmed.includes('system check')) {
      setShowDiagnostics(true);
      speak("Initializing full system diagnostics. Please standby.");
      return;
    }

    // ── Search Engine (YouTube, Chrome, Google) ──
    const searchMatch = trimmed.match(/^(?:search(?:\s+for)?|google|find)\s+(.+?)(?:\s+on\s+(youtube|google|chrome|wikipedia))?$/i);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      const platform = (searchMatch[2] || 'google').toLowerCase();
      setAgentState('processing');
      
      let url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      if (platform === 'youtube') url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      if (platform === 'wikipedia') url = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;

      const msg = `Searching for "${query}" on ${platform.toUpperCase()}`;
      setResponse(msg);
      speak(msg);
      setLogs(prev => [{ id: generateHash(), type: 'command', message: msg, time: now() }, ...prev].slice(0, 30));
      window.open(url, '_blank');
      setAgentState('idle');
      setTimeout(() => setResponse(null), 5000);
      return;
    }

    // ── Keyboard Simulation (Type/Press) ──
    const typeMatch = trimmed.match(/^(?:type|write|input)\s+(.+)$/);
    const pressMatch = trimmed.match(/^(?:press|hit)\s+(enter|tab|backspace|delete)$/);

    if (typeMatch || pressMatch) {
      setAgentState('processing');
      const isType = !!typeMatch;
      const payload = isType ? { action: 'type', text: typeMatch[1].trim() } : { action: 'press', key: pressMatch[1] };
      
      setLogs(prev => [{ id: generateHash(), type: 'command', message: isType ? `Typing: ${payload.text}` : `Pressing: ${payload.key}`, time: now() }, ...prev].slice(0, 30));

      try {
        await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setResponse(isType ? `Typed.` : `Key pressed.`);
      } catch (err) {
        setResponse("Keyboard protocol failed.");
      }
      setAgentState('idle');
      return;
    }

    // ── Direct Terminal / PC Access ──
    const terminalMatch = trimmed.match(/^(?:terminal|system|run\s+command)\s+(.+)$/);
    if (terminalMatch) {
      const command = terminalMatch[1].trim();
      setAgentState('processing');
      setLogs(prev => [{ id: generateHash(), type: 'terminal', message: `Executing: ${command}`, time: now() }, ...prev].slice(0, 30));

      try {
        const res = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'raw', command }),
        });
        const data = await res.json();
        
        const output = data.output || data.error || 'Done.';
        setResponse(`Command executed.`);
        speak("Command executed, Sir.");
        setLogs(prev => [{ id: data.hash || generateHash(), type: 'terminal', message: output, time: now() }, ...prev].slice(0, 30));
      } catch (err) {
        setResponse("Execution failed.");
      }
      setAgentState('idle');
      return;
    }

    // ── Application Launcher (Open & Close) ──
    const openMatch = trimmed.match(/^(?:open|launch|start|run)\s+(?:the\s+)?(.+)$/);
    const closeMatch = trimmed.match(/^(?:close|kill|stop|quit|exit|shut|end|terminate)\s+(?:the\s+)?(.+)$/);
    
    if (openMatch || closeMatch) {
      const isClose = !!closeMatch;
      const target = (isClose ? closeMatch[1] : openMatch[1]).trim();
      const action = isClose ? 'close' : 'open';
      
      setAgentState('processing');
      setLogs(prev => [{ id: generateHash(), type: 'command', message: `${isClose ? 'Closing' : 'Opening'}: ${target}`, time: now() }, ...prev].slice(0, 30));

      // ── Popup Blocker Bypass ──
      // We open a blank window immediately in the same event tick to avoid being blocked.
      let newWindow = null;
      if (!isClose && (openMatch || action === 'open')) {
        newWindow = window.open('about:blank', '_blank');
      }

      try {
        const res = await fetch('/api/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target, action }),
        });
        const data = await res.json();

        if (data.type === 'web' && data.url && !isClose && newWindow) {
          newWindow.location.href = data.url;
        } else if (newWindow) {
          // If it wasn't a web app or it failed, close the blank window
          newWindow.close();
        }

        setResponse(data.text);
        speak(data.text);
        setLogs(prev => [{ 
          id: data.hash || generateHash(), 
          type: data.success ? 'response' : 'error', 
          message: data.text, 
          time: now() 
        }, ...prev].slice(0, 30));
        notifyRef.current?.add(isClose ? 'App Closed' : 'App Launched', data.text, data.success ? 'info' : 'error');
      } catch (err) {
        console.error('Launch protocol failed:', err);
        const msg = `Launch protocol failed: ${err.message}`;
        setResponse(msg);
        speak("Communication link failed.");
        setLogs(prev => [{ id: generateHash(), type: 'error', message: msg, time: now() }, ...prev]);
      }

      setAgentState('idle');
      setTimeout(() => setResponse(null), 5000);
      return;
    }

    // ── List Available Apps ──
    if (trimmed.includes('list apps') || trimmed.includes('available apps') || trimmed.includes('what can you open')) {
      const msg = "Apps: Notepad, Calculator, Paint, VS Code, Chrome, Edge, Explorer, Terminal, Word, Excel, PowerPoint, Spotify, Discord, OBS, VLC, Steam, Photoshop, Blender. Web: Gmail, YouTube, GitHub, ChatGPT, Netflix, LinkedIn, Reddit, Figma, Canva. Say 'open' or 'close' + app name.";
      setResponse(msg);
      speak("I can open and close over 150 applications. Check the log for the full list.");
      setLogs(prev => [{ id: generateHash(), type: 'response', message: msg, time: now() }, ...prev].slice(0, 30));
      setTimeout(() => setResponse(null), 10000);
      return;
    }

    const hash = generateHash();
    setLogs(prev => [{ id: hash, type: 'command', message: cmd, time: now() }, ...prev].slice(0, 30));
    setAgentState('processing');
    setResponse(null);

    // Cloud Workflow Automation (n8n Bridge)
    const workflowCmds = ['sync', 'backup', 'deploy'];
    const isWorkflow = workflowCmds.some(c => trimmed.includes(c));

    if (isWorkflow) {
      const action = workflowCmds.find(c => trimmed.includes(c));
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload: { timestamp: now(), cmd: trimmed } }),
      });
      const data = await res.json();
      
      const msg = data.status === 'Simulation Mode' ? `Workflow SIMULATED: ${action}` : `External ${action} TRIGGERED. Hash: ${data.hash}`;
      setLogs(prev => [{ id: data.hash || generateHash(), type: 'system', message: msg, time: now() }, ...prev]);
      setResponse(msg);
      speak(msg);
      notifyRef.current?.add('Automation Bridge', msg, 'info');
      return;
    }

    try {
      // Local Execution Commands
      const localCmds = ['compile', 'audit', 'test'];
      const isLocal = localCmds.some(c => trimmed.includes(c));

      if (isLocal) {
        const action = localCmds.find(c => trimmed.includes(c));
        const res = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        
        setLogs(prev => [
          { id: data.hash, type: 'terminal', message: `> ${data.command}\n${(data.output || '').substring(0, 200)}${data.output?.length > 200 ? '...' : ''}`, time: now() },
          ...prev
        ].slice(0, 30));
        
        setAgentState('idle');
        const respText = `${action.toUpperCase()} complete. Output logged.`;
        setResponse(respText);
        speak(respText);
        notifyRef.current?.add('Local Execution', `${action.toUpperCase()} task completed.`, 'info');
        return;
      }

      // Standard Cognition Commands
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: cmd, persona }),
      });
      const data = await res.json();

      let newState = 'idle';
      if (trimmed.includes('split')) newState = 'split';
      else if (trimmed.includes('deep sleep')) newState = 'sleeping';
      else if (trimmed.includes('eyes on')) newState = 'listening';
      else if (trimmed.includes('wake up')) newState = 'idle';

      const responseText = data.text || data.error || 'No response from cognition layer.';
      const responseHash = data.hash || generateHash();

      setLogs(prev => [{ id: responseHash, type: data.status === 'error' ? 'error' : 'response', message: responseText, time: now() }, ...prev].slice(0, 30));
      setAgentState(newState);
      setResponse(responseText);
      speak(responseText);

      // Commit to Vault (Sovereign Memory) — only for successful responses
      if (data.status !== 'error') {
        commitToVault(responseText, 'response').then(vaultHash => {
          if (vaultHash) {
            setLogs(prev => [{ id: vaultHash, type: 'hash', message: 'Committed to Vault.', time: now() }, ...prev].slice(0, 30));
          }
        });
      }

      if (newState !== 'sleeping' && newState !== 'split') {
        setTimeout(() => setResponse(null), 8000);
      }
    } catch (err) {
      const errorHash = generateHash();
      const errorMsg = "I'm ready. Blue Wing on duty.";
      setLogs(prev => [{ id: errorHash, type: 'error', message: errorMsg, time: now() }, ...prev].slice(0, 30));
      setAgentState('idle');
      setResponse(errorMsg);
      speak(errorMsg);
      setTimeout(() => setResponse(null), 5000);
    }
  }, [godMode, isAlert, logs, persona, language, now]);

  const toggleVoice = useCallback(() => {
    // If currently listening, stop
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // prevent auto-restart
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      setLiveTranscript('');
      setAgentState('idle');
      notifyRef.current?.add('Voice Control', 'Microphone deactivated.', 'info');
      return;
    }

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = 'Speech recognition not supported in this browser. Use Chrome or Edge.';
      setResponse(msg);
      speak(msg);
      notifyRef.current?.add('Voice Error', msg, 'error');
      return;
    }

    // Create a fresh recognition instance every time
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setAgentState('listening');
      setLiveTranscript('');
      notifyRef.current?.add('Voice Control', 'Microphone active. Speak your command.', 'info');
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          if (transcript) {
            setLiveTranscript('');
            // Log what was heard
            setLogs(prev => [{ 
              id: generateHash(), 
              type: 'command', 
              message: `🎙 "${transcript}"`, 
              time: now() 
            }, ...prev].slice(0, 30));
            
            // Process the command
            handleCommand(transcript);
          }
        } else {
          // Show interim (live) transcript
          interim += transcript;
        }
      }
      if (interim) {
        setLiveTranscript(interim);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // No speech detected — this is normal, just restart
        return;
      }
      if (event.error === 'aborted' || event.error === 'interrupted') {
        return; // User stopped it, no action needed
      }
      
      console.warn('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        const msg = 'Microphone access denied. Allow mic permission in browser settings.';
        setResponse(msg);
        speak(msg);
        notifyRef.current?.add('Voice Error', msg, 'error');
        setIsListening(false);
        setAgentState('idle');
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      // Auto-restart if still in listening mode (continuous listening)
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // If restart fails, just stop gracefully
          setIsListening(false);
          setAgentState('idle');
          recognitionRef.current = null;
        }
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setIsListening(false);
      notifyRef.current?.add('Voice Error', 'Could not start microphone.', 'error');
    }
  }, [isListening, handleCommand, agentState, language]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        if (e.key === 'b') {
          e.preventDefault();
          if (agentState === 'sleeping') handleCommand('wake up');
          document.querySelector('.cmd-input')?.focus();
        }
        if (e.key === 's') { e.preventDefault(); handleCommand('split'); }
        if (e.key === 'd') { e.preventDefault(); handleCommand('deep sleep'); }
        if (e.key === 'm') { e.preventDefault(); toggleVoice(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agentState, handleCommand, toggleVoice]);

  // Periodic ambient log entries
  useEffect(() => {
    const interval = setInterval(() => {
      if (agentState === 'sleeping') return;
      const ambientMessages = [
        'Heartbeat check: nominal.',
        'Vault sync: 0 pending.',
        'Network latency: 42ms.',
        'Memory cache refreshed.',
        'Perception sweep complete.',
      ];
      const msg = ambientMessages[Math.floor(Math.random() * ambientMessages.length)];
      setLogs(prev => [{ id: generateHash(), type: 'system', message: msg, time: now() }, ...prev].slice(0, 30));
    }, 15000);
    return () => clearInterval(interval);
  }, [agentState]);

  // Background Sentry Mode (Gas Monitoring - Local Simulation)
  useEffect(() => {
    if (agentState === 'sleeping') return;
    
    const sentryIv = setInterval(() => {
      // Simulate gas price monitoring without API calls
      const gasPrice = 12 + Math.random() * 10;
      if (gasPrice < 14.0) {
        const alertMsg = `Ready, Sir.`;
        setResponse(alertMsg);
        speak(alertMsg);
        setLogs(prev => [{ id: generateHash(), type: 'response', message: alertMsg, time: now() }, ...prev].slice(0, 30));
        setTimeout(() => setResponse(null), 8000);
      }
    }, 60000); // Check every 60s
    
    return () => clearInterval(sentryIv);
  }, [agentState]);

  // Appwrite Real-time Subscription
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) return;
    
    // This is a placeholder for real-time subscription
    // In production, we would use client.subscribe()
    const unsubscribe = () => {}; 
    
    return () => unsubscribe();
  }, []);

  const handleObserve = (item) => {
    setShowVault(false);
    setResponse(item.message);
    speak(`Observing state ${item.hash}.`);
    setLogs(prev => [{ id: item.hash, type: 'hash', message: `Restored state: ${item.message.substring(0,30)}...`, time: now() }, ...prev]);
    notifyRef.current?.add('State Restored', `Observation of ${item.hash} complete.`, 'info');
  };

  return (
    <div className={`app-container ${agentState === 'sleeping' ? 'sleeping' : ''} ${godMode ? 'god-mode' : ''} ${isAlert ? 'alert-mode' : ''}`}>
      {!isAuthenticated && <LoginOverlay onLogin={() => setIsAuthenticated(true)} />}
      {showVault && <VaultBrowser onClose={() => setShowVault(false)} onObserve={handleObserve} />}
      {showDiagnostics && <DiagnosticsOverlay onComplete={() => setShowDiagnostics(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      <div className="hud-grid" />
      <NotificationCenter ref={notifyRef} />
      <div className="canvas-wrapper">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          style={{ background: godMode ? '#0a0a05' : isAlert ? '#080000' : '#030612' }}
        >
          <Scene3D agentState={agentState} isSpeaking={isSpeaking} godMode={godMode} isAlert={isAlert} />
        </Canvas>
      </div>
      <HUDOverlay
        agentState={agentState}
        logs={logs}
        response={response}
        isListening={isListening}
        isSpeaking={isSpeaking}
        liveTranscript={liveTranscript}
        godMode={godMode}
        isAlert={isAlert}
        onCommand={handleCommand}
        onToggleVoice={toggleVoice}
        onToggleVault={() => setShowVault(true)}
        onToggleHelp={() => setShowHelp(true)}
      />
      <div className="hud-corner tl" />
      <div className="hud-corner tr" />
      <div className="hud-corner bl" />
      <div className="hud-corner br" />
    </div>
  );
}
