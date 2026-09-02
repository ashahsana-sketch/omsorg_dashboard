"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: string;
  name: string;
  role: string;
  maxHours: number;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [maxHours, setMaxHours] = useState(40);

  // Fetch employees when the page loads
  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data));
  }, []);

  // Submit new employee to API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !role) return;

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, maxHours: Number(maxHours) }),
    });

    if (res.ok) {
      const data = await res.json();
      setEmployees([...employees, data.employee]);
      setName("");
      setRole("");
      setMaxHours(40);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Add New Employee</h1>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Employee Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Erik Karlsson"
            className="w-full p-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Care Worker"
            className="w-full p-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Max Hours / Week</label>
          <input
            type="number"
            value={maxHours}
            onChange={(e) => setMaxHours(Number(e.target.value))}
            className="w-full p-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-amber-400 hover:bg-amber-500 text-stone-900 font-bold py-2 rounded-lg text-sm transition-colors shadow-sm"
        >
          Save to JSON
        </button>
      </form>

      {/* Saved List */}
      <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm">
        <h2 className="text-lg font-bold text-stone-800 mb-3">Saved Employees</h2>
        <ul className="divide-y divide-stone-100 text-sm">
          {employees.map((emp) => (
            <li key={emp.id} className="py-2 flex justify-between">
              <span className="font-medium text-stone-800">{emp.name} ({emp.role})</span>
              <span className="text-stone-500">{emp.maxHours} hrs/week</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}