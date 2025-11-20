
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import Loading from './Loading';

interface LoginProps {
    onClose?: () => void;
}

const Login: React.FC<LoginProps> = ({ onClose }) => {
  const { t, isRTL } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient'>('doctor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
        setError("Backend database not configured. Please setup .env file.");
        return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Crucial: Redirect to the current domain, not localhost default
            emailRedirectTo: window.location.origin, 
            data: {
              full_name: fullName,
              role: role,
            }
          }
        });

        if (error) throw error;

        if (data.session) {
           // Auto-login successful (Email confirmation is disabled in Supabase)
           setSuccess("Account created and logged in!");
           setTimeout(() => {
               if (onClose) onClose();
           }, 1500);
        } else if (data.user) {
           // Email confirmation is required by Supabase settings
           setSuccess(t.auth.successSignup + " (Please check your email to confirm)");
           setIsSignUp(false);
        }
      } else {
        // Sign In Logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Login successful, modal will close via AuthContext listener in App.tsx
      }
    } catch (err: any) {
        setError(err.message || t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
             <Loading />
          </div>
        )}

        {onClose && (
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-20"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
        )}
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-2">
            Diet<span className="text-[var(--color-primary-light)]">Nova</span>
          </h1>
          <h2 className="text-xl font-semibold text-gray-700">
            {isSignUp ? t.auth.signupTitle : t.auth.loginTitle}
          </h2>
        </div>

        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">{error}</div>}
        {success && <div className="bg-green-100 text-green-600 p-3 rounded-lg mb-4 text-sm border border-green-200">{success}</div>}
        
        {!isSupabaseConfigured && (
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg mb-4 text-xs border border-yellow-200">
                <b>Demo Mode:</b> Database is not connected. Logins are disabled.
            </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.fullName}</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.email}</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              required
            />
          </div>

          {isSignUp && (
             <div className="animate-fade-in">
               <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.role}</label>
               <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={() => setRole('doctor')}
                   className={`flex-1 py-2 rounded-lg border transition ${role === 'doctor' ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-50 text-gray-600'}`}
                 >
                   {t.auth.doctor}
                 </button>
                 <button
                   type="button"
                   onClick={() => setRole('patient')}
                   className={`flex-1 py-2 rounded-lg border transition ${role === 'patient' ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-50 text-gray-600'}`}
                 >
                   {t.auth.patient}
                 </button>
               </div>
             </div>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white p-3 rounded-lg font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isSignUp ? t.auth.submitSignup : t.auth.submitLogin}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
            }}
            className="text-[var(--color-primary)] hover:underline text-sm font-medium"
          >
            {isSignUp ? t.auth.switchLogin : t.auth.switchSignup}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
