import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';


interface LoginFormProps {
  onToggleMode: () => void;
}

const FormContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
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
  animation: shake 0.5s ease;

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

const SuccessMessage = styled.div`
  background-color: ${theme.colors.success}10;
  border: 1px solid ${theme.colors.success}30;
  color: ${theme.colors.success};
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
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${theme.colors.gray50};
    border-color: ${theme.colors.gray400};
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }

  img {
    width: 20px;
    height: 20px;
  }
`;

const RoleToggleWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.lg};
`;

const RoleButton = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: ${theme.spacing.md};
  border: 2px solid ${props => props.$active ? theme.colors.primary : theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  background: ${props => props.$active ? theme.colors.primary + '10' : 'white'};
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  font-weight: ${theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};

  &:hover {
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primary + '05'};
  }
`;

const InstructorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const InstructorCard = styled.div<{ $selected?: boolean }>`
  padding: ${theme.spacing.md};
  border: 2px solid ${props => props.$selected ? theme.colors.primary : theme.colors.gray200};
  border-radius: ${theme.borderRadius.md};
  background: ${props => props.$selected ? theme.colors.primary + '10' : 'white'};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: ${theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
  }

  h4 {
    margin: 0;
    color: ${theme.colors.textPrimary};
    font-size: ${theme.fontSizes.sm};
  }

  p {
    margin: ${theme.spacing.xs} 0 0 0;
    color: ${theme.colors.textSecondary};
    font-size: ${theme.fontSizes.xs};
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.fontSizes.sm};
  margin-bottom: ${theme.spacing.md};
  
  &:hover {
    color: ${theme.colors.primary};
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${theme.colors.primary};
  }
`;

const ValidationIcon = styled.span<{ $isValid?: boolean }>`
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.$isValid ? theme.colors.success : theme.colors.danger};
  display: flex;
  align-items: center;
`;

const RememberMeWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  cursor: pointer;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  margin-top: ${theme.spacing.xs};

  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: ${theme.colors.primary};
  }

  &:hover {
    color: ${theme.colors.textPrimary};
  }
`;

const NetworkWarning = styled.div`
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Email validation
  useEffect(() => {
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(emailRegex.test(formData.email));
    } else {
      setEmailValid(null);
    }
  }, [formData.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check network status
    if (!navigator.onLine) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    // Validate email
    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Failed to log in';
      
      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
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

    if (!emailValid) {
      setError('Please enter a valid email address first');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await resetPassword(formData.email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
  };

  const isFormValid = emailValid && formData.password.length > 0;

  return (
    <FormContainer>
      <Card padding="lg">
        <Title>Welcome Back</Title>
        
        {!isOnline && (
          <NetworkWarning>
            <span style={{ marginRight: '8px' }}>⚠️</span>
            You're offline. Some features may not work.
          </NetworkWarning>
        )}
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
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
          <div style={{ position: 'relative' }}>
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
            {emailValid !== null && (
              <ValidationIcon $isValid={emailValid}>
                {emailValid ? <FiCheckCircle size={16} /> : <FiAlertTriangle size={16} />}
              </ValidationIcon>
            )}
          </div>
          
          <PasswordWrapper>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              fullWidth
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </PasswordToggle>
          </PasswordWrapper>

          <RememberMeWrapper>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </RememberMeWrapper>
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!isFormValid || !isOnline}
            style={{
              transition: 'transform 0.1s ease',
            }}
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
          disabled={loading || !isOnline}
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
