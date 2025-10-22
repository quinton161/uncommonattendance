import React from 'react';

interface IconProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

// Simple SVG icons to avoid React Icons TypeScript issues
export const DashboardIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
);

export const EventIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

export const PeopleIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-2.99 4v7h2v7h4zm-7.5-10.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9.5C9 8.12 8.12 7 6.5 7S4 8.12 4 9.5V15H5.5v7h2z"/>
  </svg>
);


export const PersonIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
  </svg>
);

export const AddIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);

export const TrendingUpIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
);

export const EventAvailableIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M16.53 11.06L15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
  </svg>
);

export const GroupIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-2.99 4v7h2v7h4zm-7.5-10.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9.5C9 8.12 8.12 7 6.5 7S4 8.12 4 9.5V15H5.5v7h2z"/>
  </svg>
);

export const TodayIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
  </svg>
);

export const ScheduleIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
  </svg>
);

export const LocationOnIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

export const AssignmentIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

export const BarChartIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
  </svg>
);

export const LoginIcon: React.FC<IconProps> = ({ size = 24, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
  </svg>
);
