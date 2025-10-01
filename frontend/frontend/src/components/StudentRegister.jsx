import React, { useState, useRef } from 'react';
import axios from 'axios';

function StudentRegister() {
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [batch, setBatch] = useState('');
  const [phone, setPhone] = useState(''); // ✅ New phone field
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 5 - 2000 + 1 }, (_, i) => 2000 + i);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !roll || !specialization || !department || !section || !batch || !phone || !photo) {
      setMessage('All fields are required.');
      return;
    }

    // ✅ Validate phone number format (+countrycodeXXXXXXXXXX)
    if (!/^\+\d{10,15}$/.test(phone)) {
      setMessage('Enter a valid phone number with country code (e.g., +919876543210).');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('roll', roll);
    formData.append('specialization', specialization);
    formData.append('department', department);
    formData.append('section', section);
    formData.append('batch', batch);
    formData.append('phone', phone); // ✅ Added phone to formData
    formData.append('photo', photo);

    try {
      const res = await axios.post('http://localhost:8000/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(res.data.message || 'Student registered successfully!');

      // ✅ Reset form fields
      setName('');
      setRoll('');
      setSpecialization('');
      setDepartment('');
      setSection('');
      setBatch('');
      setPhone('');
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error registering student.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-indigo-100 p-8"
      >
        <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-6">
          Register Student
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
            <input
              type="text"
              placeholder="Enter Roll Number"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option value="">Select Specialization</option>
              <option value="BTech">BTech</option>
              <option value="BTech">BE</option>
              <option value="MTech">MTech</option>
              <option value="BSc">BSc</option>
              <option value="MSc">MSc</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option value="">Select Section</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch (Year)</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option value="">Select Batch</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (with country code)</label>
            <input
              type="text"
              placeholder="e.g., +919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Photo</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => setPhoto(e.target.files[0])}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-md transition-colors"
        >
          Register
        </button>

        {message && (
          <div
            className={`mt-4 text-center text-sm font-medium ${
              message.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default StudentRegister;
