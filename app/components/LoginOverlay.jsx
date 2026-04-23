'use client';

import { useState } from 'react';
import { account } from '../lib/appwrite';

export default function LoginOverlay({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await account.createEmailPasswordSession(email, password);
            onLogin();
        } catch (err) {
            alert('Access Denied: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(3, 6, 18, 0.9)',
            backdropFilter: 'blur(40px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="glass-panel" style={{ width: '400px', padding: '40px', textAlign: 'center' }}>
                <div className="logo-title" style={{ fontSize: '24px', marginBottom: '8px' }}>BLUE WING</div>
                <div className="logo-subtitle" style={{ marginBottom: '32px' }}>AUTHORITY VERIFICATION REQUIRED</div>
                
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input 
                        type="email" 
                        placeholder="Commander Email"
                        className="cmd-input"
                        style={{ borderBottom: '1px solid var(--glass-border)', padding: '12px' }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input 
                        type="password" 
                        placeholder="Security Key"
                        className="cmd-input"
                        style={{ borderBottom: '1px solid var(--glass-border)', padding: '12px' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="cmd-btn" style={{ height: '44px', marginTop: '12px' }}>
                        {loading ? 'VERIFYING...' : 'INITIALIZE CONNECTION'}
                    </button>
                    <button 
                        type="button" 
                        onClick={onLogin} 
                        className="cmd-btn" 
                        style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '8px', height: '32px' }}
                    >
                        BYPASS SECURITY [DEV]
                    </button>
                </form>

                <div style={{ marginTop: '24px', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px' }}>
                    SOVEREIGN AGENT PROTOCOL v1.0.4
                </div>
            </div>
        </div>
    );
}
