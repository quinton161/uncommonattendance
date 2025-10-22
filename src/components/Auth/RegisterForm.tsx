import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';

interface RegisterFormProps {
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

const RoleSelector = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};
`;

const RoleButton = styled.button<{ selected: boolean }>`
  flex: 1;
  padding: ${theme.spacing.sm};
  border: 2px solid ${({ selected }) => 
    selected ? theme.colors.primary : theme.colors.gray300};
  background-color: ${({ selected }) => 
    selected ? theme.colors.primary : theme.colors.white};
  color: ${({ selected }) => 
    selected ? theme.colors.white : theme.colors.textPrimary};
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

const ToggleText = styled.p`
  text-align: center;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  margin-top: ${theme.spacing.md};
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

const ErrorMessage = styled.div`
  background-color: ${theme.colors.danger}10;
  border: 1px solid ${theme.colors.danger}30;
  color: ${theme.colors.danger};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.sm};
  text-align: center;
`;

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'attendee' as 'organizer' | 'attendee' | 'admin',
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

  const handleRoleChange = (userType: 'organizer' | 'attendee' | 'admin') => {
    setFormData(prev => ({
      ...prev,
      userType,
    }));
    setError('');
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      await register(
        formData.email,
        formData.password,
        formData.displayName,
        formData.userType
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <Card padding="lg">
        <Title>Create Account</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
            fullWidth
          />
          
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
          
          <div>
            <label style={{ 
              fontSize: theme.fontSizes.sm,
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.xs,
              display: 'block'
            }}>
              Role *
            </label>
            <RoleSelector>
              <RoleButton
                type="button"
                selected={formData.userType === 'attendee'}
                onClick={() => handleRoleChange('attendee')}
              >
                Attendee
              </RoleButton>
              <RoleButton
                type="button"
                selected={formData.userType === 'organizer'}
                onClick={() => handleRoleChange('organizer')}
              >
                Organizer
              </RoleButton>
              <RoleButton
                type="button"
                selected={formData.userType === 'admin'}
                onClick={() => handleRoleChange('admin')}
              >
                Admin
              </RoleButton>
            </RoleSelector>
          </div>
          
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            fullWidth
          />
          
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
            fullWidth
          />
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={
              !formData.displayName ||
              !formData.email ||
              !formData.password ||
              !formData.confirmPassword
            }
          >
            Create Account
          </Button>
        </Form>
        
        <ToggleText>
          Already have an account?{' '}
          <ToggleLink onClick={onToggleMode}>
            Sign in here
          </ToggleLink>
        </ToggleText>
      </Card>
    </FormContainer>
  );
};
