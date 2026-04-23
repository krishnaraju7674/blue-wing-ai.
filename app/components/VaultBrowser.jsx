'use client';

import { useState, useEffect } from 'react';
import { getRecentHashes } from '../lib/appwrite';

export default function VaultBrowser({ onClose, onObserve }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const data = await getRecentHashes(20);
            setHistory(data);
            setLoading(false);
        };
        fetchHistory();
    }, []);

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 500,
            background: 'rgba(3, 6, 18, 0.8)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
        }}>
            <div className="glass-panel" style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="panel-header">
                    <span className="panel-title">Vault Browser [History]</span>
                    <button onClick={onClose} className="cmd-btn" style={{ padding: '2px 8px' }}>CLOSE</button>
                </div>
                
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>SCANNING VAULT...</div>
                    ) : history.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>NO COMMITS DETECTED.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {history.map(item => (
                                <div key={item.$id} className="log-entry" style={{ cursor: 'pointer' }} onClick={() => onObserve(item)}>
                                    <span className="log-hash">{item.hash}</span>
                                    <div className="log-content">
                                        <span className="log-message" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.message}
                                        </span>
                                        <span className="log-time">{new Date(item.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="panel-badge" style={{ fontSize: '8px' }}>OBSERVE</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div style={{ padding: '16px', fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
                    TOTAL SOVEREIGN COMMITS: {history.length}
                </div>
            </div>
        </div>
    );
}
