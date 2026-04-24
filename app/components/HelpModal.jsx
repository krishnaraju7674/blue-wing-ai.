'use client';

export default function HelpModal({ onClose }) {
    const commands = [
        { cmd: '📎 Icon', desc: 'Attach Image/File for AI Analysis' },
        { cmd: '🌐 Web Search', desc: 'Ask live info (weather, news, etc.)' },
        { cmd: '💻 Code Execution', desc: 'Ask AI to run Python/JS locally' },
        { cmd: '🧠 Memory', desc: 'Saves mission data across sessions' },
        { cmd: 'Alt + B', desc: 'Focus Command Bar' },
        { cmd: 'Alt + M', desc: 'Toggle Microphone' },
        { cmd: 'Alt + S', desc: 'Split (Multi-Agent)' },
        { cmd: 'Alt + G', desc: 'God Mode Override' },
        { cmd: 'Diagnostics', desc: 'Full System Audit' },
        { cmd: 'Summarize', desc: 'Mission Briefing' },
        { cmd: 'Persona', desc: 'Scribe, Analyst, Oracle, Caveman' },
    ];

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(3, 6, 18, 0.9)',
            backdropFilter: 'blur(30px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
                <div className="panel-header" style={{ marginBottom: '20px' }}>
                    <span className="panel-title">Sovereign OS — Command Protocols</span>
                    <button onClick={onClose} className="cmd-btn" style={{ padding: '2px 8px' }}>CLOSE</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                    {commands.map((c, i) => (
                        <div key={i} className="status-row" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                            <span className="status-label" style={{ color: 'var(--accent-cyan)', fontSize: '11px' }}>{c.cmd}</span>
                            <span className="status-value" style={{ opacity: 0.8, fontSize: '11px' }}>{c.desc}</span>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(0, 212, 255, 0.05)', borderRadius: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>MISSION READY:</span> Blue Wing is now multimodal. Upload files, search the web, and run code directly from the command bar.
                </div>
            </div>
        </div>
    );
}
