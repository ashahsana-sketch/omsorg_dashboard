"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: string;
  name: string;
  role: string;
  location?: string;
  shiftStart?: string;
  shiftEnd?: string;
}

// Automatically calculate shift hours (e.g. 09:00 to 15:00 = 6 Hours)
function calculateHours(startTime: string = "09:00", endTime: string = "15:00"): number {
  const [startH] = startTime.split(":").map(Number);
  const [endH] = endTime.split(":").map(Number);

  if (endH >= startH) {
    return endH - startH;
  } else {
    return 24 - startH + endH;
  }
}

export default function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("Caregiver");
  const [location, setLocation] = useState("Stockholm");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("15:00");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Employees API
  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Save Employee
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSaving(true);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          location,
          shiftStart,
          shiftEnd,
        }),
      });

      if (res.ok) {
        setName("");
        setRole("Caregiver");
        setLocation("Stockholm");
        setShiftStart("09:00");
        setShiftEnd("15:00");
        await fetchEmployees(); // Auto refresh list
      }
    } catch (error) {
      console.error("Error saving employee:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // SABSE LATEST EMPLOYEE PEHLE DIKHAYEGA
  const latestEmployeesFirst = [...employees].reverse();

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <form onSubmit={handleSubmit} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
        <h4 className="text-sm font-bold text-stone-800">Add New Employee</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
              Employee Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anna Lindqvist"
              className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Caregiver">Caregiver</option>
              <option value="Nurse">Nurse</option>
              <option value="Supervisor">Supervisor</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Stockholm">Stockholm</option>
              <option value="Solna">Solna</option>
              <option value="Kista">Kista</option>
              <option value="Täby">Täby</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                End Time
              </label>
              <input
                type="time"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isSaving ? "Saving Employee..." : " Save Employee Details"}
        </button>
      </form>

      {/* Render Employees List */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-stone-800 border-b border-stone-100 pb-2">
          Employees List ({employees.length})
        </h4>

        {isLoading ? (
          <p className="text-xs text-stone-400 text-center py-4">Loading employees...</p>
        ) : latestEmployeesFirst.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-4">No employees added yet.</p>
        ) : (
          <div className="space-y-2.5 max-h-100px overflow-y-auto pr-1">
            {latestEmployeesFirst.map((emp) => {
              const start = emp.shiftStart || "09:00";
              const end = emp.shiftEnd || "15:00";
              const shiftHours = calculateHours(start, end);

              return (
                <div
                  key={emp.id}
                  className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-200 transition-colors"
                >
                  {/* Left Column */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800 text-sm">{emp.name}</span>
                      <span className="bg-stone-100 text-stone-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-stone-200">
                        {emp.role}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      📍 Location: <span className="font-medium text-stone-700">{emp.location || "Stockholm"}</span>
                    </p>
                  </div>

                  {/* Right Column (Time & Calculated Hours) */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-stone-100 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-stone-400 block text-[9px] uppercase font-bold">
                        Shift Time
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                        ⏰ {start} – {end}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-stone-400 block text-[9px] uppercase font-bold">
                        Working Hours
                      </span>
                      <span className="font-extrabold text-teal-700 text-xs block">
                        {shiftHours} Hours / Day
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}