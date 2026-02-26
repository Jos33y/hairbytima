// ==========================================================================
// Admin Login Page
// ==========================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import '@styles/admin-tokens.css';
import styles from '@styles/module/AdminLogin.module.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!formData.email || !formData.password) {
      setLocalError('Please enter both email and password');
      return;
    }

    if (!formData.email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/admin');
    }
  };

  const displayError = localError || error;

  return (
    <div className="admin">
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Logo */}
          <div className={styles.logoWrapper}>
            <img
              src="/logo512.png"
              alt="HairByTimaBlaq"
              className={styles.logo}
            />
          </div>

          {/* Login Card */}
          <div className={styles.card}>
            <div className={styles.header}>
              <h1 className={styles.title}>Admin Portal</h1>
              <p className={styles.subtitle}>Sign in to manage your store</p>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className={styles.errorAlert}>
                <AlertCircle size={18} strokeWidth={1.5} />
                <span>{displayError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Email Field */}
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} strokeWidth={1.5} className={styles.inputIcon} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@hairbytimablaq.com"
                    className={styles.input}
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} strokeWidth={1.5} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={styles.input}
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.5} />
                    ) : (
                      <Eye size={18} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className={styles.footer}>
              <a href="/" className={styles.backLink}>
                Back to Store
              </a>
            </div>
          </div>

          {/* Copyright */}
          <p className={styles.copyright}>
            {new Date().getFullYear()} HairByTimaBlaq. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage; 