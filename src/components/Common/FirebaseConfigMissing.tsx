import React from 'react';

/**
 * Shown when the production bundle was built without REACT_APP_FIREBASE_* variables.
 * Firebase client config must be present at build time (Create React App inlines env at compile time).
 */
export const FirebaseConfigMissing: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      padding: 24,
      fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
      background: '#f8f9fa',
      color: '#2c3e50',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        maxWidth: 520,
        background: '#fff',
        borderRadius: 12,
        padding: 28,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', margin: '0 0 12px', color: '#0052CC' }}>
        App configuration missing
      </h1>
      <p style={{ margin: '0 0 16px', lineHeight: 1.6, fontSize: '0.95rem' }}>
        This build was created without Firebase web settings. Those values must be available when you run{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>npm run build</code> — they
        are baked into the JavaScript bundle, not read at runtime from a server.
      </p>
      <h2 style={{ fontSize: '1rem', margin: '20px 0 8px' }}>Local / manual deploy</h2>
      <ol style={{ margin: '0 0 16px', paddingLeft: 22, lineHeight: 1.7, fontSize: '0.9rem' }}>
        <li>Copy <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>.env.example</code> to{' '}
          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>.env</code> in the project root.</li>
        <li>
          Fill in values from Firebase Console → Project settings → Your apps (Web). Variable names must start with{' '}
          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>REACT_APP_</code>.
        </li>
        <li>Run <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>npm run build</code> then deploy the <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>build</code> folder.</li>
      </ol>
      <h2 style={{ fontSize: '1rem', margin: '20px 0 8px' }}>CI (GitHub Actions, etc.)</h2>
      <p style={{ margin: '0 0 16px', lineHeight: 1.6, fontSize: '0.9rem' }}>
        Add repository secrets for each <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>REACT_APP_*</code> value and export them in the build step before{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>npm run build</code>.
      </p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
        Required: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>REACT_APP_FIREBASE_API_KEY</code>,{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>REACT_APP_FIREBASE_AUTH_DOMAIN</code>,{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>REACT_APP_FIREBASE_PROJECT_ID</code>,{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>REACT_APP_FIREBASE_STORAGE_BUCKET</code>,{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>REACT_APP_FIREBASE_MESSAGING_SENDER_ID</code>,{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>REACT_APP_FIREBASE_APP_ID</code>.
      </p>
    </div>
  </div>
);
