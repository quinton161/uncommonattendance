export const theme = {
  colors: {
    // Uncommon.org Brand Colors
    primary: '#0052CC',        // Uncommon blue (more vibrant/standard blue)
    primaryLight: '#0747A6',   // Lighter blue
    primaryDark: '#003D99',    // Darker blue
    
    // Secondary colors
    secondary: '#0052CC', // Match uncommon blue
    secondaryDark: '#003D99', // Darker uncommon blue
    accent: '#f39c12', // Warm orange
    
    // Status colors
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c',
    danger: '#e74c3c', // Same as error for consistency
    dangerDark: '#c0392b', // Darker red
    info: '#3498db',
    
    // Neutral colors
    white: '#ffffff',
    black: '#2c3e50', // Using dark blue-gray instead of pure black
    gray50: '#f8faff',
    gray100: '#eef2ff',
    gray200: '#e8eeff',
    gray300: '#d8e9ff',
    gray400: '#94a3b8',
    gray500: '#64748b',
    gray600: '#475569',
    gray700: '#334155',
    gray800: '#1e293b',
    gray900: '#2c3e50',
    
    // Background colors
    background: '#eef2ff',
    backgroundSecondary: '#eef2ff',
    surface: '#ffffff',
    
    // Text colors
    textPrimary: '#2c3e50',
    textSecondary: '#64748b',
    textLight: '#94a3b8',
  },
  
  fonts: {
    primary: "'Chillax', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    heading: "'Chillax', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
    mono: '"Fira Code", "Monaco", "Consolas", "Ubuntu Mono", monospace',
  },
  
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  
  fontWeights: {
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.25rem',
    '4xl': '1.5rem',
    '5xl': '2rem',
    full: '9999px',
  },
  
  /* Glassmorphism shadows */
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 1px 4px rgba(0, 82, 204, 0.05)',
    lg: '0 2px 8px rgba(0, 82, 204, 0.06)',
    xl: '0 4px 14px rgba(0, 82, 204, 0.08)',
    glass: '0 8px 32px rgba(0, 82, 204, 0.08)',
    glassHover: '0 12px 40px rgba(0, 82, 204, 0.12)',
  },
  
  breakpoints: {
    // Small phones
    xs: '320px',
    // Large phones / small tablets
    sm: '480px',
    // Tablets
    tablet: '768px',
    // Small laptops
    laptop: '1024px',
    // Desktop monitors
    desktop: '1280px',
    // Large monitors
    wide: '1440px',
    // Extra wide / TVs
    tv: '1920px',
    // Aliases for common use
    mobile: '480px',
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};
