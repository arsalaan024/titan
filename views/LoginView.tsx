
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        onLogin();
        navigate('/');
      } else {
        setError('Login incomplete. Please try again or contact support.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || err?.message
        || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 max-w-md w-full border border-gray-100 relative overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#800000]" />

        {/* Logo */}
        <div className="w-16 h-16 bg-[#800000] rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-6 shadow-xl">T</div>

        <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tighter uppercase text-center">Welcome Back</h2>
        <p className="text-gray-400 mb-8 text-sm font-medium text-center">Sign in to your Titan account</p>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
            <input
              type="email"
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 font-semibold outline-none focus:ring-0 focus:border-[#800000] text-gray-900 transition-all placeholder-gray-300"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Password</label>
            </div>
            <input
              type="password"
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 font-semibold outline-none focus:ring-0 focus:border-[#800000] text-gray-900 transition-all placeholder-gray-300"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isLoaded}
            className="w-full bg-[#800000] text-white font-black py-5 rounded-2xl hover:bg-[#6b0000] transition-all shadow-xl uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-gray-400 font-bold text-sm">
            New to Titan?{' '}
            <Link to="/register" className="text-[#800000] hover:underline font-black">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
