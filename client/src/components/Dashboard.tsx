import React, { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  totalKeys: number;
  activeKeys: number;
  totalRequests: number;
  timestamp: string;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'stats') {
        setStats(msg.data);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', background: '#0d1117', minHeight: '100vh', color: '#e6edf3' }}>
      <h1 style={{ color: '#58a6ff' }}>🛡️ Sentinel Dashboard</h1>
      <p style={{ color: connected ? '#3fb950' : '#f85149' }}>
        {connected ? '● Live' : '○ Disconnected'}
      </p>

      {stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '2rem' }}>
          <StatCard title="Total Users" value={stats.totalUsers} />
          <StatCard title="Total API Keys" value={stats.totalKeys} />
          <StatCard title="Active Keys" value={stats.activeKeys} />
          <StatCard title="Total Requests" value={stats.totalRequests} />
        </div>
      ) : (
        <p>Connecting...</p>
      )}

      {stats && (
        <p style={{ marginTop: '2rem', color: '#8b949e', fontSize: '0.8rem' }}>
          Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '8px',
      padding: '1.5rem',
    }}>
      <p style={{ color: '#8b949e', margin: 0 }}>{title}</p>
      <h2 style={{ color: '#58a6ff', margin: '0.5rem 0 0' }}>{value}</h2>
    </div>
  );
}

export default Dashboard;