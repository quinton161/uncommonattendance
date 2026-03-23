import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';
import { FiUser, FiCheckCircle, FiMail, FiLock } from 'react-icons/fi';

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
  max-width: 520px;
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
  margin-bottom: ${theme.spacing.xl};
  text-align: center;
`;

const RoleToggle = styled.div`
  display: flex;
  background: ${theme.colors.gray100};
  padding: 4px;
  border-radius: 12px;
  margin-bottom: ${theme.spacing.xl};
`;

const RoleButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: ${theme.spacing.md};
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  background: ${props => props.$active ? theme.colors.white : 'transparent'};
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  box-shadow: ${props => props.$active ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'};

  &:hover {
    color: ${props => props.$active ? theme.colors.primary : theme.colors.textPrimary};
  }
`;

const HelperText = styled.p`
  font-size: 0.85rem;
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
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

const FooterText = styled.p`
  text-align: center;
  margin-top: ${theme.spacing.xl};
  color: ${theme.colors.textSecondary};
  font-size: 0.95rem;
`;

interface RegisterPageProps {
  onToggleMode: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onToggleMode }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleRoleChange = (newRole: 'student' | 'instructor') => {
    setRole(newRole);
    setFormData({
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (role === 'instructor' && !formData.email.endsWith('@uncommon.org')) {
      setError('Instructor accounts must use an @uncommon.org email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userType = role === 'instructor' ? 'instructor' : 'attendee';
      await register(
        formData.email,
        formData.password,
        formData.displayName,
        userType
      );
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account');
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
          <WelcomeTitle>Welcome to Uncommon Attendance</WelcomeTitle>
          <WelcomeSubtitle>
            Smart and reliable attendance tracking system for the modern Hub.
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
        <WelcomeSubtitle>Smart and reliable tracking</WelcomeSubtitle>
      </MobileHeader>

      <RightPanel>
        <FormCard>
          <FormTitle>Create your account</FormTitle>

          <RoleToggle>
            <RoleButton 
              $active={role === 'student'} 
              onClick={() => handleRoleChange('student')}
            >
              Student
            </RoleButton>
            <RoleButton 
              $active={role === 'instructor'} 
              onClick={() => handleRoleChange('instructor')}
            >
              Instructor
            </RoleButton>
          </RoleToggle>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              fullWidth
              icon={<FiUser />}
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={role === 'instructor' ? "username@uncommon.org" : "Enter your email"}
              required
              fullWidth
              icon={<FiMail />}
            />

            {role === 'instructor' && (
              <HelperText style={{ marginTop: '-8px', marginBottom: '16px' }}>
                <FiCheckCircle size={14} color={theme.colors.success} /> 
                Only @uncommon.org instructor accounts are allowed
              </HelperText>
            )}

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              fullWidth
              icon={<FiLock />}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              fullWidth
              icon={<FiLock />}
            />

            <StyledButton
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Create Account
            </StyledButton>
          </form>

          <FooterText>
            Already have an account?
            <ToggleLink onClick={onToggleMode}>Sign In</ToggleLink>
          </FooterText>
        </FormCard>
      </RightPanel>
    </Container>
  );
};
