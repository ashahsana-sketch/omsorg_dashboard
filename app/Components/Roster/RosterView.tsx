"use client";
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

function formatRosterDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function RosterView() {
  const [rosterData, setRosterData] = useState<FinalRosterItem[]>([]);
  const [workloads, setWorkloads] = useState<Record<string, number>>({});
  const [missingReqs, setMissingReqs] = useState<MissingStaffRequirement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const selectedWeek = useMemo(() => getISOWeekNumber(selectedDate), [selectedDate]);
  
  // Unique storage key based on the selected date string to persist overrides per day
  const dateKey = selectedDate.toISOString().split("T")[0];
  const storageKey = `roster_state_${dateKey}`;

  const isToday = selectedDate.toDateString() === today.toDateString();
  const selectedDateLabel = useMemo(() => {
    if (isToday) return "Today";
    const dayOffset = Math.round(
      (selectedDate.getTime() - today.getTime()) / 86400000
    );
    if (dayOffset === -1) return "Yesterday";
    if (dayOffset === 1) return "Tomorrow";
    return formatRosterDate(selectedDate);
  }, [isToday, selectedDate, today]);

  const [selectedClientItem, setSelectedClientItem] = useState<FinalRosterItem | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  const employeesList = rawEmployees as unknown as Employee[];

  const runCalculationAndRender = () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // Check if saved manual state exists for this specific date in localStorage
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setRosterData(parsed.roster);
        setWorkloads(parsed.workloads);
        setMissingReqs(parsed.missingReqs);
        setLoading(false);
        return;
      }

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
  }, [selectedDate, selectedWeek]);

  // Helper function to update state and persist to localStorage simultaneously
  const persistAndSetState = (
    newRoster: FinalRosterItem[],
    newWorkloads: Record<string, number>,
    newMissingReqs: MissingStaffRequirement[]
  ) => {
    setRosterData(newRoster);
    setWorkloads(newWorkloads);
    setMissingReqs(newMissingReqs);

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        roster: newRoster,
        workloads: newWorkloads,
        missingReqs: newMissingReqs,
      })
    );
  };

  const handlePrevDay = () =>
    setSelectedDate((previous) => {
      const date = new Date(previous);
      date.setDate(date.getDate() - 1);
      return date;
    });
  const handleNextDay = () =>
    setSelectedDate((previous) => {
      const date = new Date(previous);
      date.setDate(date.getDate() + 1);
      return date;
    });
  const handleToday = () => setSelectedDate(today);

  const handleResetAndRecalculate = () => {
    localStorage.removeItem(storageKey);
    runCalculationAndRender();
  };

  // Updated Manual Assignment Handling with Remaining Slot Allocation & Persistence
  const handleManualAssign = () => {
    if (!selectedClientItem || !selectedEmployeeId) return;

    const chosenStaff = employeesList.find((e) => e.id === selectedEmployeeId);
    if (!chosenStaff) return;

    const client = selectedClientItem.client;
    const totalRequiredHours = client.requiredHours || 1;
    
    const existingTasks = selectedClientItem.tasks || [];
    const alreadyAssignedHours = existingTasks.reduce(
      (sum, t) => sum + t.durationMinutes / 60,
      0
    );

    const remainingHours = Math.max(0, totalRequiredHours - alreadyAssignedHours);
    const addedHours = remainingHours > 0 ? remainingHours : totalRequiredHours;
    const reqMins = addedHours * 60;

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

    const updatedTasks = [...existingTasks, newManualTask];
    const totalAssignedMins = updatedTasks.reduce((sum, t) => sum + t.durationMinutes, 0);
    const totalAssignedHours = totalAssignedMins / 60;

    const newStatus =
      totalAssignedHours >= totalRequiredHours
        ? ("Fully Assigned" as const)
        : ("Partially Assigned" as const);

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

    const updatedWorkloads = { ...workloads };
    updatedWorkloads[chosenStaff.name] = Number(
      ((updatedWorkloads[chosenStaff.name] || 0) + addedHours).toFixed(1)
    );

    const unassignedOrPartial = updatedRoster.filter((item) => item.status !== "Fully Assigned");
    const missingSummary: Record<string, { totalHours: number; count: number; roleNeeded: string }> = {};

    unassignedOrPartial.forEach((item) => {
      const level = item.client.careLevel || "Standard Care";
      const totalH = item.client.requiredHours || 1;
      const assignedH = item.tasks.reduce((sum, t) => sum + t.durationMinutes / 60, 0);
      const unassignedH = Math.max(0, totalH - assignedH);

      let roleNeeded = "Support worker";
      if (level === "High Care") {
        roleNeeded = "Registered Nurse (RN)/ Senior Care Worker";
      } else if (level === "Standard Care") {
        roleNeeded = "Care Assistant / Support Worker";
      }

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

    persistAndSetState(updatedRoster, updatedWorkloads, updatedMissingReqs);

    setSelectedClientItem(null);
    setSelectedEmployeeId("");
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-stone-200 text-stone-600 font-semibold text-xs my-6">
        Calculating Multi-Shift Roster & Staff Assignments for {selectedDateLabel}...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold my-6">
        {errorMsg}
      </div>
    );
  }

  const totalUnassignedHours = missingReqs.reduce((sum, item) => sum + item.totalHoursNeeded, 0);
  const totalExtraStaffNeeded = missingReqs.reduce((sum, item) => sum + item.estimatedStaffCount, 0);

  return (
    <div className="space-y-6">
      {/* Day Navigation Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-teal-50/60 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="flex gap-1 text-sm font-bold uppercase text-teal-700">
            Care roster: 
            <span className="ml-2 text-sm capitalize text-slate-700">
              {formatRosterDate(selectedDate)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevDay}
            className="bg-teal-400 hover:bg-teal-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg border border-slate-200 transition cursor-pointer shadow-xs"
          >
            ← Yesterday
          </button>
          <button
            onClick={handleToday}
            className={`font-bold text-xs px-3 py-2 rounded-lg border transition cursor-pointer ${
              isToday
                ? "bg-teal-600 text-white border-teal-700 shadow-sm"
                : "bg-teal-50 hover:bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="bg-teal-400 hover:bg-teal-700 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer shadow-xs"
          >
            Tomorrow →
          </button>
        </div>
      </div>

      {/* Capacity Gap Section */}
      <div className="bg-teal-50/60 border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-lg text-left font-bold text-teal-700 pb-3">
              Staff Shortage & Gap Analysis ({selectedDateLabel})
            </h3>
            <p className="text-sm text-stone-600 mt-0.5">
              Summary of unassigned hours categorized by care level.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-amber-50/60 hover:bg-amber-100 text-slate-800 pt-1.5 font-bold text-sm rounded-md border border-amber-300 shadow-sm">
              Uncovered Hours:<span className="font-extrabold p-2">{totalUnassignedHours}h</span>
            </span>
            <span className="bg-red-700 hover:bg-red-800 text-white font-bold text-sm p-2 rounded-md shadow-xs">
              Extra Staff Needed: <span className="font-extrabold">{totalExtraStaffNeeded}</span>
            </span>

          </div>
        </div>

        {(() => {
          const allCareLevels = [
            { careLevel: "High Care", roleNeeded: "Registered Nurse (RN)/ Senior Care Worker" },
            { careLevel: "Standard Care", roleNeeded: "Care Assistant / Support Worker" },
            { careLevel: "Basic Care", roleNeeded: "Support worker" }
          ];

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {allCareLevels.map((levelMeta, idx) => {
                const req = missingReqs.find((r) => r.careLevel === levelMeta.careLevel) || {
                  careLevel: levelMeta.careLevel,
                  roleNeeded: levelMeta.roleNeeded,
                  unassignedClientsCount: 0,
                  totalHoursNeeded: 0,
                  estimatedStaffCount: 0,
                };

                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2.5 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-center ">
                      <h2 className={`text-md font-bold p-2 rounded-2xl  ${
                        req.careLevel === "High Care"
                          ? "text-red-800"
                          : req.careLevel === "Basic Care"
                          ? "text-emerald-800"
                          : "text-amber-800"
                      }`}>
                        {req.careLevel}
                      </h2>
                    </div>

                    <div className="text-xs text-teal-700 font-semibold">
                      Role: {req.roleNeeded}
                    </div>

                    <div className="text-sm text-stone-800">
                      Required Hours: <strong className="text-stone-900">{req.totalHoursNeeded}h</strong>
                    </div>

                    <div>
                      <div className={`text-[11px] font-bold inline-block px-3 py-1.5 rounded-xl border ${
                        req.estimatedStaffCount > 3
                          ? "bg-red-50 text-red-700 border-red-300"
                          : req.estimatedStaffCount >= 1
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-emerald-50 text-emerald-700 border-emerald-300"
                      }`}>
                        Need:<span className="font-extrabold text-slate-900">{req.estimatedStaffCount}</span> Staff Member(s)
                      </div>
                    </div>
                    <span className={`text-lg px-2 py-0.5 rounded font-bold  ${
                        req.unassignedClientsCount > 3
                          ? "text-red-700"
                          : req.unassignedClientsCount >= 1
                          ? "text-amber-600"
                          : "text-emerald-700"
                      }`}>
                      <span className="text-black">{req.unassignedClientsCount}</span> unserved Client(s)
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Header */}
      <div className="bg-teal-50/60 text-teal-700 p-5 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <h2 className="text-lg text-left px-2 font-bold">Dynamic Care Roster Engine</h2>
          <p className="text-sm p-3 text-stone-600">
            Automated Allocation with Manual Assignment Fallback
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetAndRecalculate}
            className="bg-amber-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-amber-700 transition cursor-pointer shadow-sm text-xs"
          >
            Reset & Recalculate
          </button>
        </div>
      </div>

      {/* Main Roster Table */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-teal-50/60 text-teal-800 font-bold uppercase border-b border-stone-200">
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
                <tr key={`${item.client.id}-${selectedWeek}`} className="hover:bg-stone-100 border-2 border-stone-200 transition-colors">
                  <td className="p-3  font-bold text-stone-400 text-center">
                    {index + 1}
                  </td>

                  {/* Client Details */}
                  <td className="p-3 align-middle space-y-1.5">
                    <h2 className=" font-bold text-[15px] text-stone-900">{item.client.name}</h2>
                    <div className="text-[12px] text-stone-700">
                     ID:{item.client.id} | {item.client.location}
                    </div>
                    <div className="mt-1 grid grid-cols-1 gap-2">
                    <span
  className={`px-1.5 py-0.5 block-inline rounded text-[11px] font-bold ${
    item.client.careLevel === "High Care"
      ? "bg-red-50 text-red-700 outline-1"
      : item.client.careLevel === "Standard Care"
      ? "bg-blue-50 text-blue-700 outline-1"
      : item.client.careLevel === "Low Care"
      ? "bg-emerald-50 text-emerald-800 outline-1"
      : "bg-teal-50 text-teal-800 outline-1"
  }`}
>
  {item.client.careLevel}
</span>

                      <span
                        className={`px-1.5 py-0.5 rounded text-[12px] font-bold ${
                          item.client.isFixedTime
                            ? "bg-red-50/60   text-red-500 outline-1"
                            : "bg-cyan-50 text-cyan-700 outline-1"
                        }`}
                      >
                        {item.client.isFixedTime ? "Fixed Time" : " Flexible Time"}
                      </span>
                    
                    </div>
                  </td>

                  {/* Shift Time Slots */}
                  <td className="p-3 align-middle space-y-1.5">
                    {item.tasks.length > 0 ? (
                      item.tasks.map((task, idx) => (
  <div
  key={task.id}
  className="grid grid-cols-1 items-center gap-2 bg-teal-700 text-white text-[11px] p-2 rounded-2xl"
>
  <span className="w-fit rounded-md bg-teal-50 px-2 py-0.5 font-bold text-teal-800">
    Shift {idx + 1}:
  </span>

  <span>
    Time: {task.start} - {task.end}
  </span>

  <span>
    Total hours: {(task.durationMinutes / 60).toFixed(1)}h
  </span>
</div>
                      ))
                    ) : (
                      <span className="bg-red-50 text-red-700 font-bold text-xs px-2.5 py-1 rounded-md inline-block">
                        No Slot Available
                      </span>
                    )}
                  </td>

                  {/* Assigned Staff */}
                  <td className="p-3 align-middle space-y-2">
                    {item.tasks.length > 0 ? (
                      item.tasks.map((task, idx) => (
                        <div key={task.id} className="bg-stone-50 p-1.5 rounded border border-stone-200 outline-1">
                          <div className="text-[11px] font-bold text-emerald-950">
                            {idx + 1}. {task.assignedStaffName}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            ID: {task.assignedStaffId}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-stone-400 font-bold text-xs outline-1">Unassigned</div>
                    )}
                  </td>

                  {/* Hours */}
                  <td className="p-3 text-center align-middle font-bold text-sm">
                    {item.client.requiredHours}h
                  </td>

                  {/* Status & Manual Action Button */}
                  <td className="p-3 text-center align-middle space-y-2">
                    <div>
                      <span
  className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap ${
    item.status === "Fully Assigned"
      ? "bg-emerald-100 text-emerald-800"
      : item.status === "Partially Assigned"
      ? "bg-amber-100 text-amber-900"
      : "bg-red-50 text-red-700"
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
                        className="bg-red-700 hover:bg-red-800 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-md shadow-xs transition cursor-pointer inline-block"
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
      <div className="bg-teal-50/60 shadow-md p-4  justify-between rounded-xl border border-stone-200">
        <h2 className="text-lg text-teal-700 text-left px-2 font-bold">
          Calculated Staff Workload Summary ({selectedDateLabel})</h2>
          <p className="text-sm p-3 text-stone-900 text-left">{employeesList.length} Staff Members working today...</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(workloads).map(([name, hours]) => (
            <div key={name} className="bg-white p-2.5 rounded border border-stone-200 shadow-sm">
              <div className="text-stone-500 text-[11px] font-semibold"><span className="font-bold text-teal-700  pb-2">{name}</span></div>
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
                Manual Staff Assignment ({selectedDateLabel})
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
                <span className="font-semibold text-red-700">
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
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-teal-600 outline-none"
              >
                <option value="">-- Choose Staff Member --</option>
                {employeesList.map((emp) => {
                  const currentAllocated = workloads[emp.name] || 0;
                  const careLevel = selectedClientItem.client.careLevel;
                  const empRole = (emp.role || "").toLowerCase();
                  const empQual = (emp.qualification || "").toLowerCase();

                  let roleMismatch = false;
                  if (careLevel === "High Care") {
                    const isNurse = empRole.includes("nurse") || empRole.includes("rn") || empQual.includes("rn");
                    if (!isNurse) roleMismatch = true;
                  }

                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) - Current: {currentAllocated}h/8h
                      {roleMismatch ? " ⚠️ [Role Mismatch]" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="block pt-2 border-t border-stone-100 text-right">
              <button
                onClick={() => setSelectedClientItem(null)}
                className="px-3 py-1.5 mr-2 rounded-lg border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAssign}
                disabled={!selectedEmployeeId}
                className={`px-4 py-1.5 rounded-lg text-white font-bold text-xs transition cursor-pointer ${
                  selectedEmployeeId
                    ? "bg-teal-600 hover:bg-teal-700"
                    : "bg-slate-200 cursor-not-allowed"
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