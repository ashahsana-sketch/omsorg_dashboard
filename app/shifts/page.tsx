"use client";

import { useMemo } from "react";
import rawEmployees from "@/data/employees.json";
import rawClients from "@/data/client.json";
import { computeRoster, Client, Employee, FinalRosterItem } from "@/lib/rosterEngine";

export default function ShiftsPage() {
  const employeesList = rawEmployees as unknown as Employee[];
  const clientsList = rawClients as unknown as Client[];

  // Roster Engine run karke saari allocations aur tasks nikalna
  const { roster } = useMemo(() => {
    return computeRoster(clientsList, employeesList);
  }, [clientsList, employeesList]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Daily Shift Roster</h1>
          <p className="text-xs text-stone-500">Active carer allocations and task schedules generated from system data.</p>
        </div>
      </div>

      {/* Rota List Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50 text-stone-700 font-bold uppercase border-b border-amber-100">
            <tr>
              <th className="p-3">Carer / Employee</th>
              <th className="p-3">Client</th>
              <th className="p-3">Location</th>
              <th className="p-3">Assigned Tasks & Duration</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {roster.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-stone-400">
                  No shift allocations found.
                </td>
              </tr>
            ) : (
              roster.map((r: FinalRosterItem, index: number) => {
                const totalMinutes = r.tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
                const totalHours = (totalMinutes / 60).toFixed(1);

                return (
                  <tr key={index} className="hover:bg-amber-50/20">
                    <td className="p-3 font-bold text-stone-900">
                      {r.primaryEmployeeName !== "Unassigned" ? (
                        <div>
                          {r.primaryEmployeeName}
                          <span className="block text-[10px] font-normal text-stone-500">{r.primaryEmployeeRole}</span>
                          {r.secondaryEmployeeName && (
                            <span className="block text-[10px] text-teal-600 mt-0.5">
                              + {r.secondaryEmployeeName} ({r.secondaryEmployeeRole})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-600">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold">{r.client.name}</td>
                    <td className="p-3">{r.client.location || "Stockholm"}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {r.tasks.map((task, idx) => (
                          <div key={idx} className="text-stone-600">
                            • {task.name} <span className="text-[10px] text-stone-400">({task.start} - {task.end}, {task.durationMinutes} mins)</span>
                          </div>
                        ))}
                        <div className="font-bold text-teal-700 mt-1">
                          Total: {totalHours}h
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === "Fully Assigned" 
                          ? "bg-teal-100 text-teal-800" 
                          : r.status === "Partially Assigned" 
                          ? "bg-amber-100 text-amber-800" 
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}