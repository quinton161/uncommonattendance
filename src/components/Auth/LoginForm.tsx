import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';

interface LoginFormProps {
  onToggleMode: () => void;
}

const FormContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const Title = styled.h2`
  text-align: center;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.lg};
`;

const ToggleText = styled.p`
  text-align: center;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  margin-top: ${theme.spacing.md};
`;

const HelpText = styled.div`
  background: ${theme.colors.gray50};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  
  h4 {
    margin: 0 0 ${theme.spacing.xs} 0;
    color: ${theme.colors.textPrimary};
    font-size: ${theme.fontSizes.sm};
  }
  
  ul {
    margin: ${theme.spacing.xs} 0 0 0;
    padding-left: ${theme.spacing.md};
  }
  
  li {
    margin-bottom: 2px;
  }
`;

const ToggleLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeights.medium};
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: ${theme.colors.primaryDark};
  }
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  cursor: pointer;
  text-decoration: underline;
  margin-top: ${theme.spacing.sm};
  
  &:hover {
    color: ${theme.colors.primary};
  }
`;

const ErrorMessage = styled.div`
  background-color: ${theme.colors.danger}10;
  border: 1px solid ${theme.colors.danger}30;
  color: ${theme.colors.danger};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.sm};
  text-align: center;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: ${theme.spacing.lg} 0;
  color: ${theme.colors.gray400};
  font-size: ${theme.fontSizes.sm};

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${theme.colors.gray200};
  }

  span {
    margin: 0 ${theme.spacing.md};
  }
`;

const GoogleButton = styled(Button)`
  background-color: white;
  color: ${theme.colors.textPrimary};
  border: 1px solid ${theme.colors.gray300};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  
  &:hover {
    background-color: ${theme.colors.gray50};
    border-color: ${theme.colors.gray400};
  }

  img {
    width: 20px;
    height: 20px;
  }
`;

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Provide specific error messages
      let errorMessage = 'Failed to log in';
      
      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    try {
      await resetPassword(formData.email);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
  };

  return (
    <FormContainer>
      <Card padding="lg">
        <Title>Welcome Back</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {error && error.includes('Invalid email or password') && (
          <HelpText>
            <h4>Need help logging in?</h4>
            <ul>
              <li>Try common test credentials: test@test.com / test123</li>
              <li>Use the "Forgot your password?" link below</li>
              <li>Or create a new account using the Sign up tab</li>
            </ul>
          </HelpText>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            fullWidth
          />
          
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            fullWidth
          />
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!formData.email || !formData.password}
          >
            Sign In
          </Button>
        </Form>

        <Divider>
          <span>OR</span>
        </Divider>

        <GoogleButton
          type="button"
          variant="outline"
          fullWidth
          onClick={loginWithGoogle}
          disabled={loading}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Sign in with Google
        </GoogleButton>
        
        <div style={{ textAlign: 'center' }}>
          <ForgotPasswordLink onClick={handleForgotPassword}>
            Forgot your password?
          </ForgotPasswordLink>
        </div>
        
        <ToggleText>
          Don't have an account?{' '}
          <ToggleLink onClick={onToggleMode}>
            Sign up here
          </ToggleLink>
        </ToggleText>
      </Card>
    </FormContainer>
  );
};
