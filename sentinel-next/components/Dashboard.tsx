'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  totalKeys: number;
  activeKeys: number;
  totalRequests: number;
  timestamp: string;
}

interface LedgerEntry {
  id: string;
  label: string;
  value: string;
  time: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [connected, setConnected] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'stats') {
        const next: Stats = msg.data;
        setStats((prev) => {
          if (prev) {
            const entries: LedgerEntry[] = [];
            if (next.totalKeys > prev.totalKeys) {
              entries.push({ id: crypto.randomUUID(), label: 'KEY ISSUED', value: `total ${next.totalKeys}`, time: next.timestamp });
            }
            if (next.activeKeys < prev.activeKeys) {
              entries.push({ id: crypto.randomUUID(), label: 'KEY REVOKED', value: `active ${next.activeKeys}`, time: next.timestamp });
            }
            if (next.totalRequests > prev.totalRequests) {
              entries.push({ id: crypto.randomUUID(), label: 'REQUEST', value: `+${next.totalRequests - prev.totalRequests}`, time: next.timestamp });
            }
            if (entries.length) {
              setLedger((l) => [...entries.reverse(), ...l].slice(0, 30));
            }
          }
          return next;
        });
        setPulse(true);
        setTimeout(() => setPulse(false), 400);
      }
    };

    ws.onclose = () => setConnected(false);

    return () => ws.close();
  }, []);

  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        background: '#0a0a0a',
        minHeight: '100vh',
        width: '100%',
        color: '#e6e6e6',
        padding: '3rem 4rem',
        boxSizing: 'border-box',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: connected ? '#E53935' : '#3a3a3a',
            boxShadow: pulse ? '0 0 0 6px rgba(229,57,53,0.15)' : 'none',
            transition: 'box-shadow 0.4s ease',
          }}
        />
        <h1 style={{ fontSize: '1.1rem', fontWeight: 500, letterSpacing: '0.02em', margin: 0 }}>
          SENTINEL
        </h1>
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666', marginLeft: 'auto' }}>
          {connected ? 'watching' : 'disconnected'}
        </span>
      </header>

      {stats ? (
        <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 2, marginBottom: '3rem', color: '#999' }}>
          <div>users&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e6e6e6' }}>{stats.totalUsers}</span></div>
          <div>keys&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e6e6e6' }}>{stats.totalKeys}</span> <span style={{ color: '#555' }}>({stats.activeKeys} active)</span></div>
          <div>requests&nbsp;&nbsp;<span style={{ color: '#e6e6e6' }}>{stats.totalRequests}</span></div>
        </div>
      ) : (
        <p style={{ fontFamily: 'monospace', color: '#666' }}>connecting...</p>
      )}

      <div>
        <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
          Ledger
        </p>
        <div style={{ borderTop: '1px solid #1a1a1a' }}>
          {ledger.length === 0 && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#444', padding: '1rem 0' }}>
              no activity yet
            </p>
          )}
          {ledger.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                padding: '0.6rem 0',
                borderBottom: '1px solid #1a1a1a',
                color: '#999',
              }}
            >
              <span style={{ color: '#E53935' }}>{entry.label}</span>
              <span>{entry.value}</span>
              <span style={{ color: '#555' }}>{new Date(entry.time).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
