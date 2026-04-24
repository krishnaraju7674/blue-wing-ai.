'use client';

import { useState } from 'react';

export default function LoginOverlay({ onLogin }) {
    const [loading, setLoading] = useState(false);
    const [dots, setDots] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Boot animation effect
        let count = 0;
        const dotInterval = setInterval(() => {
            count++;
            setDots('.'.repeat(count % 4));
        }, 300);

        await new Promise(r => setTimeout(r, 1200));
        clearInterval(dotInterval);
        onLogin();
    };

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(3, 6, 18, 0.98)',
            backdropFilter: 'blur(40px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)'
        }}>
            <div className="glass-panel" style={{ width: '400px', padding: '48px 40px', textAlign: 'center' }}>

                {/* Logo */}
                <div style={{ marginBottom: '48px' }}>
                    <div className="logo-title" style={{ fontSize: '28px', marginBottom: '8px', letterSpacing: '10px' }}>
                        BLUE WING
                    </div>
                    <div className="logo-subtitle" style={{ letterSpacing: '6px' }}>SOVEREIGN AGENTIC ENTITY</div>
                    <div style={{
                        width: '60px', height: '1px',
                        background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)',
                        margin: '16px auto 0'
                    }} />
                </div>

                {/* Boot Button */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        className="cmd-btn"
                        style={{
                            padding: '18px',
                            fontSize: '12px',
                            letterSpacing: '4px',
                            background: loading ? 'rgba(0,150,255,0.1)' : 'transparent',
                            borderColor: loading ? 'var(--accent-cyan)' : undefined,
                            color: loading ? 'var(--accent-cyan)' : undefined,
                            transition: 'all 0.3s'
                        }}
                    >
                        {loading ? `INITIALIZING${dots}` : 'INITIALIZE CONNECTION'}
                    </button>
                </form>

                <div style={{ marginTop: '32px', fontFamily: 'JetBrains Mono', fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '2px' }}>
                    SOVEREIGN PROTOCOL v1.0.4 — LOCAL RUNTIME
                </div>
            </div>
        </div>
    );
}
