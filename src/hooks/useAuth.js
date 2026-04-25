import { useState } from 'react';
import { checkPassword as _checkPassword } from '../utils/auth';
import { DEFAULT_PASSWORD } from '../utils/constants';

export const checkPassword = (typed) => _checkPassword(typed, DEFAULT_PASSWORD);

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('budget_authenticated') === 'true'
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAICopilot, setShowAICopilot] = useState(false);

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const handleLogout = () => {
    localStorage.removeItem('budget_authenticated');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated, setIsAuthenticated,
    showPasswordModal, setShowPasswordModal,
    showAICopilot, setShowAICopilot,
    isLocalhost,
    handleLogout,
  };
};
