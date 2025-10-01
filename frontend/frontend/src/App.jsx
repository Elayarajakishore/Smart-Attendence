import React, { useState, useEffect } from 'react';

import StudentRegister from './components/StudentRegister';
import AttendanceCamera from './components/AttendanceCamera';
import AttendanceList from './components/AttendanceList';
import StudentManagement from './components/StudentManagement';
import Dashboard from './components/Dashboard';
import MediaAttendance from './components/MediaAttendance';
import StaffLogin from './components/StaffLogin';
import StaffSignup from './components/StaffSignup';

function App() {
  const [currentPage, setCurrentPage] = useState('Login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Check login status on mount
  useEffect(() => {
    // Always start at Login on fresh load
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentPage('Login');
  }, []);

  const renderPage = () => {
    if (!isLoggedIn) {
      if (currentPage === 'Login')
        return <StaffLogin setIsLoggedIn={setIsLoggedIn} setCurrentPage={setCurrentPage} />;
      if (currentPage === 'Signup')
        return <StaffSignup setCurrentPage={setCurrentPage} />;
      return <StaffLogin setIsLoggedIn={setIsLoggedIn} setCurrentPage={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'Register Student':
        return <StudentRegister />;
      case 'Mark Attendance':
        return <AttendanceCamera />;
      case 'Attendance List':
        return <AttendanceList />;
      case 'Student Management':
        return <StudentManagement />;
      case 'Dashboard':
        return <Dashboard setIsLoggedIn={setIsLoggedIn} setCurrentPage={setCurrentPage} />;
      case 'Media Attendance':
        return <MediaAttendance />;
      default:
        return <Dashboard setIsLoggedIn={setIsLoggedIn} setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Show navbar only if logged in */}
      {isLoggedIn && (
        <nav className="bg-white shadow-lg relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Left: Nav links */}
              <div className="flex space-x-8">
                {[
                  'Dashboard',
                  'Register Student',
                  'Mark Attendance',
                  'Media Attendance',
                  'Attendance List',
                  'Student Management',
                ].map((page) => (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); setShowProfile(false); }}
                    className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                      currentPage === page
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Right: Profile */}
              <div className="relative">
                {(() => {
                  let staff = null;
                  try { staff = JSON.parse(localStorage.getItem('staff')); } catch { staff = null; }
                  const initial = staff?.name ? staff.name.charAt(0).toUpperCase() : '?';
                  return (
                    <>
                      <button
                        onClick={() => setShowProfile((v) => !v)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50"
                      >
                        <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                          {initial}
                        </span>
                        <span className="hidden sm:block text-sm text-gray-700 max-w-[140px] truncate">
                          {staff?.name || 'Staff'}
                        </span>
                        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                      </button>

                      {showProfile && (
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-20">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">{initial}</div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{staff?.name || '—'}</div>
                              <div className="text-xs text-gray-500">{staff?.email || '—'}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                            <div className="bg-gray-50 rounded-lg p-2"><div className="text-gray-500">Specialization</div><div className="font-medium">{staff?.specialization || '—'}</div></div>
                            <div className="bg-gray-50 rounded-lg p-2"><div className="text-gray-500">Department</div><div className="font-medium">{staff?.department || '—'}</div></div>
                            <div className="bg-gray-50 rounded-lg p-2"><div className="text-gray-500">Section</div><div className="font-medium">{staff?.section || '—'}</div></div>
                            <div className="bg-gray-50 rounded-lg p-2"><div className="text-gray-500">Year</div><div className="font-medium">{staff?.batch || '—'}</div></div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
