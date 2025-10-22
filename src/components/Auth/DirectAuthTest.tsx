import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

export const DirectAuthTest: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123456');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testDirectLogin = async () => {
    setLoading(true);
    setResult('Testing direct Firebase login...');
    
    try {
      console.log('🧪 Direct Firebase login test starting...');
      console.log('Auth instance:', auth);
      console.log('Attempting login with:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Direct login successful:', userCredential.user);
      
      setResult(`✅ SUCCESS: Logged in as ${userCredential.user.email} (${userCredential.user.uid})`);
      
    } catch (error: any) {
      console.error('❌ Direct login failed:', error);
      setResult(`❌ FAILED: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectSignup = async () => {
    setLoading(true);
    const testEmail = `test-${Date.now()}@example.com`;
    setResult(`Creating test account: ${testEmail}`);
    
    try {
      console.log('🧪 Direct Firebase signup test starting...');
      
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, password);
      console.log('✅ Direct signup successful:', userCredential.user);
      
      setResult(`✅ SUCCESS: Created account ${userCredential.user.email} (${userCredential.user.uid})`);
      
    } catch (error: any) {
      console.error('❌ Direct signup failed:', error);
      setResult(`❌ FAILED: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testExistingUser = async () => {
    setLoading(true);
    // Test with one of the existing users
    const existingEmail = 'quintonndlovu161@gmail.com';
    setResult(`Testing with existing user: ${existingEmail}`);
    
    try {
      console.log('🧪 Testing with existing user...');
      
      // We can't test login without knowing the password, but we can test the auth flow
      setResult(`Please enter the password for ${existingEmail} and click Test Login`);
      setEmail(existingEmail);
      
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      setResult(`❌ FAILED: ${error.code} - ${error.message}`);
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
        <h2>🧪 Direct Firebase Auth Test</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button onClick={testDirectLogin} disabled={loading}>
            Test Login
          </button>
          <button onClick={testDirectSignup} disabled={loading}>
            Test Signup
          </button>
          <button onClick={testExistingUser} disabled={loading}>
            Use Existing User
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
          {loading ? 'Testing...' : result || 'Click a button to test Firebase Auth'}
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
