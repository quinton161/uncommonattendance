import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

interface LayoutProps {
  children: React.ReactNode;
}

interface ContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  children: React.ReactNode;
}

const LayoutWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${theme.colors.background};
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  /* Add top padding to account for the sticky header so content is not hidden behind it */
  padding-top: 64px;

  @media (max-width: ${theme.breakpoints.tablet}) {
    /* Mobile/tablet header uses a slightly smaller height in other components */
    padding-top: 60px;
  }
`;

const getMaxWidth = (maxWidth: string) => {
  switch (maxWidth) {
    case 'sm':
      return '640px';
    case 'md':
      return '768px';
    case 'lg':
      return '1024px';
    case 'xl':
      return '1280px';
    case 'full':
      return '100%';
    default:
      return '1024px';
  }
};

const StyledContainer = styled.div<ContainerProps>`
  width: 100%;
  max-width: ${({ maxWidth = 'lg' }) => getMaxWidth(maxWidth)};
  margin: 0 auto;
  padding: ${({ padding = true }) => 
    padding ? `0 ${theme.spacing.md}` : '0'};

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${({ padding = true }) => 
      padding ? `0 ${theme.spacing.sm}` : '0'};
  }
`;

const Header = styled.header`
  background-color: ${theme.colors.surface};
  border-bottom: 1px solid ${theme.colors.gray200};
  box-shadow: ${theme.shadows.sm};
  position: sticky;
  top: 0;
  z-index: ${theme.zIndex.sticky};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: 0 ${theme.spacing.sm};
  }
`;

const Logo = styled.h1`
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  margin: 0;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    gap: ${theme.spacing.sm};
  }
`;

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutWrapper>
      <Main>{children}</Main>
    </LayoutWrapper>
  );
};

export const Container: React.FC<ContainerProps> = ({ children, ...props }) => {
  return <StyledContainer {...props}>{children}</StyledContainer>;
};

export const AppHeader: React.FC<{ 
  title?: string; 
  children?: React.ReactNode; 
}> = ({ 
  title = "Hub Attendance Tracker", 
  children 
}) => {
  return (
    <Header>
      <Container>
        <HeaderContent>
          <Logo>{title}</Logo>
          <Nav>{children}</Nav>
        </HeaderContent>
      </Container>
    </Header>
  );
};
