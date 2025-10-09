/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'chillax': ['Chillax', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'chillax-semibold': ['Chillax', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'chillax-regular': ['Chillax', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'avenir': ['Chillax', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'heading-main': ['64px', { lineHeight: '64px' }],
        'heading-lg': ['48px', { lineHeight: '48px' }],
        'heading-md': ['32px', { lineHeight: '36px' }],
        'heading-sm': ['24px', { lineHeight: '28px' }],
        'body-lg': ['24px', { lineHeight: '36px' }],
        'body-md': ['18px', { lineHeight: '28px' }],
        'body-sm': ['16px', { lineHeight: '24px' }],
        'body-xs': ['14px', { lineHeight: '20px' }],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        'uncommon-blue': '#0647a1',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'text-glow': 'textGlow 2s ease-in-out infinite alternate',
        'loading-bar': 'loadingBar 2s ease-in-out infinite',
        'blob': 'blob 7s infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        textGlow: {
          '0%': {
            textShadow: '0 0 5px rgba(6, 71, 161, 0.5)'
          },
          '100%': {
            textShadow: '0 0 20px rgba(6, 71, 161, 0.8), 0 0 30px rgba(6, 71, 161, 0.6)'
          }
        },
        loadingBar: {
          '0%': {
            transform: 'translateX(-100%)'
          },
          '50%': {
            transform: 'translateX(0%)'
          },
          '100%': {
            transform: 'translateX(100%)'
          }
        },
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)'
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)'
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)'
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)'
          }
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)'
          },
          '50%': {
            transform: 'translateY(-20px)'
          }
        }
      },
      animationDelay: {
        '500': '500ms',
        '1000': '1000ms',
        '1500': '1500ms',
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
      },
    },
  },
  plugins: [],
};
