import React, { useState } from 'react';
import axios from 'axios';

function StaffLogin({ setIsLoggedIn, setCurrentPage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('email', email);
      data.append('password', password);

      const res = await axios.post('http://localhost:8000/login_staff', data);
      const staff = res.data; // Backend returns staff info directly

      // Store staff info in localStorage for session management
      localStorage.setItem('staff', JSON.stringify(staff));
      localStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);

      // Fetch all students
      const studentsRes = await axios.get('http://localhost:8000/students');
      const students = studentsRes.data;

      // Filter students that exactly match staff
      const filtered = students.filter(
        (s) =>
          s.specialization === staff.specialization &&
          s.department === staff.department &&
          s.section === staff.section &&
          s.batch === staff.batch
      );

      // Persist filtered students and staff for other pages
      localStorage.setItem('filteredStudents', JSON.stringify(filtered));
      setCurrentPage('Dashboard');
      setMessage('Login successful!');
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Error logging in');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('email', resetEmail);
      
      const res = await axios.post('http://localhost:8000/forgot_password', data);
      setResetMessage(res.data.message);
    } catch (err) {
      setResetMessage(err.response?.data?.detail || 'Error sending reset request');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setResetMessage('Password must be at least 6 characters');
      return;
    }
    
    try {
      const data = new FormData();
      data.append('email', resetEmail);
      data.append('new_password', newPassword);
      
      const res = await axios.post('http://localhost:8000/reset_password', data);
      setResetMessage(res.data.message);
      setShowForgotPassword(false);
      setResetEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setResetMessage(err.response?.data?.detail || 'Error resetting password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-indigo-100 p-8"
      >
        <h2 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
          Staff Login
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-11 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-2.22-2.22A11.7 11.7 0 0 0 21.75 12c-1.2-2.79-4.97-7.5-9.75-7.5-1.7 0-3.24.56-4.55 1.42L3.53 2.47ZM12 7.5c3.91 0 7.07 3.42 8.17 5.5-.39.72-1.08 1.72-2.02 2.73l-2.1-2.1A3.75 3.75 0 0 0 9.37 9.95l-2-2A8.1 8.1 0 0 1 12 7.5Zm0 9a3.73 3.73 0 0 0 1.52-.32l-1.7-1.7a1.5 1.5 0 0 1-2-2l-1.7-1.7A3.75 3.75 0 0 0 12 16.5Z"/>
                    <path d="M12 19.5c-4.78 0-8.55-4.71-9.75-7.5.46-1.06 1.35-2.42 2.53-3.64l1.07 1.07A11.7 11.7 0 0 0 2.25 12c1.2 2.79 4.97 7.5 9.75 7.5 1.95 0 3.7-.73 5.15-1.82l-1.08-1.08A8.96 8.96 0 0 1 12 19.5Z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 4.5c4.78 0 8.55 4.71 9.75 7.5-1.2 2.79-4.97 7.5-9.75 7.5S3.45 14.79 2.25 12C3.45 9.21 7.22 4.5 12 4.5Zm0 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-1.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-md transition-colors"
        >
          Login
        </button>

        {message && (
          <p className="mt-4 text-center text-red-600 text-sm">{message}</p>
        )}

        <div className="mt-6 text-center text-gray-600 text-sm space-y-2">
          <p>
            Don't have an account?{' '}
            <span
              className="text-indigo-600 font-semibold cursor-pointer hover:underline"
              onClick={() => setCurrentPage('Signup')}
            >
              Signup
            </span>
          </p>
          <p>
            <span
              className="text-indigo-600 font-semibold cursor-pointer hover:underline"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </span>
          </p>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Reset Password
              </h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetMessage('');
                  setResetEmail('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-md transition-colors"
              >
                Reset Password
              </button>

              {resetMessage && (
                <p className={`text-center text-sm ${
                  resetMessage.includes('success') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resetMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffLogin;
