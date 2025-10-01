import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard({ setIsLoggedIn, setCurrentPage }) {
  const [total, setTotal] = useState(0);
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(null);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('staff');
    setIsLoggedIn(false);
    setCurrentPage('Login');
  };

  const getCurrentHour = () => {
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, '0') + ':00';
    console.log(`Current hour: ${hour}`);
    return hour;
  };

  const getCurrentDate = () => {
    const today = new Date().toISOString().slice(0, 10);
    console.log(`Current date: ${today}`);
    return today;
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const today = getCurrentDate();
      const currentHour = getCurrentHour();
      
      console.log(`Fetching dashboard data for ${today} at ${currentHour}`);
      
      const studentsRes = await axios.get('http://localhost:8000/students_full');
      const staffRaw = localStorage.getItem('staff');
      let filteredStudents = studentsRes.data;
      if (staffRaw) {
        const staff = JSON.parse(staffRaw);
        filteredStudents = studentsRes.data.filter((s) =>
          s.specialization === staff.specialization &&
          s.department === staff.department &&
          s.section === staff.section &&
          String(s.batch) === String(staff.batch)
        );
      }
      setTotal(filteredStudents.length);
      const filteredRolls = new Set(filteredStudents.map(s => s.roll));
      
      const attendanceUrl = `http://localhost:8000/attendance_by_hour?hour=${currentHour}&date=${today}`;
      console.log(`Calling API: ${attendanceUrl}`);
      
      const attRes = await axios.get(attendanceUrl);
      const presentFiltered = (attRes.data.present || []).filter(s => filteredRolls.has(s.roll));
      const absentFiltered = (attRes.data.absent || []).filter(s => filteredRolls.has(s.roll));
      setPresent(presentFiltered.length);
      setAbsent(absentFiltered.length);
      
      setLastUpdated(new Date());
      console.log(`Dashboard updated for ${today} at ${currentHour}: ${attRes.data.present.length} present, ${attRes.data.absent.length} absent`);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to fetch dashboard data.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    const dataInterval = setInterval(() => {
      fetchData();
    }, 300000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-red-700">Dashboard</h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-700">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(currentTime)}
              </div>
              {lastUpdated && (
                <div className="text-xs text-gray-400 mt-1">
                  Last updated: {formatTime(lastUpdated)}
                </div>
              )}
            </div>
            {/* ✅ Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <div className="mt-2 text-gray-600">Loading dashboard data...</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 font-semibold">Error:</div>
              <div className="text-red-600 ml-2">{error}</div>
              <button 
                onClick={handleRefresh}
                className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white border border-blue-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-blue-700">{total}</div>
                <div className="text-lg font-semibold text-blue-600 mt-2">Total Students</div>
              </div>
              <div className="text-blue-400">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-green-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-green-700">{present}</div>
                <div className="text-lg font-semibold text-green-600 mt-2">Present</div>
                <div className="text-sm text-gray-500">Current Hour ({getCurrentHour()})</div>
                <div className="text-xs text-gray-400">Date: {getCurrentDate()}</div>
              </div>
              <div className="text-green-400">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-red-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-red-700">{absent}</div>
                <div className="text-lg font-semibold text-red-600 mt-2">Absent</div>
                <div className="text-sm text-gray-500">Current Hour ({getCurrentHour()})</div>
                <div className="text-xs text-gray-400">Date: {getCurrentDate()}</div>
              </div>
              <div className="text-red-400">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Quick Actions</h3>
            <button 
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {total > 0 ? Math.round((present / total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {present}
              </div>
              <div className="text-sm text-gray-600">Present Today</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {absent}
              </div>
              <div className="text-sm text-gray-600">Absent Today</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {getCurrentHour()}
              </div>
              <div className="text-sm text-gray-600">Current Hour</div>
              <div className="text-xs text-gray-400">{getCurrentDate()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
