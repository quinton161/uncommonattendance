'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
// Removed old LoadingSpinner - using inline loading animation

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  if (user) {
    router.push(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      
      // Redirect will happen automatically via useAuth hook
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 animate-fade-in-up">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <svg 
              width="120" 
              height="32" 
              viewBox="0 0 174 32" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="animate-fade-in-up"
            >
              <text 
                x="0" 
                y="24" 
                fontFamily="Chillax, system-ui, -apple-system, sans-serif" 
                fontSize="24" 
                fontWeight="600" 
                fill="#0647a1"
              >
                uncommon
              </text>
            </svg>
          </div>
          <h1 className="font-chillax text-heading-lg text-black mb-2">
            Welcome Back
          </h1>
          <p className="font-avenir text-body-md text-gray-600">
            Sign in to your Uncommon attendance account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 animate-fade-in-up animation-delay-500" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4 card-hover">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-uncommon-blue focus:border-uncommon-blue transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-uncommon-blue focus:border-uncommon-blue transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-uncommon-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uncommon-blue disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </div>

          {/* Demo Accounts */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Demo Accounts</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <div><strong>Admin:</strong> admin@demo.com / password123</div>
              <div><strong>Student:</strong> student@demo.com / password123</div>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-medium text-uncommon-blue hover:text-blue-800 transition-colors duration-200">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
