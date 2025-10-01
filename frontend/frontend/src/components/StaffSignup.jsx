import React, { useState } from "react";
import axios from "axios";

function StaffSignup({ setCurrentPage }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    department: "",
    section: "",
    batch: ""
  });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const specializations = ["BE", "BTech", "BSc", "MSc"];
  const departments = ["CSE", "IT", "ECE", "EEE", "E&I", "MECH","CIVIL"];
  const sections = ["A", "B", "C", "D"];
  const years = Array.from({ length: 101 }, (_, i) => (2000 + i).toString());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(form).forEach(key => data.append(key, form[key]));
      const res = await axios.post("http://localhost:8000/signup_staff", data);

      setMessage(res.data.message);
      setCurrentPage("Login"); // redirect to login after signup
    } catch (err) {
      setMessage(err.response?.data?.detail || "Error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 p-10"
      >
        <h2 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Staff Signup
        </h2>
  
        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              placeholder="Enter Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
  
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              placeholder="you@example.com"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
  
          {/* Password */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 pr-11 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-purple-600 transition-colors"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-2.22-2.22A11.7 11.7 0 0 0 21.75 12c-1.2-2.79-4.97-7.5-9.75-7.5-1.7 0-3.24.56-4.55 1.42L3.53 2.47ZM12 7.5c3.91 0 7.07 3.42 8.17 5.5-.39.72-1.08 1.72-2.02 2.73l-2.1-2.1A3.75 3.75 0 0 0 9.37 9.95l-2-2A8.1 8.1 0 0 1 12 7.5Zm0 9a3.73 3.73 0 0 0 1.52-.32l-1.7-1.7a1.5 1.5 0 0 1-2-2l-1.7-1.7A3.75 3.75 0 0 0 12 16.5Z" />
                    <path d="M12 19.5c-4.78 0-8.55-4.71-9.75-7.5.46-1.06 1.35-2.42 2.53-3.64l1.07 1.07A11.7 11.7 0 0 0 2.25 12c1.2 2.79 4.97 7.5 9.75 7.5 1.95 0 3.7-.73 5.15-1.82l-1.08-1.08A8.96 8.96 0 0 1 12 19.5Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M12 4.5c4.78 0 8.55 4.71 9.75 7.5-1.2 2.79-4.97 7.5-9.75 7.5S3.45 14.79 2.25 12C3.45 9.21 7.22 4.5 12 4.5Zm0 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-1.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
  
          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <select
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select Specialization</option>
              {specializations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
  
          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
  
          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              name="section"
              value={form.section}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select Section</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
  
          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              name="batch"
              value={form.batch}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
  
        <button
          type="submit"
          className="mt-8 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-md transition-all duration-300"
        >
          Signup
        </button>
  
        {message && (
          <p className="mt-4 text-center text-red-600 text-sm">{message}</p>
        )}
  
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <span
            className="text-purple-600 font-semibold cursor-pointer hover:underline"
            onClick={() => setCurrentPage("Login")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}

export default StaffSignup;
