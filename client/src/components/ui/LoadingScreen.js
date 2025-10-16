//

export default function LoadingScreen({ 
  text = "Loading...", 
  subtext,
  showLogo = true,
  variant = "default",
  progress
}) {
  const variants = {
    default: "bg-gradient-to-br from-blue-50 to-white",
    dark: "bg-gradient-to-br from-gray-900 to-gray-800",
    minimal: "bg-white"
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${variants[variant]}`}>
      {/* Subtle Blue Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full filter blur-2xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 text-center">
        {/* Logo */}
        {showLogo && (
          <div className="mb-8 animate-fade-in-up">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              uncommon
            </div>
            <div className="text-xl text-gray-600 font-medium">
              Attendance Management System
            </div>
          </div>
        )}

        {/* Loading Animation */}
        <div className="mb-8 animate-fade-in-up animation-delay-500">
          <div className="relative w-28 h-28 mx-auto mb-4">
            {/* Core spinner */}
            <div className="absolute inset-3 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            {/* Outer orbit - clockwise */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.2s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-2 bg-blue-600 rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1.5 w-1.5 bg-blue-400 rounded-full"></div>
            </div>
            {/* Inner orbit - counter-clockwise */}
            <div className="absolute inset-6 animate-spin" style={{ animationDuration: '1.6s', animationDirection: 'reverse' }}>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1 w-1 bg-blue-300 rounded-full"></div>
            </div>
          </div>
          {/* Subtle pulse */}
          <div className="flex justify-center">
            <div className="h-2 w-24 bg-blue-100 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="animate-fade-in-up animation-delay-1000">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {text}
          </h2>
          {subtext && (
            <p className="text-gray-600 max-w-md mx-auto">
              {subtext}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-64 mx-auto animate-fade-in-up animation-delay-1500">
          <div className="relative bg-blue-100 rounded-full h-2 overflow-hidden">
            {progress !== undefined ? (
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            ) : (
              <>
                <div className="bg-blue-600 h-full rounded-full animate-loading-bar"></div>
                {/* Gentle sweep highlight */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_linear_infinite]"></div>
              </>
            )}
          </div>
          {progress !== undefined && (
            <div className="text-sm text-gray-500 mt-2">
              {Math.round(progress)}% Complete
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
