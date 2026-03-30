import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { getFirebaseAuthErrorMessage } from '../../utils/firebaseAuthErrors';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { Rocket } from 'lucide-react';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${theme.colors.white};
  overflow: hidden;

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
  }
`;

const LeftPanel = styled.div`
  flex: 0.4;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing['2xl']};
  color: ${theme.colors.white};
  position: relative;
  text-align: center;

  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const RightPanel = styled.div`
  flex: 0.6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  position: relative;
  background: ${theme.colors.white};

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex: 1;
    padding: ${theme.spacing.lg};
  }
`;

const BrandingContent = styled.div`
  z-index: 10;
  animation: ${fadeIn} 0.8s ease-out;
`;

const IconWrapper = styled.div`
  margin-bottom: ${theme.spacing.xl};
  animation: ${float} 6s ease-in-out infinite;
  display: flex;
  justify-content: center;
`;

const WelcomeTitle = styled.h1`
  font-family: ${theme.fonts.heading};
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: ${theme.spacing.md};
  letter-spacing: -0.02em;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 320px;
  margin: 0 auto;
  line-height: 1.6;
`;

const CloudDivider = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 120px;
  z-index: 5;
  pointer-events: none;

  svg {
    height: 100%;
    width: 100%;
  }

  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const MobileHeader = styled.div`
  display: none;

  @media (max-width: ${theme.breakpoints.tablet}) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 180px;
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    color: white;
    padding: ${theme.spacing.lg};
    border-bottom-left-radius: 40px;
    border-bottom-right-radius: 40px;
    margin-bottom: ${theme.spacing.xl};
    text-align: center;

    ${WelcomeTitle} {
      font-size: 1.5rem;
      margin-bottom: ${theme.spacing.xs};
    }
    ${WelcomeSubtitle} {
      font-size: 0.9rem;
    }
  }
`;

const FormCard = styled(Card)`
  width: 100%;
  max-width: 480px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  animation: ${fadeIn} 0.6s ease-out;
  padding: ${theme.spacing.xl};

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.lg};
    box-shadow: none;
    border: none;
  }
`;

const FormTitle = styled.h2`
  font-family: ${theme.fonts.heading};
  font-size: 1.75rem;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.md};
  text-align: center;
`;

const FormSubtitle = styled.p`
  color: ${theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
  font-size: 0.95rem;
`;

const ErrorMessage = styled.div`
  background: rgba(220, 38, 38, 0.05);
  color: #dc2626;
  padding: ${theme.spacing.md};
  border-radius: 12px;
  font-size: 0.9rem;
  margin-bottom: ${theme.spacing.lg};
  border: 1px solid rgba(220, 38, 38, 0.1);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
`;

const SuccessMessage = styled.div`
  background: rgba(22, 163, 74, 0.05);
  color: #16a34a;
  padding: ${theme.spacing.md};
  border-radius: 12px;
  font-size: 0.9rem;
  margin-bottom: ${theme.spacing.lg};
  border: 1px solid rgba(22, 163, 74, 0.1);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
`;

const StyledButton = styled(Button)`
  height: 52px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  margin-top: ${theme.spacing.md};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const GoogleButton = styled(Button)`
  height: 52px;
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray300};
  color: ${theme.colors.textPrimary};
  font-weight: 600;
  margin-top: ${theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};

  &:hover:not(:disabled) {
    background: ${theme.colors.gray50};
    border-color: ${theme.colors.gray400};
  }

  img {
    width: 20px;
    height: 20px;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: ${theme.spacing.xl} 0;
  color: ${theme.colors.gray400};
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid ${theme.colors.gray200};
  }

  span {
    padding: 0 ${theme.spacing.md};
  }
`;

const ToggleLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-weight: 600;
  cursor: pointer;
  margin-left: ${theme.spacing.xs};

  &:hover {
    text-decoration: underline;
  }
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.textSecondary};
  font-size: 0.85rem;
  cursor: pointer;
  display: block;
  margin-top: ${theme.spacing.sm};
  width: 100%;
  text-align: right;

  &:hover {
    color: ${theme.colors.primary};
    text-decoration: underline;
  }
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: ${theme.spacing.xl};
  color: ${theme.colors.textSecondary};
  font-size: 0.95rem;
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
  z-index: 10;
  
  &:hover {
    color: ${theme.colors.primary};
  }
`;

interface LoginPageProps {
  onToggleMode: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onToggleMode }) => {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(getFirebaseAuthErrorMessage(err?.code, 'Failed to sign in.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await resetPassword(formData.email);
      setSuccess('If an account exists for this email, we sent reset instructions. Check your inbox.');
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err?.code, 'Failed to send reset email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LeftPanel>
        <BrandingContent>
          <IconWrapper>
            <Rocket size={80} color="white" />
          </IconWrapper>
          <WelcomeTitle>Welcome Back</WelcomeTitle>
          <WelcomeSubtitle>
            Sign in to continue tracking your attendance and performance.
          </WelcomeSubtitle>
        </BrandingContent>
        <CloudDivider>
          <svg viewBox="0 0 120 600" preserveAspectRatio="none">
            <path
              d="M0,0 C80,100 40,200 80,300 C40,400 80,500 0,600 L120,600 L120,0 Z"
              fill="white"
            />
          </svg>
        </CloudDivider>
      </LeftPanel>

      <MobileHeader>
        <Rocket size={40} color="white" style={{ marginBottom: theme.spacing.sm }} />
        <WelcomeTitle>Uncommon Attendance</WelcomeTitle>
        <WelcomeSubtitle>Welcome Back</WelcomeSubtitle>
      </MobileHeader>

      <RightPanel>
        <FormCard>
          <FormTitle>Sign In</FormTitle>
          <FormSubtitle>Enter your details to access your account</FormSubtitle>

          {error && (
            <ErrorMessage>
              <FiAlertTriangle size={18} /> {error}
            </ErrorMessage>
          )}

          {success && (
            <SuccessMessage>
              <FiCheckCircle size={18} /> {success}
            </SuccessMessage>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              fullWidth
            />

            <PasswordWrapper>
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
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

            <ForgotPasswordLink type="button" onClick={handleForgotPassword}>
              Forgot password?
            </ForgotPasswordLink>

            <StyledButton
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Sign In
            </StyledButton>
          </form>

          <Divider>
            <span>Or continue with</span>
          </Divider>

          <GoogleButton
            variant="outline"
            fullWidth
            onClick={async () => {
              setError('');
              setSuccess('');
              setLoading(true);
              try {
                await loginWithGoogle();
              } catch {
                /* errors surfaced via toast in AuthContext */
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Google
          </GoogleButton>

          <FooterText>
            Don't have an account?
            <ToggleLink onClick={onToggleMode}>Create Account</ToggleLink>
          </FooterText>
        </FormCard>
      </RightPanel>
    </Container>
  );
};
