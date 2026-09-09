"use client";
import link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  computeRoster,
  FinalRosterItem,
  MissingStaffRequirement,
  Client,
  Employee,
  Task,
} from "@/lib/rosterEngine";

import rawClients from "@/data/client.json";
import rawEmployees from "@/data/employees.json";

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function RosterView() {
  const [rosterData, setRosterData] = useState<FinalRosterItem[]>([]);
  const [workloads, setWorkloads] = useState<Record<string, number>>({});
  const [missingReqs, setMissingReqs] = useState<MissingStaffRequirement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const currentWeekNumber = useMemo(() => getISOWeekNumber(new Date()), []);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeekNumber);

  const [selectedClientItem, setSelectedClientItem] = useState<FinalRosterItem | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  const employeesList = rawEmployees as unknown as Employee[];

  const runCalculationAndRender = () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const clients = rawClients as unknown as Client[];
      const shuffledClients = [...clients].sort(() => Math.sin(selectedWeek) - 0.5);

      const { roster, employeeWorkloads, missingRequirements } = computeRoster(
        shuffledClients,
        employeesList
      );

      setRosterData(roster);
      setWorkloads(employeeWorkloads);
      setMissingReqs(missingRequirements);
    } catch (err: unknown) {
      console.error("Calculation Error:", err);
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setErrorMsg("Algorithm Execution Error: " + message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCalculationAndRender();
  }, [selectedWeek]);

  const handlePrevWeek = () => setSelectedWeek((prev) => (prev > 1 ? prev - 1 : 52));
  const handleNextWeek = () => setSelectedWeek((prev) => (prev < 52 ? prev + 1 : 1));
  const handleCurrentWeek = () => setSelectedWeek(currentWeekNumber);

  // Updated Manual Assignment Handling with Remaining Slot Allocation
  const handleManualAssign = () => {
    if (!selectedClientItem || !selectedEmployeeId) return;

    const chosenStaff = employeesList.find((e) => e.id === selectedEmployeeId);
    if (!chosenStaff) return;

    const client = selectedClientItem.client;
    const totalRequiredHours = client.requiredHours || 1;
    
    // Check if there are already existing tasks (e.g., partial assignments)
    const existingTasks = selectedClientItem.tasks || [];
    const alreadyAssignedHours = existingTasks.reduce(
      (sum, t) => sum + t.durationMinutes / 60,
      0
    );

    // Calculate remaining hours to cover
    const remainingHours = Math.max(0, totalRequiredHours - alreadyAssignedHours);
    const addedHours = remainingHours > 0 ? remainingHours : totalRequiredHours;
    const reqMins = addedHours * 60;

    // Determine start and end based on staff shifts or remaining slots
    const startHour = chosenStaff.shiftStart || "08:00";
    const [sHour, sMin] = startHour.split(":").map(Number);
    const calculatedEndHour = Math.min(22, sHour + Math.ceil(addedHours));
    const endHourStr = `${String(calculatedEndHour).padStart(2, "0")}:${String(sMin || 0).padStart(2, "0")}`;

    const newManualTask: Task = {
      id: `task-${client.id}-manual-${Date.now()}`,
      name: `Manual Shift (${client.careLevel})`,
      durationMinutes: reqMins,
      start: startHour,
      end: endHourStr,
      assignedStaffId: chosenStaff.id,
      assignedStaffName: chosenStaff.name,
    };

    // Combine existing tasks with the newly assigned slot
    const updatedTasks = [...existingTasks, newManualTask];
    const totalAssignedMins = updatedTasks.reduce((sum, t) => sum + t.durationMinutes, 0);
    const totalAssignedHours = totalAssignedMins / 60;

    const newStatus =
      totalAssignedHours >= totalRequiredHours
        ? ("Fully Assigned" as const)
        : ("Partially Assigned" as const);

    // 1. Update Roster State
    const updatedRoster = rosterData.map((item) => {
      if (item.client.id === client.id) {
        return {
          ...item,
          tasks: updatedTasks,
          primaryEmployeeId: chosenStaff.id,
          primaryEmployeeName: chosenStaff.name,
          primaryEmployeeRole: chosenStaff.role,
          status: newStatus,
        };
      }
      return item;
    });

    // 2. Update Workloads State dynamically
    const updatedWorkloads = { ...workloads };
    updatedWorkloads[chosenStaff.name] = Number(
      ((updatedWorkloads[chosenStaff.name] || 0) + addedHours).toFixed(1)
    );

    // 3. Recalculate Gap Summary
    const unassignedOrPartial = updatedRoster.filter((item) => item.status !== "Fully Assigned");
    const missingSummary: Record<string, { totalHours: number; count: number; roleNeeded: string }> = {};

    unassignedOrPartial.forEach((item) => {
      const level = item.client.careLevel || "Standard Care";
      const totalH = item.client.requiredHours || 1;
      const assignedH = item.tasks.reduce((sum, t) => sum + t.durationMinutes / 60, 0);
      const unassignedH = Math.max(0, totalH - assignedH);

      const roleNeeded = level === "High Care" ? "Registered Nurse (RN)" : "Care Assistant / Carer";

      if (!missingSummary[level]) {
        missingSummary[level] = { totalHours: 0, count: 0, roleNeeded };
      }

      missingSummary[level].totalHours += unassignedH;
      missingSummary[level].count += 1;
    });

    const updatedMissingReqs: MissingStaffRequirement[] = Object.entries(missingSummary).map(
      ([careLevel, data]) => ({
        careLevel,
        roleNeeded: data.roleNeeded,
        unassignedClientsCount: data.count,
        totalHoursNeeded: Number(data.totalHours.toFixed(1)),
        estimatedStaffCount: Math.ceil(data.totalHours / 8),
      })
    );

    setRosterData(updatedRoster);
    setWorkloads(updatedWorkloads);
    setMissingReqs(updatedMissingReqs);

    // Reset Modal
    setSelectedClientItem(null);
    setSelectedEmployeeId("");
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-stone-200 text-stone-600 font-semibold text-xs my-6">
        Calculating Multi-Shift Roster & Staff Assignments for Week {selectedWeek}...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold my-6">
        {errorMsg}
      </div>
    );
  }

  const totalUnassignedHours = missingReqs.reduce((sum, item) => sum + item.totalHoursNeeded, 0);
  const totalExtraStaffNeeded = missingReqs.reduce((sum, item) => sum + item.estimatedStaffCount, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
     

      {/* Week Navigation Controls */}
      <div className="flex items-center justify-between bg-stone-100 p-3 rounded-xl border border-stone-200">
        <span className="text-xs font-bold text-stone-700 uppercase">Current Week {selectedWeek} {selectedWeek === currentWeekNumber ? "(Current)" : ""} </span>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevWeek}
            className="bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs px-3 py-2 rounded-lg border border-stone-300 transition cursor-pointer shadow-xs"
          >
            ← Prev Week
          </button>
          <button
            onClick={handleCurrentWeek}
            className={`font-bold text-xs px-3 py-2 rounded-lg border transition cursor-pointer ${
              selectedWeek === currentWeekNumber
                ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                : "bg-white hover:bg-stone-50 text-stone-700 border-stone-300"
            }`}
          >
            Current Week ({currentWeekNumber})
          </button>
          <button
            onClick={handleNextWeek}
            className="bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer shadow-xs"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Capacity Gap Section */}
      <div className="bg-amber-50 border border-amber-400 p-5 rounded-xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-amber-900 uppercase">
              Staff Shortage & Gap Analysis (Week {selectedWeek})
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Summary of unassigned hours categorized by care level.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-amber-200 text-amber-900 font-bold text-xs px-3 py-1 rounded-md">
              Uncovered Hours: {totalUnassignedHours}h
            </span>
            <span className="bg-rose-700 text-white font-bold text-xs px-3 py-1 rounded-md">
            Extra Staff Needed: {totalExtraStaffNeeded}
            </span>
          </div>
        </div>

        {missingReqs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {missingReqs.map((req, idx) => (
              <div
                key={idx}
                className="bg-white border border-amber-200 p-3 rounded-lg shadow-xs space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-stone-800">
                    {req.careLevel}
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                    {req.unassignedClientsCount} Clients
                  </span>
                </div>
                <div className="text-xs text-teal-800 font-semibold">
                  Role: {req.roleNeeded}
                </div>
                <div className="text-xs text-stone-600">
                  Required: <strong className="text-stone-900">{req.totalHoursNeeded} Hours</strong>
                </div>
                <div className="text-[11px] font-bold bg-teal-500 inline-block p-3 text-rose-700 rounded-2xl border-t border-stone-100">
                  Needs ={req.estimatedStaffCount} Staff Shift(s)
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded-lg text-xs font-bold text-center">
            All client hours are fully covered for Week {selectedWeek}! No unassigned clients remaining.
          </div>
        )}
      </div>
 {/* Header */}
      <div className="bg-teal-600 text-white p-5 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <h2 className="text-lg font-bold">Dynamic Care Roster Engine</h2>
          <p className="text-xs text-white mt-0.5">
            Automated Allocation with Manual Assignment Fallback
          </p>
        </div>
        <button
          onClick={runCalculationAndRender}
          className="bg-white text-teal-900 font-bold text-xs px-4 py-2 rounded-lg hover:bg-teal-50 transition cursor-pointer shadow-sm"
        > Recalculate Roster</button>
      </div>
      {/* Main Roster Table */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-900 font-bold uppercase border-b border-stone-200">
              <tr>
                <th className="p-3 text-center">#</th>
                <th className="p-3">Client Info</th>
                <th className="p-3">Allocated Shift Time(s)</th>
                <th className="p-3">Assigned Staff</th>
                <th className="p-3 text-center">Total Hours</th>
                <th className="p-3 text-center">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {rosterData.map((item, index) => (
                <tr key={`${item.client.id}-${selectedWeek}`} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-stone-400 text-center ">
                    {index + 1}
                  </td>

                  {/* Client Details */}
                  <td className="p-3 align-top">
                    <div className="font-bold text-stone-900">{item.client.name}</div>
                    <div className="text-[10px] text-stone-700 font-mono">
                      {item.client.id} | {item.client.location}
                    </div>
                    <div className="mt-1 flex gap-2 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          item.client.careLevel === "High Care"
                            ? "bg-rose-100 text-rose-700 outline-1"
                            : "bg-blue-100 text-blue-700 outline-1"
                        }`}
                      >
                        {item.client.careLevel}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          item.client.isFixedTime
                            ? "bg-amber-100 text-amber-800 outline-1"
                            : "bg-purple-100 text-purple-800 outline-1 "
                        }`}
                      >
                        {item.client.isFixedTime ? "Fixed Time" : "Flexible"}
                      </span>
                    </div>
                  </td>

                  {/* Shift Time Slots */}
                  <td className="p-3 align-top space-y-1.5 ">
                    {item.tasks.length > 0 ? (
                      item.tasks.map((task, idx) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <span className="bg-teal-600 text-white font-mono text-[11px] px-2.5 py-1 rounded-r-2xl font-bold shadow-xs">
                            Shift {idx + 1}: {task.start} - {task.end}
                          </span>
                          <span className="text-[10px] bg-stone-100 outline-1 text-stone-600 px-1.5 py-0.5 rounded font-bold">
                            {(task.durationMinutes / 60).toFixed(1)}h
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="bg-rose-100 text-rose-700 font-bold text-xs px-2.5 py-1 rounded-md inline-block">
                        No Slot Available
                      </span>
                    )}
                  </td>

                  {/* Assigned Staff */}
                  <td className="p-3 align-top space-y-2">
                    {item.tasks.length > 0 ? (
                      item.tasks.map((task, idx) => (
                        <div key={task.id} className="bg-stone-50 p-1.5 rounded border border-stone-200 outline-1">
                          <div className="text-[11px] font-bold text-teal-900 ">
                            {idx + 1}. {task.assignedStaffName}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            ID: {task.assignedStaffId}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-stone-400 font-bold text-xs outline-1">Unassigned</div>
                    )}
                  </td>

                  {/* Hours */}
                  <td className="p-3 text-center align-top font-bold font-mono text-sm ">
                    {item.client.requiredHours}h
                  </td>

                  {/* Status & Manual Action Button */}
                  <td className="p-3 text-center align-top space-y-2 ">
                    <div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px]  font-bold ${
                          item.status === "Fully Assigned"
                            ? "bg-emerald-100 text-emerald-800  outline-1 p-3"
                            : item.status === "Partially Assigned"
                            ? "bg-amber-100 text-amber-800  outline-1 p-3"
                            : "bg-rose-100 text-rose-800 outline-1 p-3"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {item.status !== "Fully Assigned" && (
                      <button
                        onClick={() => {
                          setSelectedClientItem(item);
                          setSelectedEmployeeId("");
                        }}
                        className="bg-rose-700 hover:bg-rose-400 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-md shadow-xs transition cursor-pointer inline-block"
                      >
                        + Assign Manually
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Workloads */}
      <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
        <h3 className="text-xs font-bold uppercase text-stone-600 mb-2">
          Calculated Staff Workload Summary (Week {selectedWeek})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(workloads).map(([name, hours]) => (
            <div key={name} className="bg-white p-2.5 rounded border border-stone-200 shadow-sm">
              <div className="text-stone-500 text-[10px] font-semibold">{name}</div>
              <div className="font-bold text-stone-800">{hours} / 8.0 hrs allocated</div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Assignment Modal */}
      {selectedClientItem && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 border border-stone-200">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-800 text-sm">
                Manual Staff Assignment (Week {selectedWeek})
              </h3>
              <button
                onClick={() => setSelectedClientItem(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-lg text-xs space-y-1 text-stone-700">
              <div>
                <strong>Client:</strong> {selectedClientItem.client.name}
              </div>
              <div>
                <strong>Care Level:</strong>{" "}
                <span className="font-semibold text-rose-700">
                  {selectedClientItem.client.careLevel}
                </span>
              </div>
              <div>
                <strong>Total Required Hours:</strong> {selectedClientItem.client.requiredHours} Hours
              </div>
              {selectedClientItem.tasks.length > 0 && (
                <div className="text-amber-700 font-semibold pt-1">
                  ⚠️ Already Assigned: {selectedClientItem.tasks.reduce((acc, t) => acc + t.durationMinutes / 60, 0)}h (Remaining slot will be added)
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">
                Select Available Employee:
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Choose Staff Member --</option>
                {employeesList.map((emp) => {
                  const currentAllocated = workloads[emp.name] || 0;
                  const isHighCare = selectedClientItem.client.careLevel === "High Care";
                  const empRole = (emp.role || "").toLowerCase();
                  const empQual = (emp.qualification || "").toLowerCase();
                  const isNurse =
                    empRole.includes("nurse") ||
                    empRole.includes("rn") ||
                    empQual.includes("rn");

                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) - Current: {currentAllocated}h/8h
                      {isHighCare && !isNurse ? " ⚠️ [Not RN]" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setSelectedClientItem(null)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAssign}
                disabled={!selectedEmployeeId}
                className={`px-4 py-1.5 rounded-lg text-white font-bold text-xs transition cursor-pointer ${
                  selectedEmployeeId
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-stone-300 cursor-not-allowed"
                }`}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}