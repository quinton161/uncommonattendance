import React, { useState } from 'react';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      {isLogin ? (
        <LoginPage onToggleMode={() => setIsLogin(false)} />
      ) : (
        <RegisterPage onToggleMode={() => setIsLogin(true)} />
      )}
    </>
  );
};

