import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const mockAuth = {
  user: null as null,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateProfile: jest.fn(),
  resetPassword: jest.fn(),
  deleteAccount: jest.fn(),
  loginWithGoogle: jest.fn(),
  setHub: jest.fn(),
  completeGoogleProfile: jest.fn(),
  cancelGoogleRegistration: jest.fn(),
};

jest.mock('./contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('./contexts/EventContext', () => ({
  EventProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));


jest.mock('./components/Common/SimpleSplash', () => {
  const R = require('react');
  return {
    SimpleSplash: ({ onFinish }: { onFinish: () => void }) => {
      R.useEffect(() => {
        onFinish();
      }, [onFinish]);
      return null;
    },
  };
});

import App from './App';

test('renders auth experience after splash', async () => {
  render(<App />);
  await waitFor(() => {
    // Auth screen can vary by route/search params; assert on either Sign In or Reset Password heading.
    const signIn = screen.queryByRole('heading', { name: /sign in/i });
    const reset = screen.queryByRole('heading', { name: /set a new password/i });
    expect(Boolean(signIn || reset)).toBe(true);
  });
});
