import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  UserRound,
  Stethoscope,
  LogIn
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { UserRole, ROLE_LABELS } from '../../config/roles';

const ROLE_OPTIONS: {
  role: UserRole;
  icon: React.ElementType;
  summary: string;
}[] = [
  {
    role: 'customer',
    icon: UserRound,
    summary: 'Dashboard, purchases and prescription validation'
  },
  {
    role: 'pharmacist',
    icon: Stethoscope,
    summary: 'Full access to every pharmacy page'
  }
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password, role);
    if (!result.success) {
      setError(result.error || 'Sign in failed.');
    }
  };

  const fillDemo = (demoRole: UserRole) => {
    const account = DEMO_ACCOUNTS.find(a => a.role === demoRole);
    if (!account) return;
    setRole(demoRole);
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Brand panel */}
      <div className="lg:w-5/12 bg-slate-900 text-white px-8 py-10 lg:p-14 flex flex-col justify-between gap-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-lg tracking-tight leading-tight">MediCore</p>
            <p className="text-xs text-slate-400">AI Smart Pharmacy</p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
            Safer dispensing starts with the right sign-in.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Pharmacists manage stock, sales and suppliers. Customers check prescriptions and
            follow their purchases. Pick your role to continue.
          </p>
        </div>

        <p className="hidden lg:block text-xs text-slate-500">
          Prototype build. Accounts are hardcoded for demo use.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:p-14">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1">Choose your role, then enter your details.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
            {/* Role selector */}
            <fieldset>
              <legend className="text-xs font-semibold text-slate-700 mb-2">I am a</legend>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(({ role: optionRole, icon: Icon, summary }) => {
                  const selected = role === optionRole;
                  return (
                    <label
                      key={optionRole}
                      className={`relative cursor-pointer rounded-xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
                        selected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={optionRole}
                        checked={selected}
                        onChange={() => {
                          setRole(optionRole);
                          setError('');
                        }}
                        className="sr-only"
                      />
                      <Icon
                        className={`w-5 h-5 ${selected ? 'text-blue-600' : 'text-slate-400'}`}
                      />
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          selected ? 'text-blue-700' : 'text-slate-800'
                        }`}
                      >
                        {ROLE_LABELS[optionRole]}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{summary}</p>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-3 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-10 pr-11 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-sm shadow-blue-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in as {ROLE_LABELS[role].toLowerCase()}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <p className="text-xs font-semibold text-slate-700">Demo accounts</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Select one to fill the form.</p>
            <div className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account.role)}
                  className="w-full text-left rounded-lg px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <p className="text-xs font-semibold text-slate-800">
                    {ROLE_LABELS[account.role]}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 break-all">
                    {account.email} / {account.password}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
