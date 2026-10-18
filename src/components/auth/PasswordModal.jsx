import React, { useState } from 'react';
import { loginWithPassword } from '../../services/authService';
import './PasswordModal.css';

const PasswordModal = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || !password) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await loginWithPassword(password);

      if (result.authenticated !== true) {
        throw new Error('تأیید دسترسی انجام نشد.');
      }

      setPassword('');
      onAuthenticated();
    } catch (err) {
      setError(
        err.message || 'خطا در بررسی رمز عبور.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="access-overlay" dir="rtl">
      <div
        className="access-modal glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-modal-title"
        aria-describedby="access-modal-description"
      >
        <div className="access-modal-header">
          <div className="access-modal-icon" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2"
              />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </div>

          <h1
            className="access-modal-title"
            id="access-modal-title"
          >
            سلام!
          </h1>

          <p
            className="access-modal-description"
            id="access-modal-description"
          >
            برای مشاهده داشبورد، رمز عبور داده شده را وارد کنید.
          </p>
        </div>

        <form
          className="access-modal-form"
          onSubmit={handleSubmit}
        >
          <div className="access-modal-field">
            <label htmlFor="access-password">
              رمز عبور
            </label>

            <input
              id="access-password"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={128}
              autoFocus
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              disabled={submitting}
              placeholder="رمز عبور را وارد کنید"
              aria-invalid={Boolean(error)}
              aria-describedby={
                error ? 'access-password-error' : undefined
              }
            />
          </div>

          {error && (
            <p
              id="access-password-error"
              className="access-modal-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="access-modal-submit blue-glass"
            disabled={submitting || !password}
          >
            {submitting
              ? 'در حال بررسی...'
              : 'ورود به داشبورد'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;