'use client';

import { useRef, useEffect, useState } from 'react';

export default function VisionFeed({ onAnalyze, isSeeThrough, autoScan = false }) {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const lastAutoScanRef = useRef(0);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setActive(true);
      }
    } catch (err) {
      console.error("Camera access denied.", err);
    }
  };

  const captureFrame = (isAuto = false) => {
    if (!videoRef.current || !onAnalyze) return;
    if (isAuto && Date.now() - lastAutoScanRef.current < 60000) return; // Limit auto-scans to once per minute
    
    setScanning(true);
    if (isAuto) lastAutoScanRef.current = Date.now();
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onAnalyze({ type: 'file', file });
      setTimeout(() => setScanning(false), 2000);
    }, 'image/jpeg', 0.8);
  };

  const [coords, setCoords] = useState({ x: 42.1234, y: -71.5678 });

  useEffect(() => {
    if (!active) return;

    // Auto-scan logic
    let scanIv;
    if (autoScan) {
      scanIv = setInterval(() => {
        captureFrame(true);
      }, 30000); // Check every 30s
    }

    let watchId;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({ x: pos.coords.latitude, y: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation access denied, using simulated data.");
          startSimulation();
        }
      );
    } else {
      startSimulation();
    }

    let simIv;
    function startSimulation() {
      simIv = setInterval(() => {
        setCoords(prev => ({
          x: prev.x + (Math.random() - 0.5) * 0.001,
          y: prev.y + (Math.random() - 0.5) * 0.001
        }));
      }, 3000);
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (simIv) clearInterval(simIv);
      if (scanIv) clearInterval(scanIv);
    };
  }, [active, autoScan]);

  return (
    <div className={`vision-feed-panel glass-panel ${isSeeThrough ? 'is-see-through' : ''}`} style={{ height: '220px', marginBottom: '12px', position: 'relative' }}>
      <div className="scan-line" />
      <div className="panel-header">
        <span className="panel-title">Vision Feed</span>
        <span className="panel-badge">{active ? 'LIVE' : 'OFFLINE'}</span>
      </div>

      {!active ? (
        <div
          onClick={startCamera}
          style={{
            height: 'calc(100% - 40px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '24px', opacity: 0.3 }}>📷</div>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--text-muted)' }}>ACTIVATE OPTICS</div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: 'calc(100% - 40px)',
              objectFit: 'cover',
              filter: 'grayscale(1) contrast(1.2) brightness(0.8) sepia(0.3) hue-rotate(180deg)',
              opacity: 0.8
            }}
          />
          
          {/* Scan Overlay Effect */}
          {scanning && (
            <div style={{
              position: 'absolute',
              inset: '40px 0 0 0',
              background: 'linear-gradient(transparent, rgba(0, 212, 255, 0.2), transparent)',
              height: '20px',
              width: '100%',
              top: '40px',
              animation: 'scan-move 1.5s linear infinite',
              zIndex: 10,
              pointerEvents: 'none'
            }} />
          )}

          {/* Perception Scan Button */}
          <button 
            onClick={captureFrame}
            disabled={scanning}
            className="cmd-btn"
            style={{
              position: 'absolute',
              top: '48px',
              right: '8px',
              fontSize: '7px',
              padding: '2px 6px',
              background: scanning ? 'rgba(255,0,0,0.2)' : 'rgba(0,212,255,0.1)',
              zIndex: 20
            }}
          >
            {scanning ? 'SCANNING...' : 'PERCEPTION SCAN'}
          </button>
          {/* Targeting Reticle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            border: '1px solid rgba(0, 212, 255, 0.4)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}>
            <div style={{ position: 'absolute', top: '50%', left: '-10px', width: '20px', height: '1px', background: 'cyan', opacity: 0.5 }} />
            <div style={{ position: 'absolute', top: '50%', right: '-10px', width: '20px', height: '1px', background: 'cyan', opacity: 0.5 }} />
            <div style={{ position: 'absolute', top: '-10px', left: '50%', width: '1px', height: '20px', background: 'cyan', opacity: 0.5 }} />
            <div style={{ position: 'absolute', bottom: '-10px', left: '50%', width: '1px', height: '20px', background: 'cyan', opacity: 0.5 }} />
          </div>

          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '8px',
            color: 'cyan',
            textShadow: '0 0 5px cyan',
            pointerEvents: 'none'
          }}>
            LAT: {coords.x.toFixed(4)}<br />
            LON: {coords.y.toFixed(4)}<br />
            ALT: 427.8m<br />
            OBJ: DETECTED
          </div>
        </>
      )}

      {/* HUD Overlay for video */}
      {active && (
        <div style={{
          position: 'absolute',
          inset: '40px 0 0 0',
          pointerEvents: 'none',
          border: '1px solid rgba(0,212,255,0.1)',
          background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.4))'
        }}>
          <div style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px', borderLeft: '1px solid cyan', borderTop: '1px solid cyan', opacity: 0.5 }} />
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '20px', height: '20px', borderRight: '1px solid cyan', borderBottom: '1px solid cyan', opacity: 0.5 }} />
        </div>
      )}
    </div>
  );
}
