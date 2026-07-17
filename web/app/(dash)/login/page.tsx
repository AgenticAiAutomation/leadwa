'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = 'https://api.leadwa.co/auth/google/login';
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.leadwa.co/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }

      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-headline text-4xl font-bold text-ink mb-2">
            <a href="/">Leadwa</a>
          </h1>
          <p className="text-ink/70">Save &amp; track your WhatsApp links</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-ink mb-6">Login to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-terracotta/10 border border-terracotta/20 rounded text-terracotta text-sm">
              {error}
            </div>
          )}

          {!showEmailPassword ? (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-ink/20 text-ink py-3 px-6 rounded-lg font-semibold hover:bg-ink/5 transition flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-ink/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-ink/60">Or</span>
                </div>
              </div>

              <button
                onClick={() => setShowEmailPassword(true)}
                className="w-full bg-ink/5 text-ink py-3 px-6 rounded-lg font-semibold hover:bg-ink/10 transition"
              >
                Continue with email
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-bottle-green"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-bottle-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-bottle-green-light transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => setShowEmailPassword(false)}
                className="w-full text-ink/60 text-sm hover:text-ink transition"
              >
                ← Back to Google login
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-ink/60">
            Don&rsquo;t have an account?{' '}
            <a href="/signup" className="text-bottle-green font-semibold hover:underline">
              Sign up
            </a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-ink/60 hover:text-ink transition text-sm">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
