export const theme = {
  colors: {
    // Uncommon.org Brand Colors
    primary: '#0647a1',        // Uncommon blue
    primaryLight: '#1976d2',   // Lighter blue
    primaryDark: '#01579b',    // Darker blue
    
    // Secondary colors
    secondary: '#2c3e50', // Dark blue-gray
    secondaryDark: '#1a252f', // Darker blue-gray
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
    gray50: '#f8f9fa',
    gray100: '#ecf0f1',
    gray200: '#d5dbdb',
    gray300: '#bdc3c7',
    gray400: '#95a5a6',
    gray500: '#7f8c8d',
    gray600: '#6c7b7d',
    gray700: '#566061',
    gray800: '#34495e',
    gray900: '#2c3e50',
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    surface: '#ffffff',
    
    // Text colors
    textPrimary: '#2c3e50',
    textSecondary: '#7f8c8d',
    textLight: '#95a5a6',
  },
  
  fonts: {
    primary: '"Chillax", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    heading: '"Chillax", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
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
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
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
