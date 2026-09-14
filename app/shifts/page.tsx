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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-teal-50 p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-teal-700">Daily Shift Roster</h1>
          <p className="text-sm text-slate-700">Active carer allocations and task schedules generated from system data.</p>
        </div>
      </div>

      {/* Roster View: Cards for Mobile, Table for Medium+ Screens */}
      {roster.length === 0 ? (
        <div className="rounded-xl border border-stone-300 bg-white p-8 text-center text-stone-700 shadow-sm">
          No shift allocations found.
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< 768px): Responsive Cards Layout */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {roster.map((r: FinalRosterItem, index: number) => {
              const totalMinutes = r.tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
              const totalHours = (totalMinutes / 60).toFixed(1);

              return (
                <div key={index} className="bg-white rounded-xl border border-stone-300 p-4 shadow-sm space-y-3">
                  {/* Status & Client Name */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs text-stone-500 block uppercase font-semibold">Client</span>
                      <h2 className="font-semibold text-stone-900 text-base">{r.client.name}</h2>
                      <p className="text-xs text-stone-600">{r.client.location || "Stockholm"}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                      r.status === "Fully Assigned" 
                        ? "bg-teal-100 text-teal-700 border border-teal-800" 
                        : r.status === "Partially Assigned" 
                        ? "bg-red-50 text-red-700 border border-red-800" 
                        : "bg-blue-100 text-blue-950 border border-blue-800"
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <hr className="border-stone-100" />

                  {/* Carer / Employee Details */}
                  <div>
                    <span className="text-xs text-stone-500 block uppercase font-semibold">Carer / Employee</span>
                    {r.primaryEmployeeName !== "Unassigned" ? (
                      <div className="text-sm font-bold text-stone-900 mt-0.5">
                        {r.primaryEmployeeName}
                        <span className="block text-[11px] font-normal text-stone-500">{r.primaryEmployeeRole}</span>
                        {r.secondaryEmployeeName && (
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            + {r.secondaryEmployeeName} ({r.secondaryEmployeeRole})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-red-700 font-bold text-sm">Unassigned</span>
                    )}
                  </div>

                  <hr className="border-stone-100" />

                  {/* Tasks & Duration */}
                  <div>
                    <span className="text-xs text-stone-500 block uppercase font-semibold mb-1">Assigned Tasks & Duration</span>
                    <div className="space-y-1 bg-stone-50 p-2.5 rounded-lg">
                      {r.tasks.map((task, idx) => (
                        <div key={idx} className="text-stone-700 text-xs">
                          • {task.name} <span className="text-[11px] text-stone-500">({task.start} - {task.end}, {task.durationMinutes}m)</span>
                        </div>
                      ))}
                      <div className="font-bold text-teal-700 text-xs pt-1 border-t border-stone-200 mt-1">
                        Total: {totalHours}h
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP & TABLET VIEW (>= 768px): Traditional Table Layout */}
          <div className="hidden md:block rounded-xl border border-stone-300 shadow-sm overflow-x-auto bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-teal-50 text-slate-800 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Carer / Employee</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Assigned Tasks & Duration</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {roster.map((r: FinalRosterItem, index: number) => {
                  const totalMinutes = r.tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
                  const totalHours = (totalMinutes / 60).toFixed(1);

                  return (
                    <tr key={index} className="hover:bg-teal-50 transition-colors">
                      <td className="p-3 font-bold text-stone-900 align-top">
                        {r.primaryEmployeeName !== "Unassigned" ? (
                          <div>
                            {r.primaryEmployeeName}
                            <span className="block text-[10px] font-normal text-stone-500">{r.primaryEmployeeRole}</span>
                            {r.secondaryEmployeeName && (
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                + {r.secondaryEmployeeName} ({r.secondaryEmployeeRole})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-700">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold align-top">{r.client.name}</td>
                      <td className="p-3 align-top">{r.client.location || "Stockholm"}</td>
                      <td className="p-3 align-top">
                        <div className="space-y-1 p-2 bg-stone-50/50 rounded-lg">
                          {r.tasks.map((task, idx) => (
                            <div key={idx} className="text-stone-700">
                              • {task.name} <span className="text-[11px] text-stone-500">({task.start} - {task.end}, {task.durationMinutes} mins)</span>
                            </div>
                          ))}
                          <div className="font-bold text-teal-700 mt-1 pt-1 border-t border-stone-200">
                            Total: {totalHours}h
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center align-top">
                        <span className={`inline-block px-3 py-1.5 rounded-full text-[11px] font-bold ${
                          r.status === "Fully Assigned" 
                            ? "bg-teal-100 text-teal-700 border border-teal-800" 
                            : r.status === "Partially Assigned" 
                            ? "bg-red-50 text-red-700 border border-red-800" 
                            : "bg-blue-100 text-blue-950 border border-blue-800"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}