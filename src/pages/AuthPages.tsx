import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useSeo } from '../hooks/useSeo';
import type { CartItem, UserProfile } from '../types';

export function LoginPage() {
  const { setCustomerSession, navigate, notify } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useSeo({
    title: 'Sign In to Your Account | BOOK HUB',
    description: 'Sign in to your BOOK HUB customer account to manage orders and your saved wishlist.',
    path: '/login',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        token?: string;
        user?: UserProfile;
        cart?: CartItem[];
        error?: string;
      };
      if (!res.ok || !data.token || !data.user) {
        notify(data.error || 'Invalid email or password.', 'error');
        return;
      }
      setCustomerSession(data.token, data.user, data.cart);
      notify(`Welcome back, ${data.user.name}!`, 'success');
      navigate('/account');
    } catch {
      notify('Unable to sign in right now.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-[#E2E7EE] bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-[#173B67]">Sign In</h1>
        <p className="mt-2 text-sm text-[#526071]">
          Access your saved cart, wishlist, and order tracking.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[#202A36] mb-1.5">
              Email Address
            </label>
            <div className="flex items-center rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2.5 focus-within:border-[#173B67] focus-within:bg-white">
              <Mail className="h-4 w-4 text-[#526071] shrink-0" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent pl-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-[#202A36]">
                Password
              </label>
              <a
                href="/forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/forgot-password');
                }}
                className="text-xs font-medium text-[#173B67] hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <div className="flex items-center rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2.5 focus-within:border-[#173B67] focus-within:bg-white">
              <Lock className="h-4 w-4 text-[#526071] shrink-0" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-transparent pl-2.5 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-[#526071] hover:text-[#202A36]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#173B67] px-5 py-3 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#526071]">
          New to BOOK HUB?{' '}
          <a
            href="/register"
            onClick={(e) => {
              e.preventDefault();
              navigate('/register');
            }}
            className="font-semibold text-[#173B67] hover:underline"
          >
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { setCustomerSession, navigate, notify } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useSeo({
    title: 'Create Customer Account | BOOK HUB',
    description: 'Register for a free BOOK HUB account to track orders, save books to your wishlist, and speed up checkout.',
    path: '/register',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as {
        token?: string;
        user?: UserProfile;
        error?: string;
      };
      if (!res.ok || !data.token || !data.user) {
        notify(data.error || 'Could not create account.', 'error');
        return;
      }
      setCustomerSession(data.token, data.user, []);
      notify('Account created! Welcome to BOOK HUB.', 'success');
      navigate('/account');
    } catch {
      notify('Network error during registration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-[#E2E7EE] bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-[#173B67]">Create Account</h1>
        <p className="mt-2 text-sm text-[#526071]">
          Join BOOK HUB to save your wishlist and track deliveries nationwide.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-semibold text-[#202A36] mb-1.5">
              Full Name *
            </label>
            <div className="flex items-center rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3 py-2.5 focus-within:border-[#173B67] focus-within:bg-white">
              <User className="h-4 w-4 text-[#526071] shrink-0" aria-hidden="true" />
              <input
                id="reg-name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hamza Tariq"
                className="w-full bg-transparent pl-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold text-[#202A36] mb-1.5">
              Email Address *
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hamza@example.com"
              className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-semibold text-[#202A36] mb-1.5">
              Password (minimum 8 characters) *
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#173B67] px-5 py-3 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#526071]">
          Already registered?{' '}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            className="font-semibold text-[#173B67] hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { navigate, notify } = useStore();
  const [email, setEmail] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useSeo({
    title: 'Reset Password | BOOK HUB',
    description: 'Request a password reset for your BOOK HUB customer account.',
    path: '/forgot-password',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        notify(data.error || 'Could not process request.', 'error');
        return;
      }
      setSubmittedMsg(data.message || 'Password reset request processed.');
    } catch {
      notify('Network error while requesting password reset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-[#E2E7EE] bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-[#173B67]">Forgot Password</h1>
        <p className="mt-2 text-sm text-[#526071]">
          Enter the email associated with your BOOK HUB account to request a reset.
        </p>

        {submittedMsg ? (
          <div className="mt-6 rounded-xl bg-[#F7F8FA] p-4 text-sm text-[#202A36]">
            {submittedMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-xs font-semibold text-[#202A36] mb-1.5">
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#E2E7EE] bg-[#F7F8FA] px-3.5 py-2.5 text-sm focus:border-[#173B67] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#173B67] px-5 py-3 text-sm font-semibold text-white hover:bg-[#102B4B] disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Request Reset'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            className="font-semibold text-[#173B67] hover:underline"
          >
            Back to Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
