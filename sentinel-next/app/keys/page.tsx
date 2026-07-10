import { generateKeyAction, revokeKeyAction } from '../../lib/actions';

interface ApiKey {
  id: number;
  name: string;
  plan: string;
  isActive: boolean;
  requests: number;
  createdAt: string;
}

async function getKeys(): Promise<ApiKey[]> {
  const res = await fetch('http://localhost:3000/api/keys/user/1', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.apiKeys ?? [];
}

export default async function KeysPage() {
  const keys = await getKeys();

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
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 500, letterSpacing: '0.02em', margin: 0 }}>
          SENTINEL <span style={{ color: '#555', fontWeight: 400 }}>/ keys</span>
        </h1>
      </header>

      <form
        action={generateKeyAction}
        style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem' }}
      >
        <input
          name="name"
          placeholder="key name"
          required
          style={{
            background: '#111111',
            border: '1px solid #1a1a1a',
            color: '#e6e6e6',
            padding: '0.6rem 0.9rem',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            flex: 1,
            maxWidth: '320px',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'transparent',
            border: '1px solid #E53935',
            color: '#E53935',
            padding: '0.6rem 1.2rem',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          generate
        </button>
      </form>

      <div style={{ borderTop: '1px solid #1a1a1a' }}>
        {keys.length === 0 && (
          <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#444', padding: '1rem 0' }}>
            no keys yet
          </p>
        )}
        {keys.map((key) => (
          <div
            key={key.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 0',
              borderBottom: '1px solid #1a1a1a',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: '#e6e6e6', minWidth: '160px' }}>{key.name}</span>
            <span style={{ color: '#666' }}>{key.plan}</span>
            <span style={{ color: key.isActive ? '#3fb950' : '#666' }}>
              {key.isActive ? 'active' : 'revoked'}
            </span>
            <span style={{ color: '#666' }}>{key.requests} reqs</span>
            {key.isActive && (
              <form action={revokeKeyAction.bind(null, key.id)}>
                <button
                  type="submit"
                  style={{
                    background: 'transparent',
                    border: '1px solid #333',
                    color: '#999',
                    padding: '0.35rem 0.8rem',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  revoke
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
