import React from 'react';

/** Minimal stubs for Jest — CRA/Jest cannot resolve react-router-dom v7 package exports. */
export const BrowserRouter: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
export const Routes: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const Route: React.FC<{ element?: React.ReactNode }> = ({ element }) => <>{element}</>;

export const Navigate: React.FC<{ to: string; replace?: boolean }> = () => null;

export const Link: React.FC<{ children?: React.ReactNode; to?: string }> = ({ children }) => (
  <>{children}</>
);

export const useNavigate = () => () => {};

export const useLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'test',
});

export const useSearchParams = () =>
  [new URLSearchParams(''), () => {}] as const;
