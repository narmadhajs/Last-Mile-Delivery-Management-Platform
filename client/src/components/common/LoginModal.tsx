import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Building2, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRedirect: (role: 'CUSTOMER' | 'AGENT' | 'ADMIN') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessRedirect,
}) => {
  const { login, demoAccounts } = useAuth();
  const { showToast } = useToast();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('admin@delivery.com');
  const [password, setPassword] = useState('admin123');

  // Register Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'AGENT'>('CUSTOMER');
  const [companyName, setCompanyName] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Signed in as ${email}. Redirecting to role dashboard...`,
      });

      // Determine redirect role from email or state
      if (email.includes('admin')) {
        onSuccessRedirect('ADMIN');
      } else if (email.includes('agent')) {
        onSuccessRedirect('AGENT');
      } else {
        onSuccessRedirect('CUSTOMER');
      }
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Login Failed',
        message: err.message || 'Invalid email or password',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await authApi.register({
        email,
        password,
        name,
        phone,
        role,
        companyName: companyName || undefined,
      });

      if (res.success && res.data) {
        await login(email, password);
        showToast({
          type: 'success',
          title: 'Account Registered',
          message: `Welcome ${name}! Redirecting to your dashboard...`,
        });
        onSuccessRedirect(role);
        onClose();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Registration Failed',
        message: err.message || 'Could not register account',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string, demoRole: 'CUSTOMER' | 'AGENT' | 'ADMIN') => {
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      showToast({
        type: 'success',
        title: 'Signed in via Demo Account',
        message: `Redirected to ${demoRole} dashboard.`,
      });
      onSuccessRedirect(demoRole);
      onClose();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Login Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#111827] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-400 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isRegisterMode ? 'Create New LogiTrack Account' : 'Sign in to LogiTrack'}
              </h3>
              <p className="text-xs text-slate-400">
                {isRegisterMode ? 'Choose your role and register' : 'Authenticate to access role-specific dashboard'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Quick 1-Click Role Login Presets */}
          {!isRegisterMode && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                ⚡ Instant 1-Click Role Login:
              </label>
              <div className="grid grid-cols-2 gap-2">
                
                {/* Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin@delivery.com', 'admin123', 'ADMIN')}
                  className="p-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 text-left transition flex items-center gap-2.5 group"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">👑 Administrator</span>
                    <span className="text-[10px] text-indigo-300 font-mono">➔ /admin/dashboard</span>
                  </div>
                </button>

                {/* Delivery Agent */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('rajesh.agent@delivery.com', 'password123', 'AGENT')}
                  className="p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-left transition flex items-center gap-2.5 group"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">🛵 Delivery Agent</span>
                    <span className="text-[10px] text-emerald-300 font-mono">➔ /agent/dashboard</span>
                  </div>
                </button>

                {/* Customer B2C */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('john@example.com', 'password123', 'CUSTOMER')}
                  className="p-3 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/40 text-left transition flex items-center gap-2.5 group"
                >
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">👤 Customer (B2C)</span>
                    <span className="text-[10px] text-sky-300 font-mono">➔ /dashboard</span>
                  </div>
                </button>

                {/* Customer B2B */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('sarah.b2b@apexlogistics.com', 'password123', 'CUSTOMER')}
                  className="p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-left transition flex items-center gap-2.5 group"
                >
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">🏢 B2B Enterprise</span>
                    <span className="text-[10px] text-amber-300 font-mono">➔ /dashboard</span>
                  </div>
                </button>

              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[11px] uppercase font-bold text-slate-500">
              {isRegisterMode ? 'Registration Form' : 'Or Sign In with Credentials'}
            </span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4">
            
            {isRegisterMode && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Select Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('CUSTOMER')}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        role === 'CUSTOMER'
                          ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Customer (Retail / B2B)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('AGENT')}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        role === 'AGENT'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Delivery Partner
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                      placeholder="+91-9876543210"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Company (Optional)</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                placeholder="user@delivery.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <Lock className="w-3.5 h-3.5 text-brand-400" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span>Validating credentials...</span>
              ) : (
                <>
                  <span>{isRegisterMode ? 'Create Account & Sign In' : 'Sign In & Enter Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
            {isRegisterMode ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-brand-400 hover:underline font-bold"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Need a new account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="text-brand-400 hover:underline font-bold"
                >
                  Register Here
                </button>
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
