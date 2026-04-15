import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';
import '../assets/fonts/fonts.css';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: ${theme.fonts.primary};
    background: ${theme.colors.backgroundSecondary};
    color: ${theme.colors.textPrimary};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: relative;
  }

  #root {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
  }

  /* Uncommon dark card toasts (react-toastify) */
  .Toastify__toast-container {
    width: min(100vw - 24px, 420px);
    padding: 12px;
  }

  .Toastify__toast-container--top-center {
    top: max(16px, env(safe-area-inset-top, 0px));
  }

  @media (max-width: 768px) {
    .Toastify__toast-container--top-right {
      top: max(8px, env(safe-area-inset-top, 0px));
      right: max(8px, env(safe-area-inset-right, 0px));
      width: min(100vw - 16px, 420px);
    }
  }

  .Toastify__toast.uncommon-toast-outer {
    position: relative;
    padding: 0;
    min-height: 0;
    margin-bottom: 12px;
    border-radius: ${theme.borderRadius['3xl']};
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
    font-family: ${theme.fonts.primary};
  }

  .Toastify__toast--success.uncommon-toast-outer,
  .Toastify__toast--error.uncommon-toast-outer,
  .Toastify__toast--info.uncommon-toast-outer,
  .Toastify__toast--warning.uncommon-toast-outer {
    background: transparent !important;
  }

  .Toastify__toast.uncommon-toast-outer .Toastify__toast-body {
    padding: 0;
    margin: 0;
    width: 100%;
  }

  .Toastify__toast.uncommon-toast-outer .Toastify__close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 3;
    color: rgba(255, 255, 255, 0.7);
    opacity: 1;
  }

  .Toastify__toast.uncommon-toast-outer .Toastify__close-button:hover {
    color: ${theme.colors.white};
    background: rgba(255, 255, 255, 0.1);
    border-radius: ${theme.borderRadius.md};
  }

  .Toastify__toast.uncommon-toast-outer .Toastify__progress-bar {
    height: 3px;
    border-radius: 0 0 ${theme.borderRadius['3xl']} ${theme.borderRadius['3xl']};
  }

  .Toastify__toast--success.uncommon-toast-outer .Toastify__progress-bar {
    background: linear-gradient(90deg, ${theme.colors.success}, #4ade80);
    box-shadow: 0 0 12px rgba(39, 174, 96, 0.5);
  }

  .Toastify__toast--error.uncommon-toast-outer .Toastify__progress-bar {
    background: linear-gradient(90deg, ${theme.colors.danger}, #f87171);
    box-shadow: 0 0 12px rgba(231, 76, 60, 0.45);
  }

  .Toastify__toast--info.uncommon-toast-outer .Toastify__progress-bar {
    background: linear-gradient(90deg, ${theme.colors.primary}, #60a5fa);
    box-shadow: 0 0 12px rgba(0, 82, 204, 0.35);
  }

  .Toastify__toast--warning.uncommon-toast-outer .Toastify__progress-bar {
    background: linear-gradient(90deg, ${theme.colors.warning}, #fcd34d);
    box-shadow: 0 0 12px rgba(243, 156, 18, 0.4);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.fonts.heading};
    font-weight: ${theme.fontWeights.semibold};
    line-height: 1.2;
    margin-bottom: ${theme.spacing.sm};
  }

  h1 {
    font-size: ${theme.fontSizes['3xl']};
  }

  h2 {
    font-size: ${theme.fontSizes['2xl']};
  }

  h3 {
    font-size: ${theme.fontSizes.xl};
  }

  h4 {
    font-size: ${theme.fontSizes.lg};
  }

  h5 {
    font-size: ${theme.fontSizes.base};
  }

  h6 {
    font-size: ${theme.fontSizes.sm};
  }

  p {
    margin-bottom: ${theme.spacing.md};
  }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${theme.colors.primaryDark};
    }
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: inherit;
    transition: all 0.2s ease;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    outline: none;
    transition: all 0.2s ease;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.gray100};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.gray400};
    border-radius: ${theme.borderRadius.full};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.gray500};
  }

  /* Loading animation */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;
