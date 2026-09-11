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

export default function EmployeesDirectoryPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchEmployees();
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-teal-600 text-white p-5 rounded-xl shadow-md gap-4">
        <div>
          <h2 className="text-lg font-bold">Staff Directory</h2>
          <p className="text-xs text-slate-50 mt-0.5">Manage registered care workers</p>
        </div>
        
        <div className="flex items-center gap-2">
          

          <button
            onClick={() => router.push("/employees/add")}
            className="bg-white text-teal-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-50 transition cursor-pointer shadow-sm"
          >
            + Add New Employee
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer border border-teal-500 shadow-sm"
          >
            ← Main Page
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
              <thead className="bg-teal-50 text-stone-600 font-bold uppercase border-b border-stone-200">
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
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-950 border border-blue-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
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
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-800 px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
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
  );
}