import React, { useEffect, useState } from 'react';
import { checkSession } from '../../services/authService';
import PasswordModal from './PasswordModal';

const AccessGate = ({ children }) => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;

    const handleUnauthorized = () => {
      if (active) {
        setStatus('locked');
      }
    };

    window.addEventListener(
      'mds:unauthorized',
      handleUnauthorized
    );

    checkSession()
      .then((authenticated) => {
        if (active) {
          setStatus(authenticated ? 'authenticated' : 'locked');
        }
      })
      .catch(() => {
        if (active) {
          setStatus('locked');
        }
      });

    return () => {
      active = false;

      window.removeEventListener(
        'mds:unauthorized',
        handleUnauthorized
      );
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="app-loading" role="status">
        <div className="app-loading-card">
          <span className="app-loading-title">
            در حال بررسی دسترسی...
          </span>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <PasswordModal
        onAuthenticated={() => setStatus('authenticated')}
      />
    );
  }

  return children;
};

export default AccessGate;