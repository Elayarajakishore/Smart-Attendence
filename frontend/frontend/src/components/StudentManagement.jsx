import React, { useEffect, useState } from 'react';
import axios from 'axios';

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ 
    name: '', 
    roll: '', 
    specialization: '', 
    department: '', 
    section: '', 
    batch: '', 
    phone: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:8000/students_full');
      const staffRaw = localStorage.getItem('staff');
      let filtered = res.data;
      if (staffRaw) {
        const staff = JSON.parse(staffRaw);
        filtered = res.data.filter((s) =>
          s.specialization === staff.specialization &&
          s.department === staff.department &&
          s.section === staff.section &&
          String(s.batch) === String(staff.batch)
        );
      }
      const sortedStudents = filtered.sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
      );
      setStudents(sortedStudents);

    } catch (err) {
      setError('Failed to fetch students.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const startEdit = (student) => {
    setEditId(student._id);
    setEditData({ 
      name: student.name, 
      roll: student.roll,
      specialization: student.specialization || '',
      department: student.department || '',
      section: student.section || '',
      batch: student.batch || '',
      phone: student.phone || ''
    });
    setSuccess('');
    setError('');
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({ 
      name: '', 
      roll: '', 
      specialization: '', 
      department: '', 
      section: '', 
      batch: '', 
      phone: '' 
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = async (student) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(`http://localhost:8000/students/${student._id}`, editData);
      setSuccess('Student updated.');
      setTimeout(() => {
        setSuccess('');
      }, 1000);
      setEditId(null);
      fetchStudents();
    } catch (err) {
      setError('Failed to update student.');
    }
    setLoading(false);
  };

  const deleteStudent = async (student) => {
    if (!window.confirm(`Delete student ${student.name} (${student.roll})?`)) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.delete(`http://localhost:8000/students/${student._id}`);
      setSuccess('Student deleted.');
      fetchStudents();
    } catch (err) {
      setError('Failed to delete student.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
            Student Management
          </h2>
        </div>
        {loading && (
          <div className="text-center py-2">
            <span className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2" />
            <span className="text-gray-600">Loading...</span>
          </div>
        )}
        {error && (
          <div className="text-center mb-4 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="text-center mb-4 px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200">
            {success}
          </div>
        )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {students.map((student) => (
          <div
            key={student._id}
            className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6 flex flex-col items-center border border-indigo-100 hover:shadow-xl transition-transform transform hover:scale-[1.02]"
          >
            {student.photo_b64 ? (
              <img
                src={`data:image/jpeg;base64,${student.photo_b64}`}
                alt={student.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow mb-3"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border-4 border-gray-300 mb-3 text-2xl font-bold shadow">
                ?
              </div>
            )}
            {editId === student._id ? (
              <div className="w-full space-y-3">
                <input
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                  placeholder="Name"
                />
                <input
                  name="roll"
                  value={editData.roll}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                  placeholder="Roll Number"
                />
                <select
                  name="specialization"
                  value={editData.specialization}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                >
                  <option value="">Select Specialization</option>
                  <option value="BTech">BTech</option>
                  <option value="BE">BE</option>
                  <option value="MTech">MTech</option>
                  <option value="BSc">BSc</option>
                  <option value="MSc">MSc</option>
                </select>
                <select
                  name="department"
                  value={editData.department}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                >
                  <option value="">Select Department</option>
                  <option value="IT">IT</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="E&I">E&I</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
                <select
                  name="section"
                  value={editData.section}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                >
                  <option value="">Select Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
                <select
                  name="batch"
                  value={editData.batch}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: 25 }, (_, i) => 2000 + i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <input
                  name="phone"
                  value={editData.phone}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                  placeholder="Phone (+919876543210)"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => saveEdit(student)}
                    className="flex-1 px-3 py-2 rounded-lg font-semibold shadow text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 px-3 py-2 rounded-lg font-semibold shadow border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="font-semibold text-xl text-indigo-700 mb-1">{student.name}</div>
                <div className="text-gray-600 text-sm mb-1">{student.roll}</div>
                <div className="text-gray-500 text-xs mb-2">
                  {student.specialization} • {student.department} • {student.section} • {student.batch}
                </div>
                {student.phone && (
                  <div className="text-gray-500 text-xs mb-3">{student.phone}</div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(student)}
                    className="px-3 py-1.5 rounded-lg font-semibold shadow text-white bg-indigo-600 hover:bg-indigo-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteStudent(student)}
                    className="px-3 py-1.5 rounded-lg font-semibold shadow text-white bg-pink-600 hover:bg-pink-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

export default StudentManagement;
