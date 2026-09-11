"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  name: string;
  role: string;
  location: string;
  isFixedTime: boolean;
  shiftStart?: string;
  shiftEnd?: string;
  maxHours: number;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<"directory" | "add">("directory");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [role, setRole] = useState("Care Assistant");
  const [location, setLocation] = useState("Stockholm");
  const [scheduleType, setScheduleType] = useState<"fixed" | "flexible">("fixed");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("15:00");
  const [maxHours, setMaxHours] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "directory") {
      fetchEmployees();
    }
  }, [currentView]);

  const handleDelete = async (id: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to delete ${employeeName}?`)) return;

    try {
      const res = await fetch(`/api/employees?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      } else {
        alert("Failed to delete employee.");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Network Error: Could not delete employee.");
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter Employee Name first!");
      return;
    }

    const isFixed = scheduleType === "fixed";
    const payload = {
      name,
      role,
      location,
      isFixedTime: isFixed,
      shiftStart: isFixed ? shiftStart : null,
      shiftEnd: isFixed ? shiftEnd : null,
      maxHours: Number(maxHours),
    };

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setName("");
        setRole("Care Assistant");
        setLocation("Stockholm");
        setScheduleType("fixed");
        setCurrentView("directory");
      } else {
        alert("API Error: Data save nahi ho saka.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Network Error: API connect nahi ho saki.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* ADD EMPLOYEE VIEW */}
      {currentView === "add" ? (
        <div className="max-w-xl mx-auto space-y-4">
          {/* Main Page Button */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm border border-slate-200"
          >
            ← Go to Main Page
          </button>

          <form
            onSubmit={handleSaveEmployee}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <h3 className="text-base font-bold text-teal-700 border-b border-slate-200 rounded-2xl bg-slate-50 p-2.5 text-center">
              Add New Employee
            </h3>

            {/* Employee Name */}
            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                Employee Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anna Lindqvist"
                className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                required
              />
            </div>

            {/* Role */}
            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                <option value="Care Assistant">Care Assistant</option>
                <option value="Senior Care Worker">Senior Care Worker</option>
                <option value="Registered Nurse (RN)">Registered Nurse (RN)</option>
                <option value="Support Worker">Support Worker</option>
              </select>
            </div>

            {/* Location */}
            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                <option value="Stockholm">Stockholm</option>
                <option value="Solna">Solna</option>
                <option value="Kista">Kista</option>
                <option value="Täby">Täby</option>
              </select>
            </div>

            {/* Schedule Type Selection */}
            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                Schedule Type
              </label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as "fixed" | "flexible")}
                className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                <option value="fixed">Fixed Shift (Specific Start & End Time)</option>
                <option value="flexible">Flexible Hours</option>
              </select>
            </div>

            {/* Shift Time Fields */}
            {scheduleType === "fixed" ? (
              <div className="grid grid-cols-2 gap-2 text-left bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                    Shift Start
                  </label>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                    Shift End
                  </label>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-700 italic text-left pl-1">
                * Employee is set to Flexible Schedule without fixed timing constraint.
              </p>
            )}

            {/* Max Weekly Hours */}
            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                Max Hours / Week
              </label>
              <input
                type="number"
                value={maxHours}
                onChange={(e) => setMaxHours(Number(e.target.value))}
                className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg text-xs transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Employee Detail"}
              </button>

              <button
                type="button"
                onClick={() => setCurrentView("directory")}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                Go to Employees
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* DIRECTORY VIEW */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-teal-600 text-white p-5 rounded-xl shadow-md gap-4">
            <div>
              <h2 className="text-lg font-bold">Staff Directory</h2>
              <p className="text-xs text-slate-50 mt-0.5">Manage registered care workers</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="bg-teal-700 hover:bg-teal-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer border border-teal-700 shadow-sm"
              >
                ← Go to Main Page
              </button>

              <button
                onClick={() => setCurrentView("add")}
                className="bg-white text-teal-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-50 transition cursor-pointer shadow-sm"
              >
                + Add New Employee
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b pb-2">
              Current Staff Directory ({employees.length})
            </h4>

            {loading ? (
              <p className="text-xs text-stone-500 text-center py-6">Loading employees...</p>
            ) : employees.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6">No employees found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 font-bold uppercase border-b border-stone-200">
                    <tr>
                      <th className="p-2 w-16 text-center">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Schedule / Hours</th>
                      <th className="p-2">Location</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {employees.map((emp) => {
                      const isFixed = emp.isFixedTime ?? Boolean(emp.shiftStart && emp.shiftEnd);

                      return (
                        <tr key={emp.id} className="hover:bg-emerald-50 transition-colors">
                          <td className="p-2 font-mono text-teal-700 font-bold text-center">
                            {emp.id}
                          </td>
                          <td className="p-2 font-semibold text-stone-900">{emp.name}</td>
                          <td className="p-2">{emp.role}</td>
                          <td className="p-2">
                            {isFixed && emp.shiftStart && emp.shiftEnd ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-950 border border-emerald-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
                                <span className="font-sans font-bold text-[10px] uppercase">Fixed:</span>
                                {emp.shiftStart} - {emp.shiftEnd}
                              </span>
                            ) : (
                              <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
                                Flexible
                              </span>
                            )}
                          </td>
                          <td className="p-2">{emp.location}</td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(emp.id, emp.name)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}