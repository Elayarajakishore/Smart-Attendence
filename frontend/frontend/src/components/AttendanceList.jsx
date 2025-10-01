import React, { useEffect, useState } from 'react';
import axios from 'axios';

// School Timings: First half & Second half
const HOURS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:35",
  "14:25",
  "15:35"
];

function getWeekDates(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  const monday = new Date(date.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function getMonthDates(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return d.toISOString().slice(0, 10);
  });
}

function AttendanceList() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendanceByHour, setAttendanceByHour] = useState({});
  const [selectedHour, setSelectedHour] = useState(HOURS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAllHours = async () => {
      setLoading(true);
      setError('');
      const results = {};
      try {
        const staffRaw = localStorage.getItem('staff');
        let staff = null;
        if (staffRaw) staff = JSON.parse(staffRaw);

        // Build allowed rolls set per staff
        let allowedRolls = null;
        if (staff) {
          try {
            const studentsRes = await axios.get('http://localhost:8000/students_full');
            const cohort = studentsRes.data.filter(s => 
              s.specialization === staff.specialization &&
              s.department === staff.department &&
              s.section === staff.section &&
              String(s.batch) === String(staff.batch)
            );
            allowedRolls = new Set(cohort.map(s => s.roll));
          } catch (e) {
            // if failure, fall back to no filtering
            allowedRolls = null;
          }
        }

        await Promise.all(HOURS.map(async (hour) => {
          const res = await axios.get(`http://localhost:8000/attendance_by_hour?hour=${hour}&date=${date}`);
          let present = res.data.present || [];
          let absent = res.data.absent || [];
          if (allowedRolls) {
            present = present.filter(s => allowedRolls.has(s.roll));
            absent = absent.filter(s => allowedRolls.has(s.roll));
          }
          results[hour] = { present, absent };
        }));
        setAttendanceByHour(results);
      } catch (err) {
        setError('Failed to fetch attendance.');
      }
      setLoading(false);
    };
    fetchAllHours();
  }, [date]);

  const renderStudentCard = (student, color) => (
    <div
      key={student.roll}
      className={`flex items-center gap-3 bg-${color}-50 border border-${color}-200 rounded-xl shadow-sm p-3 mb-2 transition transform hover:scale-105`}
    >
      {student.photo_b64 ? (
        <img
          src={`data:image/jpeg;base64,${student.photo_b64}`}
          alt={student.name}
          className="w-12 h-12 rounded-full object-cover border border-gray-300"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border border-gray-300">?</div>
      )}
      <div>
        <div className={`font-semibold text-${color}-700`}>{student.name}</div>
        <div className="text-xs text-gray-500">{student.roll}</div>
      </div>
    </div>
  );

  const hourData = attendanceByHour[selectedHour] || { present: [], absent: [] };

  const exportCSVForDates = async (dates, label) => {
    let csv = 'Date';
    HOURS.forEach(hour => {
      csv += `,${hour} Present,${hour} Absent`;
    });
    csv += '\n';
    for (const d of dates) {
      csv += d;
      for (const hour of HOURS) {
        try {
          const res = await axios.get(`http://localhost:8000/attendance_by_hour?hour=${hour}&date=${d}`);
          let present = res.data.present || [];
          let absent = res.data.absent || [];
          const staffRaw = localStorage.getItem('staff');
          if (staffRaw) {
            const staff = JSON.parse(staffRaw);
            try {
              const studentsRes = await axios.get('http://localhost:8000/students_full');
              const cohort = studentsRes.data.filter(s => 
                s.specialization === staff.specialization &&
                s.department === staff.department &&
                s.section === staff.section &&
                String(s.batch) === String(staff.batch)
              );
              const allowedRolls = new Set(cohort.map(s => s.roll));
              present = present.filter(s => allowedRolls.has(s.roll));
              absent = absent.filter(s => allowedRolls.has(s.roll));
            } catch (e) {
              // ignore and keep unfiltered
            }
          }
          const presentRolls = present.map(s => s.roll).join(',');
          const absentRolls = absent.map(s => s.roll).join(',');
          csv += `,"${presentRolls}","${absentRolls}"`;
        } catch {
          csv += ',Error,Error';
        }
      }
      csv += '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${label.replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportWeek = () => exportCSVForDates(getWeekDates(date), `week_of_${getWeekDates(date)[0]}`);
  const exportMonth = () => exportCSVForDates(getMonthDates(date), `month_of_${date.slice(0,7)}`);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-5 text-red-700">Attendance by Date & Hour</h2>

      {/* Top Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="date" className="font-semibold">Select Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border rounded-l-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button 
          onClick={exportWeek}
          className="bg-purple-500 text-yellow-200 px-4 py-2 rounded-l-xl font-semibold hover:bg-blue-700 transition"
        >
          Export Week
        </button>
        <button 
          onClick={exportMonth}
          className="bg-purple-500 text-yellow-200 px-4 py-2 rounded-r-xl font-semibold hover:bg-blue-700 transition"
        >
          Export Month
        </button>
        {/* PDF export removed as requested */}
      </div>

      {/* Hour Buttons */}
      <div className="mb-5 flex flex-wrap gap-2 overflow-x-auto pb-1">
        {HOURS.map((hour, idx) => (
          <button
            key={hour}
            onClick={() => setSelectedHour(hour)}
            className={`
              px-4 py-2 font-semibold whitespace-nowrap transition-colors
              ${selectedHour === hour ? 'bg-pink-500 text-black' : 'bg-white text-green-500 border border-orange-400 hover:bg-blue-100'}
              ${idx === 0 ? 'rounded-l-xl' : idx === HOURS.length - 1 ? 'rounded-r-xl' : ''}
            `}
          >
            {hour}
          </button>
        ))}
      </div>

      {/* Attendance Lists */}
      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-pink-700 mb-3">Present</h3>
            {hourData.present.length === 0 && <div className="text-center text-gray-400">None</div>}
            {hourData.present.map(s => renderStudentCard(s, 'green'))}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-pink-700 mb-3">Absent</h3>
            {hourData.absent.length === 0 && <div className="text-center text-gray-400">None</div>}
            {hourData.absent.map(s => renderStudentCard(s, 'red'))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceList; 