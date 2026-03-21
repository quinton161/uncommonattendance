import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';

// Instructor type for selection
type InstructorType = {
  id: string;
  name: string;
  username: string;
};

// Instructor list - email auto-generated
const INSTRUCTORS: InstructorType[] = [
  { id: '1', name: 'Mr. Moyo', username: 'moyo' },
  { id: '2', name: 'Ms. Dube', username: 'dube' },
  { id: '3', name: 'Mr. Ncube', username: 'ncube' },
  { id: '4', name: 'Ms. Sibanda', username: 'sibanda' },
];

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
`;

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const { register, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorType | null>(null);

  // Handle instructor selection - auto-generate email
  const handleInstructorSelect = (instructor: InstructorType) => {
    setSelectedInstructor(instructor);
    setFormData(prev => ({ 
      ...prev, 
      email: `${instructor.username}@uncommon.org`,
      displayName: instructor.name
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
      // If instructor is selected, register as instructor, otherwise as attendee
      const userType = selectedInstructor ? 'instructor' : 'attendee';
      await register(
        formData.email,
        formData.password,
        formData.displayName,
        userType
      );
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <Card padding="lg">
        <Title>Create Account</Title>
        
        {!selectedInstructor ? (
          <>
            <RoleToggleWrapper>
              <RoleButton 
                $active={!selectedInstructor}
                onClick={() => setSelectedInstructor(null)}
              >
                👨‍🎓 Attendee
              </RoleButton>
              <RoleButton 
                $active={!!selectedInstructor}
                onClick={() => {}}
              >
                👨‍🏫 Instructor
              </RoleButton>
            </RoleToggleWrapper>
            
            <HelpText>
              <h4>Instructor Registration</h4>
              <ul>
                <li>Select your profile from the list</li>
                <li>Email will be auto-generated as @uncommon.org</li>
              </ul>
            </HelpText>
            
            <InstructorGrid>
              {INSTRUCTORS.map(inst => (
                <InstructorCard 
                  key={inst.id}
                  $selected={(selectedInstructor as InstructorType | null)?.id === inst.id}
                  onClick={() => handleInstructorSelect(inst)}
                >
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: theme.colors.primary, 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontSize: theme.fontSizes.lg
                  }}>
                    {inst.name.charAt(0)}
                  </div>
                  <h4>{inst.name}</h4>
                  <p>{inst.username}@uncommon.org</p>
                </InstructorCard>
              ))}
            </InstructorGrid>
          </>
        ) : (
          <div style={{ marginBottom: theme.spacing.md }}>
            <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
              Registering as: <strong>{selectedInstructor.name}</strong> ({selectedInstructor.username}@uncommon.org)
            </p>
            <button 
              type="button"
              onClick={() => {
                setSelectedInstructor(null);
                setFormData(prev => ({ ...prev, email: '', displayName: '' }));
              }}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.primary,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: theme.fontSizes.sm
              }}
            >
              ← Change profile
            </button>
          </div>
        )}
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder={selectedInstructor ? selectedInstructor.name : "Enter your full name"}
            required
            disabled={!!selectedInstructor}
            fullWidth
          />
          
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={selectedInstructor ? `${selectedInstructor.username}@uncommon.org` : "Enter your email"}
            required
            disabled={!!selectedInstructor}
            fullWidth
          />
          
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
          Sign up with Google
        </GoogleButton>
        
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
