"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: string;
  name: string;
  role: string;
  maxHours: number;
  location: string;
}

export default function EmployeeManagerForm() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [maxHours, setMaxHours] = useState(40);
  const [location, setLocation] = useState("Stockholm"); // Default location

  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch(() => setEmployees([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, maxHours: Number(maxHours), location }),
    });

    if (res.ok) {
      const data = await res.json();
      setEmployees([...employees, data.employee]);
      setName("");
      setRole("");
      setMaxHours(40);
      setLocation("Stockholm");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm space-y-4 h-fit"
      >
        <h3 className="text-base font-bold text-stone-800 border-b border-amber-100 pb-2">
          Add New Employee
        </h3>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
            Employee Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Anna Svensson"
            className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
            Role
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Care Worker"
            className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
            Max Hours / Week
          </label>
          <input
            type="number"
            value={maxHours}
            onChange={(e) => setMaxHours(Number(e.target.value))}
            className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
<div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Location / Service Area
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              <option value="Stockholm">Stockholm</option>
              <option value="Solna">Solna</option>
              <option value="Kista">Kista</option>
              <option value="Täby">Täby</option>
              <option value="Södertälje">Södertälje</option>
              <option value="Hanninge">Hanninge</option>
              <option value="Nacka ">Nacka</option>
            </select>
        </div>
        <button
          type="submit"
          className="w-full bg-amber-400 hover:bg-amber-500 text-stone-900 font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
        >
          Save to JSON
        </button>
      </form>

      {/* Saved Employees List */}
      <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-stone-800 border-b border-amber-100 pb-2">
          Saved Employees ({employees.length})
        </h3>

        {employees.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">
            No employees saved yet. Add your first employee using the form.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 text-xs space-y-2">
            {employees.map((emp) => (
              <li key={emp.id} className="pt-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-800">{emp.name}</div>
                  <div className="text-[11px] text-stone-500">{emp.role}</div>
                </div>
                <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-1 rounded text-[11px] font-bold">
                  {emp.maxHours}h / wk
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}