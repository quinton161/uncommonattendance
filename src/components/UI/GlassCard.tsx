import styled from 'styled-components';
import { theme } from '../../styles/theme';

export const GlassCard = styled.div`
  background: rgba(255,255,255,0.82);
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing.md};
  box-shadow: 0 12px 40px rgba(0,82,204,0.06);
`;

export default GlassCard;
