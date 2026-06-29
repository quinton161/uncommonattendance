import React, { useState } from 'react';
import { useClerk } from '@clerk/clerk-react';

export const DirectAuthTest: React.FC = () => {
  const clerk = useClerk();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testClerkLogin = async () => {
    setLoading(true);
    setResult('Opening Clerk sign-in modal...');
    try {
      await clerk.openSignIn();
      setResult('✅ Clerk sign-in modal opened.');
    } catch (error: any) {
      setResult(`❌ FAILED: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.8)', 
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2>🔐 Auth Test (Clerk)</h2>
                
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button onClick={testClerkLogin} disabled={loading}>
            Open Clerk Sign In
          </button>
        </div>
        
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
          minHeight: '60px',
          whiteSpace: 'pre-wrap'
        }}>
          {loading ? 'Testing...' : result || 'Click a button to test Clerk Auth'}
        </div>
        
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '10px', background: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}
        >
          Close Test & Reload
        </button>
      </div>
    </div>
  );
};
