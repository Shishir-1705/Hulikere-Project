import React, { useState } from 'react';
import { AlertTriangle, Eye, Landmark, Lock, Shield, User } from 'lucide-react';
import { tr } from '../i18n/translations';
import { authenticateDemoUser, DEMO_USERS } from '../utils/storage';

export function LoginPage({
  lang = 'en',
  onChangeLang,
  onLoginSuccess,
  onOpenPublicReport,
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const session = authenticateDemoUser(username, password);
    if (!session) {
      setSubmitting(false);
      setError(tr(lang, 'loginInvalid'));
      return;
    }
    setError('');
    setTimeout(() => {
      setSubmitting(false);
      onLoginSuccess(session);
    }, 180);
  };

  const handleQuickFill = (account, autoLogin = false) => {
    setUsername(account.username);
    setPassword(account.password);
    setError('');
    if (autoLogin) {
      setSubmitting(true);
      const session = authenticateDemoUser(account.username, account.password);
      setTimeout(() => {
        setSubmitting(false);
        if (session) onLoginSuccess(session);
      }, 150);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-50 via-slate-50 to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Main Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-sky-900 text-white px-6 py-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                {onChangeLang && (
                  <div className="inline-flex rounded-lg bg-emerald-950/50 p-0.5 border border-white/20">
                    <button
                      type="button"
                      onClick={() => onChangeLang('en')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                        lang === 'en'
                          ? 'bg-white text-emerald-900'
                          : 'text-emerald-100 hover:text-white'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeLang('kn')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                        lang === 'kn'
                          ? 'bg-white text-emerald-900'
                          : 'text-emerald-100 hover:text-white'
                      }`}
                    >
                      ಕನ್ನಡ
                    </button>
                  </div>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-300 text-slate-900">
                  {tr(lang, 'sampleData')}
                </span>
              </div>
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              {tr(lang, 'appTitle')}
            </h1>
            <p className="text-xs text-emerald-100 mt-1">
              {tr(lang, 'appSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {tr(lang, 'loginUsernameLabel')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={tr(lang, 'loginUsernamePlaceholder')}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {tr(lang, 'loginPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tr(lang, 'loginPasswordPlaceholder')}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition disabled:opacity-70"
            >
              {submitting ? tr(lang, 'signingIn') : tr(lang, 'loginSignIn')}
            </button>
          </form>
        </div>

        {/* Visible Hardcoded Demo Credentials */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {tr(lang, 'loginDemoTitle')}
            </p>
            <span className="text-[11px] text-slate-400">
              {tr(lang, 'loginDemoHint')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEMO_USERS.map((account) => {
              const isAdmin = account.role === 'admin';
              return (
                <div
                  key={account.username}
                  className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 ${
                    isAdmin
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      {isAdmin ? (
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span className="text-xs font-bold text-slate-900">
                        {isAdmin
                          ? tr(lang, 'loginAdminLabel')
                          : tr(lang, 'loginViewerLabel')}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                      <p>
                        {tr(lang, 'loginUserPrefix')}{' '}
                        <code className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {account.username}
                        </code>
                      </p>
                      <p>
                        {tr(lang, 'loginPassPrefix')}{' '}
                        <code className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {account.password}
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickFill(account, false)}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition"
                    >
                      {tr(lang, 'loginFill')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill(account, true)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-white transition ${
                        isAdmin
                          ? 'bg-emerald-700 hover:bg-emerald-800'
                          : 'bg-sky-700 hover:bg-sky-800'
                      }`}
                    >
                      {tr(lang, 'loginQuickLogin')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {onOpenPublicReport && (
          <button
            type="button"
            onClick={onOpenPublicReport}
            className="w-full rounded-2xl border border-emerald-200 bg-white hover:bg-emerald-50/70 px-4 py-3 shadow-sm flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 transition"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>
              ಗ್ರಾಮದ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ • Public Problem Form (/report — No Login)
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
