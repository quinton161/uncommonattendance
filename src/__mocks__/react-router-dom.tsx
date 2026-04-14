import React from 'react';

/** Minimal stubs for Jest — CRA/Jest cannot resolve react-router-dom v7 package exports. */
export const BrowserRouter: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
export const Routes: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const Route: React.FC<{ element?: React.ReactNode }> = ({ element }) => <>{element}</>;
