import React, { useState } from 'react';
import styled from 'styled-components';
import { useEvent } from '../../contexts/EventContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { theme } from '../../styles/theme';

const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: ${theme.spacing.lg};
`;

const FormTitle = styled.h2`
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.textPrimary};
  text-align: center;
`;

const FormGrid = styled.div`
  display: grid;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.md};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: ${theme.spacing.sm};
  border: 1px solid #e2e8f0;
  border-radius: ${theme.borderRadius.md};
  font-family: inherit;
  font-size: ${theme.fontSizes.base};
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin: ${theme.spacing.md} 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
`;

const ErrorMessage = styled.div`
  background: ${theme.colors.gray100};
  color: ${theme.colors.primary};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.md};
  border: 1px solid ${theme.colors.primary};
`;

const SuccessMessage = styled.div`
  background: ${theme.colors.gray100};
  color: ${theme.colors.primary};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.md};
  border: 1px solid ${theme.colors.primary};
`;

interface CreateEventFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({ onCancel, onSuccess }) => {
  const { user } = useAuth();
  const { createEvent } = useEvent();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    capacity: '',
    imageUrl: '',
    isPublic: true,
    eventStatus: 'draft' as 'draft' | 'published' | 'cancelled' | 'completed'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create events');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      setError('Event title is required');
      return;
    }
    
    if (!formData.startDate || !formData.startTime) {
      setError('Start date and time are required');
      return;
    }
    
    if (!formData.endDate || !formData.endTime) {
      setError('End date and time are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Combine date and time
      const startDate = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDate = new Date(`${formData.endDate}T${formData.endTime}`);

      // Validate dates
      if (startDate >= endDate) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate,
        endDate,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        isPublic: formData.isPublic,
        eventStatus: formData.eventStatus,
        organizerId: user.uid,
      };

      await createEvent(eventData);
      setSuccess('Event created successfully!');
      
      // Wait a moment then call success callback
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <Card padding="lg">
        <FormTitle>Create New Event</FormTitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <form onSubmit={handleSubmit}>
          <FormGrid>
            <Input
              label="Event Title *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter event title"
              required
            />

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: theme.spacing.xs,
                fontWeight: theme.fontWeights.medium,
                color: theme.colors.textPrimary 
              }}>
                Description
              </label>
              <TextArea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event..."
              />
            </div>

            <Input
              label="Location *"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Event location"
              required
            />

            <FormRow>
              <Input
                label="Start Date *"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <Input
                label="Start Time *"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </FormRow>

            <FormRow>
              <Input
                label="End Date *"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
              <Input
                label="End Time *"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </FormRow>

            <FormRow>
              <Input
                label="Capacity (Optional)"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Maximum attendees"
              />
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing.xs,
                  fontWeight: theme.fontWeights.medium,
                  color: theme.colors.textPrimary 
                }}>
                  Status
                </label>
                <select
                  name="eventStatus"
                  value={formData.eventStatus}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    border: '1px solid #e2e8f0',
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSizes.base
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </FormRow>

            <Input
              label="Image URL (Optional)"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />

            <CheckboxContainer>
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                id="isPublic"
              />
              <label htmlFor="isPublic" style={{ color: theme.colors.textPrimary }}>
                Make this event public (visible to all users)
              </label>
            </CheckboxContainer>
          </FormGrid>

          <ButtonRow>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </ButtonRow>
        </form>
      </Card>
    </FormContainer>
  );
};
