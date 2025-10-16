import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export default function AdvancedLoadingScreen({ 
  text = "Loading...", 
  subtext,
  showLogo = true,
  variant = "default",
  progress,
  steps = [],
  currentStep = 0,
  showParticles = true,
  showWaveform = true
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [particles, setParticles] = useState([]);

  const variants = {
    default: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
    dark: "bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900",
    minimal: "bg-white",
    glassmorphism: "bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 backdrop-blur-xl"
  };

  // Animate progress
  useEffect(() => {
    if (progress !== undefined) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Generate particles
  useEffect(() => {
    if (showParticles) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5
      }));
      setParticles(newParticles);
    }
  }, [showParticles]);

  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center relative overflow-hidden", variants[variant])}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        {showParticles && particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animation: `float ${particle.duration}s ease-in-out infinite ${particle.delay}s`
            }}
          />
        ))}

        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        {/* Geometric Shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-blue-300/30 rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 border-2 border-purple-300/30 rounded-full animate-pulse-slow"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
        {/* Logo Section */}
        {showLogo && (
          <div className="mb-12 animate-fade-in-up">
            <div className="relative">
              <div className="text-7xl font-bold mb-6 animate-text-glow">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  uncommon
                </span>
              </div>
              <div className="text-2xl text-gray-600 font-medium mb-4">
                Attendance Management System
              </div>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-200"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce animation-delay-400"></div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Loading Animation */}
        <div className="mb-12 animate-fade-in-up animation-delay-500">
          <div className="relative">
            {/* Main Loader */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Outer Ring */}
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              {/* Spinning Ring */}
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-purple-600 rounded-full animate-spin"></div>
              {/* Inner Ring */}
              <div className="absolute inset-4 border-2 border-purple-200 rounded-full"></div>
              {/* Inner Spinning Ring */}
              <div className="absolute inset-4 border-2 border-transparent border-b-purple-600 border-l-pink-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              {/* Center Dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Waveform Animation */}
            {showWaveform && (
              <div className="flex justify-center items-end space-x-1 mb-6">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 30 + 10}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading Text */}
        <div className="animate-fade-in-up animation-delay-1000 mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            {text}
          </h2>
          {subtext && (
            <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
              {subtext}
            </p>
          )}
        </div>

        {/* Steps Progress */}
        {steps.length > 0 && (
          <div className="animate-fade-in-up animation-delay-1200 mb-8">
            <div className="flex justify-center items-center space-x-4 mb-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500",
                    index <= currentStep 
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" 
                      : "bg-gray-200 text-gray-500"
                  )}>
                    {index < currentStep ? "✓" : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-12 h-1 mx-2 rounded-full transition-all duration-500",
                      index < currentStep ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gray-200"
                    )} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {steps[currentStep] || "Processing..."}
            </p>
          </div>
        )}

        {/* Enhanced Progress Bar */}
        <div className="animate-fade-in-up animation-delay-1500">
          <div className="w-80 mx-auto">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              {progress !== undefined ? (
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${animatedProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-loading-bar"></div>
                </div>
              ) : (
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-loading-bar"></div>
              )}
            </div>
            {progress !== undefined && (
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-500">
                  {Math.round(animatedProgress)}% Complete
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {animatedProgress >= 100 ? "Almost ready!" : "Loading..."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Loading Tips */}
        <div className="animate-fade-in-up animation-delay-2000 mt-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Pro Tip</span>
            </div>
            <p className="text-sm text-gray-600">
              {progress < 30 ? "Initializing secure connection..." :
               progress < 60 ? "Loading your personalized dashboard..." :
               progress < 90 ? "Preparing attendance data..." :
               "Finalizing setup..."}
            </p>
          </div>
        </div>
      </div>

      {/* CSS for grid pattern */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}
