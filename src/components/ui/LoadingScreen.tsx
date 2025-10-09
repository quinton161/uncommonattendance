'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-uncommon-blue rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 text-center">
        {/* Animated Logo Container */}
        <div className="mb-8 relative flex items-center justify-center">
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Pulsing Rings */}
            <div className="absolute inset-0 rounded-full border-4 border-uncommon-blue opacity-20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-2 border-uncommon-blue opacity-40 animate-pulse"></div>
            
            {/* Logo Container - Centered */}
            <div className="relative z-10 flex items-center justify-center">
              <svg 
                width="240" 
                height="64" 
                viewBox="0 0 240 64" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="animate-fade-in-up"
              >
                <text 
                  x="50%" 
                  y="40" 
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Chillax, system-ui, -apple-system, sans-serif" 
                  fontSize="24" 
                  fontWeight="600" 
                  fill="#0647a1"
                  className="animate-text-glow"
                >
                  uncommon
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-uncommon-blue animate-fade-in-up animation-delay-500">
            Loading
          </h2>
          <p className="text-gray-600 animate-fade-in-up animation-delay-1000">
            Please wait{dots}
          </p>
        </div>

        {/* Loading Bar */}
        <div className="mt-8 w-64 mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-uncommon-blue to-blue-400 h-full rounded-full animate-loading-bar"></div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-10 -left-10 w-4 h-4 bg-uncommon-blue rounded-full animate-float"></div>
        <div className="absolute -top-5 right-10 w-3 h-3 bg-blue-400 rounded-full animate-float animation-delay-1000"></div>
        <div className="absolute -bottom-8 left-5 w-5 h-5 bg-blue-300 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute -bottom-5 -right-8 w-2 h-2 bg-uncommon-blue rounded-full animate-float animation-delay-3000"></div>
      </div>
    </div>
  );
}
