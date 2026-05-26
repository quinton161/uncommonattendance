import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const ShowcaseContainer = styled.div`
  padding: ${theme.spacing.xl};
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  margin: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.lg};
`;

const ShowcaseTitle = styled.h1`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes['4xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
  letter-spacing: -0.02em;
`;

const WeightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const WeightCard = styled.div`
  background: ${theme.colors.backgroundSecondary};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  border-left: 4px solid ${theme.colors.primary};
`;

const WeightLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: ${theme.spacing.md};
`;

const SampleText = styled.div<{ weight: number }>`
  font-family: ${theme.fonts.primary};
  font-weight: ${props => props.weight};
  font-size: ${theme.fontSizes.lg};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.sm};
  line-height: 1.4;
`;

const AlphabetSection = styled.div`
  text-align: center;
  margin-top: ${theme.spacing.xl};
  padding: ${theme.spacing.xl};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%);
  border-radius: ${theme.borderRadius.xl};
  color: ${theme.colors.white};
`;

const AlphabetTitle = styled.h2`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.lg};
`;

const AlphabetText = styled.div`
  font-family: ${theme.fonts.primary};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.medium};
  letter-spacing: 2px;
  line-height: 1.8;
`;

export const FontShowcase: React.FC = () => {
  const weights = [
    { label: 'Extralight (200)', weight: 200, sample: 'AaBbCcDdEeFfGgHhŞşIıİi Example' },
    { label: 'Light (300)', weight: 300, sample: 'Modern Event Management System' },
    { label: 'Regular (400)', weight: 400, sample: 'Student Dashboard Interface' },
    { label: 'Medium (500)', weight: 500, sample: 'Admin Panel Controls' },
    { label: 'Semibold (600)', weight: 600, sample: 'Event Creation Form' },
    { label: 'Bold (700)', weight: 700, sample: 'Welcome Dashboard' },
  ];

  return (
    <ShowcaseContainer>
      <ShowcaseTitle>Chillax Typography</ShowcaseTitle>
      
      <WeightGrid>
        {weights.map((item, index) => (
          <WeightCard key={index}>
            <WeightLabel>{item.label}</WeightLabel>
            <SampleText weight={item.weight}>
              {item.sample}
            </SampleText>
            <SampleText weight={item.weight}>
              AaBbCcDdEeFfGgHhŞşIıİi
            </SampleText>
          </WeightCard>
        ))}
      </WeightGrid>

      <AlphabetSection>
        <AlphabetTitle>Complete Character Set</AlphabetTitle>
        <AlphabetText>
          AaBbCcDdEeFfGgHhŞşIıİi<br />
          JjKkLlMmNnOoPpQqRrSsTt<br />
          UuVvWwXxYyZz 0123456789<br />
          !@#$%^&*()_+-=[]{}|;:'"<br />
          .,&lt;&gt;?/~`
        </AlphabetText>
      </AlphabetSection>
    </ShowcaseContainer>
  );
};
