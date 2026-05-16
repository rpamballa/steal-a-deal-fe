import React, {useState} from 'react';

import {api, setAuthToken, type UserRole} from '../api';
import {toUserMessage} from '../lib/userMessage';

type Mode = 'signin' | 'register';

type Props = {
  onAuthenticated: () => void;
  onCancel?: () => void;
  sessionExpired?: boolean;
  reason?: string | null;
};

const demoAccounts = [
  {label: 'Buyer', email: 'jordan@example.com', password: 'Buyer123!'},
  {label: 'Dealer', email: 'dealer1@stealadeal.local', password: 'Dealer123!'},
  {label: 'Admin', email: 'admin@stealadeal.local', password: 'Admin123!'},
];

export function AuthScreen({
  onAuthenticated,
  onCancel,
  sessionExpired,
  reason,
}: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('BUYER');
  const [dealerId, setDealerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const fieldErrors = {
    email: email.trim().length === 0 ? 'Email is required' : null,
    password:
      password.length === 0
        ? 'Password is required'
        : mode === 'register' && password.length < 8
          ? 'Use at least 8 characters'
          : null,
    displayName:
      mode === 'register' && displayName.trim().length === 0
        ? 'Your name is required'
        : null,
  };

  async function submit() {
    setError(null);
    if (
      fieldErrors.email ||
      fieldErrors.password ||
      (mode === 'register' && fieldErrors.displayName)
    ) {
      setError('Please fix the highlighted fields.');
      return;
    }
    setPending(true);
    try {
      if (mode === 'signin') {
        const auth = await api.login({email: email.trim(), password});
        setAuthToken(auth.token);
      } else {
        const parsedDealer = Number(dealerId);
        const auth = await api.registerAccount({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          role,
          ...(role === 'DEALER' &&
          Number.isFinite(parsedDealer) &&
          parsedDealer > 0
            ? {dealerId: parsedDealer}
            : {}),
        });
        setAuthToken(auth.token);
      }
      onAuthenticated();
    } catch (caught) {
      setError(toUserMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function useDemo(account: (typeof demoAccounts)[number]) {
    setError(null);
    setPending(true);
    try {
      const auth = await api.login({
        email: account.email,
        password: account.password,
      });
      setAuthToken(auth.token);
      onAuthenticated();
    } catch (caught) {
      setError(toUserMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen-card">
        <p className="brand-kicker">Steal A Deal</p>
        <h1 className="auth-screen-title">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="auth-screen-sub">
          {reason
            ? reason
            : mode === 'signin'
              ? 'Sign in to track your purchase and saved cars.'
              : 'Get started buying or selling on Steal A Deal.'}
        </p>

        {sessionExpired ? (
          <div className="notice error" role="alert">
            Your session expired. Please sign in again.
          </div>
        ) : null}

        <form
          className="auth-form"
          onSubmit={event => {
            event.preventDefault();
            submit();
          }}>
          {mode === 'register' ? (
            <label className="field">
              <span>Full name</span>
              <input
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.displayName)}
              />
              {fieldErrors.displayName ? (
                <span className="field-error">{fieldErrors.displayName}</span>
              ) : null}
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email ? (
              <span className="field-error">{fieldErrors.email}</span>
            ) : null}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password ? (
              <span className="field-error">{fieldErrors.password}</span>
            ) : null}
          </label>

          {mode === 'register' ? (
            <>
              <label className="field">
                <span>I am a</span>
                <select
                  value={role}
                  onChange={event => setRole(event.target.value as UserRole)}>
                  <option value="BUYER">Car buyer</option>
                  <option value="DEALER">Dealer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              {role === 'DEALER' ? (
                <label className="field">
                  <span>Dealer ID</span>
                  <input
                    type="number"
                    min={1}
                    value={dealerId}
                    onChange={event => setDealerId(event.target.value)}
                  />
                </label>
              ) : null}
            </>
          ) : null}

          {error ? (
            <div className="notice error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="primary-button"
            disabled={pending}>
            {pending
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          className="auth-link"
          onClick={() => {
            setMode(mode === 'signin' ? 'register' : 'signin');
            setError(null);
          }}>
          {mode === 'signin'
            ? "New here? Create an account"
            : 'Already have an account? Sign in'}
        </button>

        {onCancel ? (
          <button
            type="button"
            className="auth-link auth-cancel"
            onClick={onCancel}>
            ← Keep browsing without an account
          </button>
        ) : null}

        <div className="auth-demo">
          <button
            type="button"
            className="auth-link"
            onClick={() => setShowDemo(value => !value)}>
            {showDemo ? 'Hide demo accounts' : 'Explore with a demo account'}
          </button>
          {showDemo ? (
            <div className="auth-demo-list">
              {demoAccounts.map(account => (
                <button
                  key={account.email}
                  type="button"
                  className="secondary-button"
                  disabled={pending}
                  onClick={() => useDemo(account)}>
                  {account.label} demo
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
